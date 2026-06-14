// ─────────────────────────────────────────────────────────────────────────────
// validation.ts — اعتبارسنجیِ ورودی‌های احرازهویت با regex (DECISION-087)
//
// منبعِ واحدِ regexها برای صفحاتِ ورود/ثبت‌نام/بازیابی — تا کلاینت پیش از ارسال،
// با پیامِ فارسیِ واضح خطا بدهد. سرور همچنان اعتبارسنجیِ مستقلِ خود را دارد
// (normalizeEmail/normalizeIranPhone) — این لایه فقط تجربهٔ کاربری را بهتر می‌کند.
// جهتِ ارقام: ورودیِ موبایل پیش از تطبیق با onlyDigits نرمال می‌شود (فارسی→لاتین).
// ─────────────────────────────────────────────────────────────────────────────

import { onlyDigits } from "@/lib/utils/digits";

/** موبایل ایران: ۱۱ رقم، شروع با ۰۹ (پس از نرمال‌سازیِ ارقام). */
export const RE_IRAN_MOBILE = /^09\d{9}$/;

/** ایمیل: ساده اما مقاوم — یک @ و یک دامنه با حداقل یک نقطه. */
export const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** نام‌کاربری: حروف/ارقام لاتین و زیرخط، ۳ تا ۲۰ کاراکتر. */
export const RE_USERNAME = /^[a-zA-Z0-9_]{3,20}$/;

/** کدِ OTP/تأیید: دقیقاً ۶ رقم. */
export const RE_OTP = /^\d{6}$/;

export function isValidIranMobile(raw: string): boolean {
  return RE_IRAN_MOBILE.test(onlyDigits(raw));
}

export function isValidEmail(raw: string): boolean {
  return RE_EMAIL.test(raw.trim());
}

export function isValidUsername(raw: string): boolean {
  return RE_USERNAME.test(raw.trim());
}

/** شناسهٔ ورود = ایمیل یا نام‌کاربری (مسیرِ ورود با ایمیل/نام‌کاربری). */
export function isValidIdentifier(raw: string): boolean {
  const v = raw.trim();
  return isValidEmail(v) || isValidUsername(v);
}

export function isValidOtp(raw: string): boolean {
  return RE_OTP.test(onlyDigits(raw));
}

// ─── پیام‌های خطای استاندارد (فارسیِ اصیل، بدون لحنِ خشن) ─────────────────────
export const VALIDATION_MSG = {
  mobile: "شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.",
  email: "ایمیل معتبر نیست — نمونه: you@example.com",
  identifier: "ایمیل یا نام کاربری معتبر وارد کن.",
  passwordEmpty: "رمز عبور را وارد کن.",
  otp: "کد تأیید باید ۶ رقم باشد.",
} as const;
