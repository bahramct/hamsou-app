// ─────────────────────────────────────────────────────────────────────────────
// تایپ‌های لایه Email — همسو (DECISION-058)
// مستقل از هر Email Provider (Mock، آینده: SMTP/Resend/Mailgun/...)
// ─────────────────────────────────────────────────────────────────────────────

// نتیجه ارسال ایمیل
export interface SendEmailResult {
  success: boolean;
  // شناسه پیام در Provider (برای tracking) — در Mock می‌تواند ثابت باشد
  messageId?: string;
  error?: string;
}
