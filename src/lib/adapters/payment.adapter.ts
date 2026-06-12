// ─────────────────────────────────────────────────────────────────────────────
// PaymentAdapter Interface — همسو (DECISION-071)
// تمام پیاده‌سازی‌های درگاهِ پرداخت باید این interface را پیاده‌سازی کنند.
// هرگز در کد کسب‌وکار مستقیم به یک درگاه وصل نشو — همیشه از این interface استفاده کن.
// (آینهٔ SMSAdapter/EmailAdapter برای کانالِ پرداخت.)
//
// جریان دو-مرحله‌ای (مدلِ زرین‌پال و اکثر درگاه‌های ایرانی):
//   ۱. requestPayment → authority + لینکِ هدایت به درگاه (startPayUrl)
//   ۲. (کاربر در درگاه پرداخت می‌کند و به callback برمی‌گردد)
//   ۳. verifyPayment → تأییدِ نهایی + ref_id بانکی
//
// ⚠️ مبلغ همیشه به **تومان** پاس داده می‌شود (واحدِ کیف‌پولِ همسو). آداپتر در صورت
//    نیاز خودش به واحدِ درگاه تبدیل می‌کند.
// ⚠️ هیچ متدی throw نمی‌کند؛ نتیجهٔ structured برمی‌گرداند تا جریانِ پرداخت نشکند.
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentRequestInput {
  /** مبلغ به تومان */
  amount: number;
  /** توضیحِ تراکنش (روی صفحهٔ درگاه دیده می‌شود) */
  description: string;
  /** آدرسِ بازگشت — درگاه با ?Authority=...&Status=OK|NOK به اینجا redirect می‌کند */
  callbackUrl: string;
  /** شماره موبایلِ کاربر (اختیاری — برای پیش‌پُرکردنِ درگاه) */
  mobile?: string;
}

export type PaymentRequestResult =
  | { ok: true; authority: string; startPayUrl: string }
  | { ok: false; error: string; code?: number };

export interface PaymentVerifyInput {
  /** مبلغ به تومان — همان مبلغِ ذخیره‌شده در تراکنش (هرگز از query کاربر) */
  amount: number;
  /** authority بازگشتی از درگاه */
  authority: string;
}

export type PaymentVerifyResult =
  | { ok: true; refId: string; cardPan?: string; alreadyVerified: boolean }
  | { ok: false; error: string; code?: number };

export interface PaymentAdapter {
  /** شروعِ پرداخت — authority و لینکِ هدایت به درگاه را برمی‌گرداند. */
  requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult>;

  /** تأییدِ نهاییِ پرداخت پس از بازگشت از درگاه — ref_id بانکی را برمی‌گرداند. */
  verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;
}
