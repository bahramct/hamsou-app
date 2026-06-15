// ─────────────────────────────────────────────────────────────────────────────
// scripts/shoot.mjs — هارنسِ اسکرین‌شاتِ صفحاتِ authenticated برای مقایسه با ماکاپ.
// روال: dev را بالا می‌آورد → با OTPِ dev لاگین می‌کند → کمی داده seed می‌کند →
// با Chrome سیستمی (playwright-core) از صفحات اسکرین می‌گیرد در mockups/_shots/.
//
// اجرا:  node scripts/shoot.mjs [page1 page2 ...]   (پیش‌فرض: dashboard goal)
// نیازمند: dev mode (NEXT_PUBLIC_APP_MODE=development) تا devCode برگردد.
// ─────────────────────────────────────────────────────────────────────────────

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const PHONE = "09120000000";
const OUT = "mockups/_shots";
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : ["dashboard", "goal"];
const ROUTES = { dashboard: "/dashboard", goal: "/goal", "goal-history": "/goal/history", profile: "/settings/profile" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitReady(timeoutMs = 180000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/login`, { redirect: "manual" });
      if (r.status > 0) return true;
    } catch {}
    await sleep(1500);
  }
  throw new Error("dev server did not become ready");
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  console.log("· starting next dev …");
  const dev = spawn("npm", ["run", "dev"], { shell: true, stdio: ["ignore", "pipe", "pipe"] });
  dev.stdout.on("data", (d) => { if (/error|Error/.test(String(d))) process.stdout.write(String(d)); });
  dev.stderr.on("data", (d) => process.stderr.write(String(d)));

  const cleanup = () => { try { dev.kill("SIGTERM"); } catch {} };
  process.on("exit", cleanup);

  try {
    await waitReady();
    console.log("· dev ready");

    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, locale: "fa-IR" });
    const api = ctx.request;

    // ── لاگین با OTPِ dev ──
    const ro = await (await api.post(`${BASE}/api/auth/request-otp`, { data: { phone: PHONE } })).json();
    const code = ro.devCode;
    if (!code) throw new Error("no devCode — is NEXT_PUBLIC_APP_MODE=development?");
    await api.post(`${BASE}/api/auth/verify-otp`, { data: { phone: PHONE, code } });
    console.log("· logged in (cookie in context)");

    // ── بستنِ onboarding (تا /settings/profile ریدایرکت نشود) + نامِ نمایشی ──
    try { await api.post(`${BASE}/api/onboarding/complete`, { data: { displayName: "بهرام برازنده" } }); } catch {}

    // ── seed سبک (نادیده‌گرفتنِ خطاها) ──
    try { await api.post(`${BASE}/api/dev/seed/full-week`, { data: {} }); } catch {}
    try {
      const today = new Date();
      const iso = (d) => d.toISOString().slice(0, 10);
      const end = new Date(today.getTime() + 13 * 86400000);
      await api.post(`${BASE}/api/goal`, { data: { title: "سه‌هفته نوشتنِ روزانه", type: "goal", startIso: iso(today), endIso: iso(end) } });
    } catch {}

    // ── اسکرین‌شات ──
    const page = await ctx.newPage();
    for (const name of PAGES) {
      const route = ROUTES[name] ?? `/${name}`;
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 120000 });
      await sleep(1200);
      const path = `${OUT}/${name}.png`;
      await page.screenshot({ path, fullPage: true });
      console.log(`· shot → ${path}`);
    }

    await browser.close();
  } finally {
    cleanup();
    await sleep(500);
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
