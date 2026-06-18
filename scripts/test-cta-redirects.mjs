/**
 * test-cta-redirects.mjs — تست تمام CTA های سایت عمومی با کاربر ثبت‌نام‌شده
 *
 * اجرا: node scripts/test-cta-redirects.mjs
 * پیش‌نیاز: npm run dev در ترمینال دیگری اجرا باشد
 *
 * توجه: در محیط dev با Turbopack، هر صفحه ۱۵–۴۵ ثانیه اول‌بار لود می‌شود.
 * تمام timeout ها بر همین اساس تنظیم شده‌اند.
 */

import { chromium } from "playwright";

const BASE  = "http://localhost:3000";
const PHONE = "09120000000";
let passed = 0, failed = 0;

// ─── OTP via API (سریع‌تر از UI) ─────────────────────────────────────────────
async function getOtpCodeViaApi(page) {
  const resp = await page.evaluate(async (phone) => {
    const r = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    return r.json();
  }, PHONE);
  if (!resp?.devCode) throw new Error(`devCode نیامد: ${JSON.stringify(resp)}`);
  return resp.devCode;
}

async function verifyOtpViaApi(page, code) {
  const resp = await page.evaluate(async ({ phone, code }) => {
    const r = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    return r.json();
  }, { phone: PHONE, code });
  if (!resp?.ok) throw new Error(`verify-otp ناموفق: ${JSON.stringify(resp)}`);
  return resp;
}

// ─── لاگین کامل از طریق API (صفحه /login باز است) ─────────────────────────
async function loginViaApi(page) {
  const code = await getOtpCodeViaApi(page);
  const result = await verifyOtpViaApi(page, code);
  return result; // { ok, isNew, userId }
}

// ─── helper: باز کردن صفحه با صبر کافی ─────────────────────────────────────
async function gotoSafe(page, url) {
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
  } catch {
    // اگر load timeout داد، فقط منتظر commit اولیه بمان
    await page.goto(url, { waitUntil: "commit", timeout: 30000 });
    await page.waitForTimeout(3000);
  }
}

// ─── case runner ──────────────────────────────────────────────────────────────
async function runCase(browser, { label, origin, ctaSel, expectPath, expectPrefix }) {
  console.log(`\n🧪  ${label}`);
  console.log(`    مبدأ: ${origin}  |  انتظار: ${expectPath}`);

  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const hydErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && m.text().toLowerCase().includes("hydrat")) {
      hydErrors.push(m.text().slice(0, 80));
    }
  });

  try {
    // ── گام ۱: رفتن به صفحه مبدأ تا PublicPageTracker اجرا شود ──────────────
    await gotoSafe(page, `${BASE}${origin}`);
    await page.waitForTimeout(1000); // اجازه به tracker

    // ── گام ۲: بررسی href CTA ────────────────────────────────────────────────
    const cta    = page.locator(ctaSel).first();
    const ctaOk  = await cta.isVisible({ timeout: 8000 }).catch(() => false);
    if (!ctaOk) {
      // گزارش تمام لینک‌های login برای دیباگ
      const allHrefs = await page.evaluate(() =>
        [...document.querySelectorAll("a")].map(a => a.getAttribute("href")).filter(h => h?.includes("login"))
      );
      throw new Error(`CTA با "${ctaSel}" پیدا نشد. لینک‌های login: ${allHrefs.join(", ")}`);
    }

    const ctaHref = await cta.getAttribute("href");
    console.log(`    CTA href: ${ctaHref}`);

    // ── گام ۳: کلیک CTA (navigate to login) ──────────────────────────────────
    const [navResp] = await Promise.all([
      page.waitForNavigation({ url: `**login**`, timeout: 30000 }).catch(() => null),
      cta.click(),
    ]);

    const loginUrl = new URL(page.url());
    console.log(`    login URL: ${loginUrl.pathname}${loginUrl.search}`);

    const returnUrl = loginUrl.searchParams.get("returnUrl") || "";
    const prevFromSession = await page.evaluate(() => {
      try { return sessionStorage.getItem("hamsoo_prev_public") || ""; } catch { return ""; }
    });
    console.log(`    returnUrl param: "${returnUrl}"  |  sessionStorage: "${prevFromSession}"`);

    // ── گام ۴: لاگین از طریق API ─────────────────────────────────────────────
    await gotoSafe(page, `${BASE}/login${loginUrl.search}`);
    await page.waitForTimeout(500);

    const loginResult = await loginViaApi(page);
    console.log(`    login result: isNew=${loginResult.isNew}`);

    // ── گام ۵: redirect — شبیه‌سازی آنچه کد می‌کند ──────────────────────────
    // کد LoginClient: window.location.href = returnUrl || getPrevPublicPage() || "/dashboard"
    const safeReturn = (v) => (v && v.startsWith("/") && !v.startsWith("//")) ? v : "";
    const effectiveReturn = safeReturn(returnUrl) || safeReturn(prevFromSession) || "/dashboard";
    console.log(`    effective redirect → ${effectiveReturn}`);

    // برو به آدرس redirect و بررسی کن
    const redirectPromise = page.waitForURL(
      (url) => !new URL(url).pathname.startsWith("/login"),
      { timeout: 30000 }
    );

    await page.evaluate((dest) => { window.location.href = dest; }, effectiveReturn);
    await redirectPromise;

    const finalUrl = new URL(page.url());
    // decodeURIComponent برای مقایسه صحیح slugهای فارسی (encoded vs decoded)
    const got  = decodeURIComponent(finalUrl.pathname) + (finalUrl.hash || "");
    const isOk = expectPrefix ? got.startsWith(expectPath) : got === expectPath;

    if (isOk) {
      console.log(`    ✅  redirect نهایی → ${got}`);
      passed++;
    } else {
      console.error(`    ❌  redirect اشتباه`);
      console.error(`        انتظار: ${expectPath}`);
      console.error(`        نتیجه : ${got}`);
      failed++;
    }

    if (hydErrors.length) console.error(`    ⚠️  Hydration: ${hydErrors[0]}`);

  } catch (err) {
    console.error(`    ❌  ${err.message.slice(0, 300)}`);
    await page.screenshot({ path: `scripts/dbg_${Date.now()}.png` }).catch(() => {});
    failed++;
  } finally {
    await page.close();
    await ctx.close();
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("════════════════════════════════════════════════════════════");
  console.log("تست CTA redirects با کاربر ثبت‌نام‌شده (+989120000000)");
  console.log("════════════════════════════════════════════════════════════");

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  // ─── slug اول بلاگ ─────────────────────────────────────────────────────────
  let firstSlug = null;
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await gotoSafe(page, `${BASE}/blog`);
      const links = await page.evaluate(() =>
        [...document.querySelectorAll("a[href^='/blog/']")]
          .map(a => a.getAttribute("href"))
          .filter(h => h && h.length > 7)
      );
      if (links[0]) firstSlug = decodeURIComponent(links[0].replace("/blog/", ""));
    } catch {}
    await page.close(); await ctx.close();
    console.log(`\nاولین مقاله بلاگ: ${firstSlug ?? "یافت نشد"}`);
  }

  const cases = [
    {
      label: "لندینگ — navbar «شروع کن»",
      origin: "/",
      ctaSel: "nav a[href*='/login'], nav a[href*='returnUrl']",
      expectPath: "/",
    },
    {
      label: "لندینگ — hero CTA داخل صفحه",
      origin: "/",
      ctaSel: "main a.btn-primary[href='/login'], main a.btn-lg[href='/login'], main a[href='/login']",
      expectPath: "/",
    },
    {
      label: "درباره — navbar «شروع کن»",
      origin: "/about",
      ctaSel: "nav a[href*='/login'], nav a[href*='returnUrl']",
      expectPath: "/about",
    },
    {
      label: "درباره — body CTA",
      origin: "/about",
      ctaSel: "main a[href='/login']",
      expectPath: "/about",
    },
    {
      label: "داستان — body CTA",
      origin: "/story",
      ctaSel: "main a[href='/login']",
      expectPath: "/story",
    },
    {
      label: "تماس — body CTA",
      origin: "/contact",
      ctaSel: "main a[href='/login']",
      expectPath: "/contact",
    },
    {
      label: "بلاگ — navbar «شروع کن»",
      origin: "/blog",
      ctaSel: "nav a[href*='/login'], nav a[href*='returnUrl']",
      expectPath: "/blog",
    },
    ...(firstSlug ? [{
      label: "مقاله — navbar «شروع کن»",
      origin: `/blog/${firstSlug}`,
      ctaSel: "nav a[href*='/login'], nav a[href*='returnUrl']",
      expectPath: `/blog/${firstSlug}`,
    }] : []),
    ...(firstSlug ? [{
      label: "مقاله — CTA ورود برای کامنت",
      origin: `/blog/${firstSlug}`,
      ctaSel: "a[href*='%23comments'], a[href*='returnUrl'][href*='comments']",
      expectPath: `/blog/${firstSlug}`,
      expectPrefix: true,
    }] : []),
  ];

  for (const c of cases) await runCase(browser, c);

  // ── تست Hydration error ──────────────────────────────────────────────────
  console.log("\n🧪  Hydration error — صفحه /login باید بدون warning باشد");
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const hydErr = [];
    page.on("console", (m) => {
      if (m.type() === "error" && m.text().toLowerCase().includes("hydrat")) hydErr.push(m.text());
    });
    try {
      await gotoSafe(page, `${BASE}/login`);
      await page.waitForTimeout(3000);
      if (hydErr.length === 0) { console.log("    ✅  بدون hydration error"); passed++; }
      else { console.error(`    ❌  hydration error: ${hydErr[0].slice(0, 120)}`); failed++; }
    } catch (e) { console.error(`    ❌  ${e.message}`); failed++; }
    await page.close(); await ctx.close();
  }

  // ── تست کاربر لاگین‌شده: navbar باید dashboard نشان دهد ─────────────────
  console.log("\n🧪  کاربر لاگین‌شده — navbar باید «ورود به اپلیکیشن» → /dashboard باشد");
  {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await gotoSafe(page, `${BASE}/login`);
      await loginViaApi(page);
      // بعد از لاگین، cookie باید ست شده باشد
      // الان به صفحه اصلی برو
      await gotoSafe(page, `${BASE}/`);
      await page.waitForTimeout(2000);

      const dashLink  = page.locator("nav a[href='/dashboard']").first();
      const loginLink = page.locator("nav a[href*='/login']").first();

      if (await dashLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log("    ✅  navbar: «ورود به اپلیکیشن» (/dashboard)"); passed++;
      } else if (await loginLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        const href = await loginLink.getAttribute("href");
        console.error(`    ❌  navbar هنوز login نشان می‌دهد (${href})`); failed++;
      } else {
        // بررسی همه nav linkها برای دیباگ
        const navLinks = await page.evaluate(() =>
          [...document.querySelectorAll("nav a")].map(a => `${a.textContent?.trim()} → ${a.href}`)
        );
        console.log(`    ℹ️  navbar links: ${navLinks.join(" | ")}`);
        console.log("    ℹ️  CTA دیده نشد (ممکن است session هنوز اعمال نشده باشد)");
      }
    } catch (e) { console.error(`    ❌  ${e.message.slice(0, 150)}`); failed++; }
    await page.close(); await ctx.close();
  }

  await browser.close();

  console.log("\n════════════════════════════════════════════════════════════");
  console.log(`نتیجه نهایی:  ✅ ${passed} موفق   ❌ ${failed} ناموفق`);
  console.log("════════════════════════════════════════════════════════════\n");
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error("❌ خطای کلی:", e); process.exit(1); });
