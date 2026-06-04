// ─────────────────────────────────────────────────────────────────────────────
// EmailAdapter Interface — همسو (DECISION-058)
// تمام پیاده‌سازی‌های ایمیل باید این interface را پیاده‌سازی کنند.
// هرگز در کد کسب‌وکار مستقیم به یک Provider وصل نشو — همیشه از این interface استفاده کن.
// (آینهٔ SMSAdapter برای کانالِ ایمیل.)
// ─────────────────────────────────────────────────────────────────────────────

import type { SendEmailResult } from "@/types/email";

export interface EmailAdapter {
  /**
   * ارسال کدِ تأیید به ایمیل
   * @param email آدرس ایمیلِ مقصد
   * @param code کدِ تأییدِ تولیدشده
   * @returns نتیجهٔ ارسال
   */
  sendVerificationCode(email: string, code: string): Promise<SendEmailResult>;
}
