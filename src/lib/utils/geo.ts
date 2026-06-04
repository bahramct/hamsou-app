// ─────────────────────────────────────────────────────────────────────────────
// Geo Detection — استخراج کشور از request headers
//
// منطق:
//   - در deployment روی Vercel: header `x-vercel-ip-country` → ISO-2 (e.g., "IR", "US")
//   - در deployment روی Cloudflare: header `cf-ipcountry`
//   - در fallback: می‌توان از `x-forwarded-for` IP استخراج کرد (اما نیاز به GeoIP DB)
//   - در dev: header دستی `x-dev-country` برای تست (مثلاً force "US")
//
// DECISION-028 (به‌روزرسانی شده):
//   - country از IP → ProviderRouter
//   - locale (fa/en) جدا و انتخاب کاربر — روی User ذخیره می‌شود
// ─────────────────────────────────────────────────────────────────────────────

import { IS_DEV_MODE } from "@/lib/env";

/** کد ISO-2 کشور (e.g., "IR"، "US") یا null اگر قابل تشخیص نباشد */
export type CountryCode = string | null;

/**
 * استخراج country code از Next.js request headers
 * @param headers — معمولاً `request.headers` از NextRequest
 */
export function getCountryFromHeaders(
  headers: Headers | Record<string, string | undefined>
): CountryCode {
  const get = (name: string): string | undefined =>
    headers instanceof Headers
      ? headers.get(name) ?? undefined
      : headers[name] ?? headers[name.toLowerCase()];

  // اولویت ۱: dev override (فقط در dev)
  if (IS_DEV_MODE) {
    const devOverride = get("x-dev-country");
    if (devOverride) return devOverride.toUpperCase();
  }

  // اولویت ۲: Vercel
  const vercel = get("x-vercel-ip-country");
  if (vercel) return vercel.toUpperCase();

  // اولویت ۳: Cloudflare
  const cf = get("cf-ipcountry");
  if (cf && cf !== "XX") return cf.toUpperCase();

  return null;
}

/**
 * آیا کاربر از داخل ایران درخواست داده؟
 * توجه: اگر تشخیص ممکن نباشد، null برمی‌گردد — تصمیم routing با ProviderRouter
 */
export function isIranianRequest(country: CountryCode): boolean | null {
  if (country === null) return null;
  return country === "IR";
}
