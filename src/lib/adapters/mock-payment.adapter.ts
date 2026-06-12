// ─────────────────────────────────────────────────────────────────────────────
// MockPaymentAdapter — درگاهِ آزمایشی برای حالتِ توسعه (DECISION-071؛ CLAUDE.md §۱۳)
// هیچ شبکهٔ واقعی‌ای صدا نمی‌زند. کلِ جریان را شبیه‌سازی می‌کند:
//   requestPayment → یک authority جعلی می‌سازد و startPayUrl را مستقیم به
//                    callback خودمان با Status=OK برمی‌گرداند → جریان در dev خودش تکمیل می‌شود.
//   verifyPayment  → همیشه موفق با ref_id جعلی.
// این اجازه می‌دهد شارژِ کیف‌پول از طریقِ درگاه بدونِ پولِ واقعی و بدونِ انتظار تست شود.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  PaymentAdapter,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from "@/lib/adapters/payment.adapter";

export class MockPaymentAdapter implements PaymentAdapter {
  async requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const authority = `MOCK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    // startPayUrl مستقیم به callback خودمان — جریانِ موفق را شبیه‌سازی می‌کند
    const sep = input.callbackUrl.includes("?") ? "&" : "?";
    const startPayUrl = `${input.callbackUrl}${sep}Authority=${encodeURIComponent(authority)}&Status=OK`;
    return { ok: true, authority, startPayUrl };
  }

  async verifyPayment(_input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    void _input;
    const refId = `MOCK${Math.floor(100000 + Math.random() * 900000)}`;
    return { ok: true, refId, cardPan: "603799******1234", alreadyVerified: false };
  }
}
