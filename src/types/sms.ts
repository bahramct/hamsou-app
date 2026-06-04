// ─────────────────────────────────────────────────────────────────────────────
// تایپ‌های لایه SMS — همسو
// مستقل از هر SMS Provider (Kavenegar، Melipayamak، Mock، ...)
// ─────────────────────────────────────────────────────────────────────────────

// نتیجه ارسال OTP
export interface SendOTPResult {
  success: boolean;
  // شناسه پیام در Provider (برای tracking) — در Mock می‌تواند ثابت باشد
  messageId?: string;
  error?: string;
}
