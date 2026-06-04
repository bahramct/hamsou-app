// ─────────────────────────────────────────────────────────────────────────────
// OTP utilities — همسو
// تولید و اعتبارسنجی کدهای یکبارمصرف ۶ رقمی
// ─────────────────────────────────────────────────────────────────────────────

import { nowMs } from "@/lib/dev/time";

/**
 * تولید کد OTP ۶ رقمی تصادفی امن (100000 تا 999999)
 * از Web Crypto API استفاده می‌کند تا هم در Node.js و هم Edge runtime کار کند.
 */
export function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (array[0] % 900000) + 100000;
  return code.toString();
}

/**
 * نرمال‌سازی شماره موبایل ایران به فرمت +98XXXXXXXXXX
 * ورودی: 09XXXXXXXXX یا 9XXXXXXXXX یا +989XXXXXXXXX
 */
export function normalizeIranPhone(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, "").trim();

  // +989XXXXXXXXX
  if (/^\+989\d{9}$/.test(cleaned)) return cleaned;

  // 09XXXXXXXXX
  if (/^09\d{9}$/.test(cleaned)) return "+98" + cleaned.slice(1);

  // 9XXXXXXXXX (بدون صفر)
  if (/^9\d{9}$/.test(cleaned)) return "+98" + cleaned;

  return null;
}

/**
 * محاسبه زمان انقضای OTP بر اساس env
 */
export function getOtpExpiry(): Date {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES ?? "5", 10);
  return new Date(nowMs() + minutes * 60 * 1000);
}
