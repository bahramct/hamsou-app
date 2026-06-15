// scripts/smoke.mjs — تستِ دودِ همهٔ مسیرهای authenticated: هر صفحه را باز می‌کند و
// خطای build/runtime (اورلیِ Next) یا status>=400 یا console.error را گزارش می‌دهد.
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const PHONE = "09120000000";
const ROUTES = [
  "/dashboard", "/goal", "/goal/history", "/settings/profile",
  "/reports/weekly", "/plans", "/support", "/wallet",
];
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
  const dev = spawn("npm", ["run", "dev"], { shell: true, stdio: ["ignore", "pipe", "pipe"] });
  dev.stderr.on("data", (d) => { const s = String(d); if (/error/i.test(s)) process.stderr.write(s); });
  const cleanup = () => { try { dev.kill("SIGTERM"); } catch {} };
  process.on("exit", cleanup);

  let failures = 0;
  try {
    await waitReady();
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, locale: "fa-IR" });
    const api = ctx.request;
    const ro = await (await api.post(`${BASE}/api/auth/request-otp`, { data: { phone: PHONE } })).json();
    await api.post(`${BASE}/api/auth/verify-otp`, { data: { phone: PHONE, code: ro.devCode } });
    await api.post(`${BASE}/api/onboarding/complete`, { data: { displayName: "بهرام برازنده" } });

    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

    for (const route of ROUTES) {
      consoleErrors.length = 0;
      let status = 0;
      try {
        const resp = await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 90000 });
        status = resp ? resp.status() : 0;
      } catch (e) { console.log(`✗ ${route}  (navigation error: ${e.message})`); failures++; continue; }
      await sleep(800);
      // اورلیِ خطای Next (build/runtime) → عنصرِ nextjs-portal
      const overlay = await page.locator("nextjs-portal").count();
      const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) ?? "");
      const buildErr = /Build Error|Unhandled Runtime|doesn't exist in target module|Module not found/i.test(bodyText);
      const finalUrl = page.url().replace(BASE, "");
      const bad = status >= 400 || overlay > 0 || buildErr || consoleErrors.length > 0;
      if (bad) failures++;
      console.log(`${bad ? "✗" : "✓"} ${route}  [status ${status}${finalUrl !== route ? `, →${finalUrl}` : ""}${overlay ? ", OVERLAY" : ""}${consoleErrors.length ? `, ${consoleErrors.length} console.error` : ""}]`);
      if (consoleErrors.length) consoleErrors.slice(0, 3).forEach((e) => console.log(`    ↳ ${e.slice(0, 160)}`));
    }
    await browser.close();
  } finally {
    cleanup();
    await sleep(500);
  }
  console.log(failures === 0 ? "\nALL OK ✓" : `\n${failures} route(s) with issues ✗`);
  process.exit(failures === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
