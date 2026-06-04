// ─────────────────────────────────────────────────────────────────────────────
// app-url — آدرس پایهٔ اپ برای ساخت لینک‌های مطلق (اشتراک‌گذاری، OG image).
//
// هدف: با مهاجرت از local به سرور واقعی، هیچ سورسی دستکاری نشود.
//   • روی کلاینت: همیشه `window.location.origin` (صفر-پیکربندی — هر دامنه‌ای کار می‌کند).
//   • روی سرور: از env `NEXT_PUBLIC_APP_URL` (در .env تنظیم می‌شود)، با fallback امن.
//
// پس برای لینک‌هایی که کاربر می‌بیند/کپی می‌کند (کلاینت) هیچ env لازم نیست؛ فقط برای
// متادیتای سمت سرور (OG/metadataBase) یک env کافی است.
// ─────────────────────────────────────────────────────────────────────────────

/** آدرس پایه (بدون اسلش انتها). کلاینت → origin مرورگر؛ سرور → env یا localhost. */
export function getAppBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/+$/, "");
  return "http://localhost:3000";
}

/** لینک عمومیِ اشتراک یک گزارش هفتگی. */
export function buildShareUrl(reportId: string): string {
  return `${getAppBaseUrl()}/share/${reportId}`;
}
