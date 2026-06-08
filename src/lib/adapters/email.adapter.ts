// ─────────────────────────────────────────────────────────────────────────────
// EmailAdapter Interface — همسو (DECISION-058)
// تمام پیاده‌سازی‌های ایمیل باید این interface را پیاده‌سازی کنند.
// هرگز در کد کسب‌وکار مستقیم به یک Provider وصل نشو — همیشه از این interface استفاده کن.
// (آینهٔ SMSAdapter برای کانالِ ایمیل.)
// ─────────────────────────────────────────────────────────────────────────────

import type { SendEmailResult } from "@/types/email";

export interface EmailAdapter {
  /**
   * ارسال کدِ تأیید به ایمیل (فقط برای جریان add-email — کاربر لاگین است)
   */
  sendVerificationCode(email: string, code: string): Promise<SendEmailResult>;

  /**
   * ارسال لینک تأیید ثبت‌نام — توکن ۳۲-بایتی، منقضی‌شدنی ۲۴ ساعته
   */
  sendVerificationLink(email: string, link: string): Promise<SendEmailResult>;

  /**
   * ارسال لینک بازیابی رمز — توکن ۳۲-بایتی، منقضی‌شدنی ۱ ساعته
   */
  sendPasswordResetLink(email: string, link: string): Promise<SendEmailResult>;
}
