// scripts/shoot-profile-live.mjs — تأییدِ حالت‌های پُرِ پروفایل (تراکنش، مودال، دراور، گفتگو).
// dev را بالا می‌آورد، کاربرِ تستی را با داده‌ی واقعی پُر می‌کند و اسکرین می‌گیرد.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";
import { PrismaClient } from "@prisma/client";

process.env.DATABASE_URL ||= "file:./prisma/dev.db";
const BASE = "http://localhost:3000";
const PHONE = "09120000000";
const OUT = "mockups/_shots";
const prisma = new PrismaClient();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitReady(t = 180000) {
  const t0 = Date.now();
  while (Date.now() - t0 < t) {
    try { const r = await fetch(`${BASE}/login`, { redirect: "manual" }); if (r.status > 0) return; } catch {}
    await sleep(1500);
  }
  throw new Error("dev not ready");
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const dev = spawn("npm", ["run", "dev"], { shell: true, stdio: ["ignore", "pipe", "pipe"] });
  dev.stderr.on("data", (d) => process.stderr.write(String(d)));
  const cleanup = () => { try { dev.kill("SIGTERM"); } catch {} };
  process.on("exit", cleanup);

  try {
    await waitReady();
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2, locale: "fa-IR" });
    const api = ctx.request;

    const ro = await (await api.post(`${BASE}/api/auth/request-otp`, { data: { phone: PHONE } })).json();
    await api.post(`${BASE}/api/auth/verify-otp`, { data: { phone: PHONE, code: ro.devCode } });
    await api.post(`${BASE}/api/onboarding/complete`, { data: { displayName: "بهرام برازنده" } });

    // ── پُرکردنِ کاربرِ تستی با داده‌ی واقعی (شماره ممکن است نرمال‌شده ذخیره شده باشد) ──
    const u = await prisma.user.findFirst({ where: { phone: { contains: "9120000000" } }, orderBy: { createdAt: "desc" } });
    if (!u) throw new Error("test user not found in prisma/dev.db");
    const now = new Date();
    const dAgo = (n) => new Date(now.getTime() - n * 86400000);
    await prisma.user.update({
      where: { id: u.id },
      data: {
        plan: "PRO", planCycle: "annual", planPaidSince: dAgo(151),
        planExpiresAt: new Date(now.getTime() + 214 * 86400000),
        walletBalance: 240000, paymentCardNumber: "6037991812345678",
        bio: "در مسیر نوشتنِ روزانه و ساختنِ عادتِ تأمل.",
      },
    });
    await prisma.walletTransaction.deleteMany({ where: { userId: u.id } });
    let i = 0;
    const tx = (type, amount, status, when) => ({ userId: u.id, type, amount, status, refCode: `HM-LIVE-${Date.now()}-${i++}`, createdAt: when });
    await prisma.walletTransaction.createMany({ data: [
      tx("topup", 100000, "approved", dAgo(2)),
      tx("purchase", -290000, "completed", dAgo(13)),
      tx("topup", 50000, "pending", dAgo(2)),
      tx("topup", 20000, "rejected", dAgo(6)),
      tx("topup", 150000, "approved", dAgo(25)),
    ] });
    await prisma.supportTicket.deleteMany({ where: { userId: u.id } });
    await prisma.supportTicket.create({ data: {
      userId: u.id, subject: "مشکل در ثبت تعهد روزانه", category: "technical", status: "answered", lastMessageAt: dAgo(4),
      messages: { create: [
        { authorType: "user", authorUserId: u.id, body: "وقتی تعهد امروز را می‌نویسم، دکمهٔ ثبت کار نمی‌کند. مشکل از کجاست؟", createdAt: dAgo(4) },
        { authorType: "admin", body: "سلام بهرام عزیز. لطفاً یک‌بار صفحه را تازه کن و دوباره امتحان کن.", createdAt: dAgo(4) },
      ] },
    } });
    await prisma.supportTicket.create({ data: {
      userId: u.id, subject: "سؤال دربارهٔ صورتحساب پلن پرو", category: "billing", status: "closed", lastMessageAt: dAgo(10),
      messages: { create: [{ authorType: "user", authorUserId: u.id, body: "صورتحساب پلن پرو را از کجا ببینم؟", createdAt: dAgo(10) }] },
    } });

    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error") console.log("[console.error]", m.text()); });
    page.on("response", (r) => { if (r.url().includes("/messages") && r.request().method() === "GET") console.log("[GET messages]", r.status()); });
    await page.goto(`${BASE}/settings/profile`, { waitUntil: "networkidle", timeout: 120000 });
    await sleep(1000);
    await page.screenshot({ path: `${OUT}/profile-live.png`, fullPage: true });
    console.log("· profile-live");

    await page.click(".pf-t-finance .pf-row-link"); // مشاهدهٔ همهٔ تراکنش‌ها (تایلِ مالی)
    await sleep(700);
    await page.screenshot({ path: `${OUT}/profile-live-txmodal.png` });
    console.log("· txmodal");
    await page.keyboard.press("Escape");
    await sleep(400);

    await page.click(".pf-sup-tk", { timeout: 8000 }); // پیش‌نمایشِ تیکت (سمتِ چپ، خارج از پوششِ FAB) → دراور
    await sleep(800);
    await page.screenshot({ path: `${OUT}/profile-live-drawer.png` });
    console.log("· drawer");

    const cards = await page.$$(".pf-tk-card");
    console.log("· tk-cards:", cards.length);
    await cards[0].click(); // اولین تیکت → گفتگو
    try { await page.waitForSelector(".pf-msg", { timeout: 15000 }); } catch { console.log("· no .pf-msg appeared"); }
    await sleep(500);
    await page.screenshot({ path: `${OUT}/profile-live-thread.png` });
    console.log("· thread");

    await browser.close();
  } finally {
    await prisma.$disconnect();
    cleanup();
    await sleep(500);
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
