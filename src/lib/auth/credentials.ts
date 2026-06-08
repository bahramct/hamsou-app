// ─────────────────────────────────────────────────────────────────────────────
// auth/credentials.ts — نرمال‌سازی و اعتبارسنجیِ ایمیل و نام‌کاربری (DECISION-058)
//
// ایمیل: trim + lowercase؛ نام‌کاربری: لاتینِ کوچک + رقم + «_» (handleِ شبکهٔ
//   اجتماعیِ آینده)، یکتا. کدِ تأییدِ ایمیل ۶ رقمی (آینهٔ OTP).
// این ماژول pure است (بدون I/O) تا هم در API و هم در تست قابل‌استفاده باشد.
// ─────────────────────────────────────────────────────────────────────────────

import { nowMs } from "@/lib/dev/time";

// RFC ساده‌شده — برای UX کافی است (اعتبارِ نهایی با تأییدِ کد روی ایمیل اثبات می‌شود)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// نام‌کاربری: ۳ تا ۲۴ کاراکتر، حروفِ کوچکِ لاتین/رقم/زیرخط، شروع با حرف
const USERNAME_RE = /^[a-z][a-z0-9_]{2,23}$/;

/** ساخت توکن امن ۳۲-بایتی برای لینک‌های تأیید و بازیابی رمز (URL-safe hex). */
export function generateEmailToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** انقضای لینک تأیید ایمیل — ۲۴ ساعت. */
export function getVerificationLinkExpiry(): Date {
  return new Date(nowMs() + 24 * 60 * 60 * 1000);
}

/** انقضای لینک بازیابی رمز — ۱ ساعت. */
export function getResetLinkExpiry(): Date {
  return new Date(nowMs() + 60 * 60 * 1000);
}

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

export function isValidEmail(raw: unknown): boolean {
  return normalizeEmail(raw) !== null;
}

export function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toLowerCase();
  return USERNAME_RE.test(u) ? u : null;
}

export const USERNAME_RULE_FA =
  "نام کاربری: ۳ تا ۲۴ کاراکتر، با حروف کوچک انگلیسی شروع شود و فقط شامل حروف کوچک، رقم و زیرخط باشد.";

/** تولید کدِ ۶ رقمیِ امنِ تأییدِ ایمیل (Web Crypto — آینهٔ OTP). */
export function generateEmailCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return ((array[0] % 900000) + 100000).toString();
}

/** زمانِ انقضای کدِ ایمیل — همان سیاستِ OTP (پیش‌فرض ۵ دقیقه). */
export function getEmailCodeExpiry(): Date {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES ?? "5", 10);
  return new Date(nowMs() + minutes * 60 * 1000);
}
