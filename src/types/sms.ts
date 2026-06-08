// ─────────────────────────────────────────────────────────────────────────────
// تایپ‌های لایه SMS — همسو
// مستقل از هر SMS Provider (Kavenegar، Melipayamak، Mock، ...)
// ─────────────────────────────────────────────────────────────────────────────

// نتیجه ارسال OTP
export interface SendOTPResult {
  success: boolean;
  // شناسه پیام در Provider (برای tracking) — در Mock می‌تواند ثابت باشد
  messageId?: string;
  // کدِ وضعیتِ عددیِ Provider (مثلاً sms.ir: 1=موفق، 10=کلید نامعتبر) — برای لاگ/observability
  status?: number;
  error?: string;
}
