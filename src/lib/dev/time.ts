// ─────────────────────────────────────────────────────────────────────────────
// dev/time.ts — منبع حقیقت زمان جاری (با امکان time-travel در dev)
//
// قانون: هر کد سمت سرور که به «الان» نیاز دارد باید از `getNow()` استفاده کند،
// نه از `new Date()` یا `Date.now()`. این‌طور می‌توان در dev زمان را جابه‌جا کرد
// تا فیچرهای زمان‌محور (بازخورد فردا، گزارش هفتگی، فاصله، یادآوری) را بدون انتظار
// واقعی تست کرد. (DECISION-021)
//
// طراحی:
// - Offset در حافظه ماژول نگه‌داری می‌شود → restart سرور = بازگشت به زمان واقعی
//   (تصمیم صاحب پروژه ۲۰۲۶-۰۵-۲۷: fresh slate ساده‌تر است از persistence).
// - در prod پرچم IS_DEV_MODE = false → شاخه offset مرده است (tree-shaking).
// - این ماژول universal است (server + client). در client offset همیشه ۰ باقی
//   می‌ماند چون API set/reset روی سرور است؛ پس getNow() در client = new Date().
// ─────────────────────────────────────────────────────────────────────────────

import { IS_DEV_MODE } from "@/lib/env";

let _devOffsetMs = 0;

/**
 * زمان «الان» — در prod همیشه زمان واقعی، در dev می‌تواند جابه‌جا شده باشد.
 * این تابع جایگزین `new Date()` در همه کد سرور است.
 */
export function getNow(): Date {
  if (IS_DEV_MODE && _devOffsetMs !== 0) {
    return new Date(Date.now() + _devOffsetMs);
  }
  return new Date();
}

/**
 * timestamp «الان» — معادل `Date.now()` با احترام به offset dev.
 */
export function nowMs(): number {
  if (IS_DEV_MODE && _devOffsetMs !== 0) {
    return Date.now() + _devOffsetMs;
  }
  return Date.now();
}

/**
 * زمان هدف را تنظیم می‌کند — فقط در dev.
 * `targetMs` = timestamp زمانی که می‌خواهیم سرور فکر کند «الان» است.
 * offset محاسبه و تا restart در حافظه نگه‌داری می‌شود.
 */
export function setDevTime(targetMs: number): void {
  if (!IS_DEV_MODE) return;
  _devOffsetMs = targetMs - Date.now();
}

/** بازگشت به زمان واقعی — فقط در dev. */
export function resetDevTime(): void {
  if (!IS_DEV_MODE) return;
  _devOffsetMs = 0;
}

/**
 * Offset فعلی (ms). برای نمایش در پنل dev و health-checks.
 * در prod همیشه ۰ برمی‌گرداند.
 */
export function getDevTimeOffsetMs(): number {
  return IS_DEV_MODE ? _devOffsetMs : 0;
}

/**
 * آیا زمان dev الان جابه‌جا شده است؟ برای نمایش indicator.
 */
export function isDevTimeShifted(): boolean {
  return IS_DEV_MODE && _devOffsetMs !== 0;
}
