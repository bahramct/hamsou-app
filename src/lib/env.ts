// ─────────────────────────────────────────────────────────────────────────────
// env.ts — منبع حقیقت Mode اپلیکیشن
//
// این فایل تنها محلی است که حالت اپ (development | production) تعیین می‌شود.
// همه کدها — اعم از سرور، کلاینت، API، و UI — باید از همین جا حالت را بخوانند.
//
// طراحی:
// - متغیر تصمیم‌گیر: NEXT_PUBLIC_APP_MODE
//   چرا NEXT_PUBLIC_*؟ چون Next.js این متغیرها را در زمان build به‌صورت literal
//   inline می‌کند. در نتیجه `if (IS_DEV_MODE)` در build پروداکشن به `if (false)`
//   تبدیل و توسط ترکیب minifier+tree-shaker حذف می‌شود.
// - Fail-safe: هر مقداری غیر از "development" به production تفسیر می‌شود.
//   اگر متغیر ست نشده باشد، حالت امن = production.
// - حالت سوم (staging) عمداً پیاده‌سازی نشده. اگر در آینده نیاز شد، فقط type union
//   و سطرهای زیر گسترش می‌یابد؛ هیچ‌جای دیگری دست نمی‌خورد.
//
// قانون CLAUDE.md §۱۳: هیچ‌گاه `process.env.NODE_ENV` یا
// `process.env.NEXT_PUBLIC_APP_MODE` را مستقیماً در کد فیچر چک نکن — همیشه از
// همین exports استفاده کن.
// ─────────────────────────────────────────────────────────────────────────────

export type AppMode = "development" | "production";

const RAW_MODE = process.env.NEXT_PUBLIC_APP_MODE;

/**
 * حالت جاری اپلیکیشن — تنها مقدار قابل اعتماد برای تشخیص dev/prod.
 * در build پروداکشن این مقدار به literal تبدیل می‌شود تا tree-shaking
 * شاخه‌های dev-only را حذف کند.
 */
export const APP_MODE: AppMode =
  RAW_MODE === "development" ? "development" : "production";

/**
 * `true` فقط در حالت توسعه. در پروداکشن literal `false` می‌شود → dead code elim.
 * این پرچم را برای فعال‌سازی پنل‌ها، debug UI، یا خروجی‌های کمکی استفاده کن.
 */
export const IS_DEV_MODE: boolean = APP_MODE === "development";

/**
 * `true` فقط در حالت تولید. در dev literal `false`.
 * برای فعال‌سازی رفتارهای production-only (مثلاً ارسال SMS واقعی) استفاده کن.
 */
export const IS_PROD_MODE: boolean = APP_MODE === "production";
