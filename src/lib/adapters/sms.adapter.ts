// ─────────────────────────────────────────────────────────────────────────────
// SMSAdapter Interface — همسو
// تمام پیاده‌سازی‌های SMS باید این interface را پیاده‌سازی کنند.
// هرگز در کد کسب‌وکار مستقیم به یک Provider وصل نشو — همیشه از این interface استفاده کن.
// ─────────────────────────────────────────────────────────────────────────────

import type { SendOTPResult } from "@/types/sms";

export interface SMSAdapter {
  /**
   * ارسال کد OTP به شماره موبایل
   * @param phone شماره موبایل ایران (فرمت +98...)
   * @param code کد OTP تولیدشده
   * @returns نتیجه ارسال
   */
  sendOTP(phone: string, code: string): Promise<SendOTPResult>;
}
