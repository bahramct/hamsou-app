// ─────────────────────────────────────────────────────────────────────────────
// ZarinpalAdapter — پیاده‌سازی PaymentAdapter برای درگاهِ زرین‌پال (API v4)
// مستندات: https://www.zarinpal.com/docs/paymentGateway
//
//   request:  POST {base}/pg/v4/payment/request.json
//             body: { merchant_id, amount, currency:"IRT", description, callback_url, metadata }
//             موفق: { data: { code:100, authority, ... }, errors: [] }
//   StartPay: {base}/pg/StartPay/{authority}   ← کاربر به اینجا هدایت می‌شود
//   verify:   POST {base}/pg/v4/payment/verify.json
//             body: { merchant_id, amount, authority }
//             موفق: { data: { code:100|101, ref_id, card_pan, ... }, errors: [] }
//             code 100 = اولین تأیید، 101 = قبلاً تأیید شده (هر دو معتبر)
//
// 🧪 سندباکس (DECISION-071): همان API v4، فقط میزبان عوض می‌شود →
//    https://sandbox.zarinpal.com  (به‌جای payment.zarinpal.com). پولِ واقعی جابه‌جا
//    نمی‌شود؛ merchant_id هر UUID دلخواهی می‌تواند باشد؛ authorityها با «S» شروع می‌شوند.
//
// ⚠️ مبلغ به **تومان** پاس داده می‌شود و با currency:"IRT" به زرین‌پال می‌رود (بدون ×۱۰).
// ⚠️ امنیت: merchantId از DB می‌آید (نه hardcode)؛ در پیام خطا هرگز لو نمی‌رود.
//    هیچ متدی throw نمی‌کند — نتیجهٔ structured برمی‌گرداند.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  PaymentAdapter,
  PaymentRequestInput,
  PaymentRequestResult,
  PaymentVerifyInput,
  PaymentVerifyResult,
} from "@/lib/adapters/payment.adapter";

export interface ZarinpalConfig {
  /** کدِ درگاه (merchant_id) — ۳۶ کاراکتر، از DB */
  merchantId: string;
  /** سندباکس؟ → میزبانِ sandbox.zarinpal.com (تستِ بدونِ پولِ واقعی) */
  sandbox?: boolean;
  /** timeout میلی‌ثانیه — پیش‌فرض ۲۰ ثانیه */
  timeoutMs?: number;
}

const PROD_BASE = "https://payment.zarinpal.com";
const SANDBOX_BASE = "https://sandbox.zarinpal.com";

export class ZarinpalAdapter implements PaymentAdapter {
  private merchantId: string;
  private base: string;
  private timeoutMs: number;

  constructor(config: ZarinpalConfig) {
    if (!config.merchantId) {
      throw new Error("[zarinpal] merchantId تنظیم نشده — کدِ درگاه را در پنل ادمین بگذار.");
    }
    this.merchantId = config.merchantId;
    this.base = config.sandbox ? SANDBOX_BASE : PROD_BASE;
    this.timeoutMs = config.timeoutMs ?? 20_000;
  }

  async requestPayment(input: PaymentRequestInput): Promise<PaymentRequestResult> {
    const body: Record<string, unknown> = {
      merchant_id: this.merchantId,
      amount: Math.floor(input.amount),
      currency: "IRT", // مبلغ به تومان
      description: input.description,
      callback_url: input.callbackUrl,
    };
    if (input.mobile) body.metadata = { mobile: input.mobile };

    const res = await this.post("/pg/v4/payment/request.json", body);
    if (!res.ok) return { ok: false, error: res.error };

    const data = res.json?.data;
    const code = typeof data?.code === "number" ? data.code : undefined;
    const authority = typeof data?.authority === "string" ? data.authority : undefined;

    if (code === 100 && authority) {
      return { ok: true, authority, startPayUrl: `${this.base}/pg/StartPay/${authority}` };
    }

    return { ok: false, error: this.errMessage(res.json), code };
  }

  async verifyPayment(input: PaymentVerifyInput): Promise<PaymentVerifyResult> {
    const res = await this.post("/pg/v4/payment/verify.json", {
      merchant_id: this.merchantId,
      amount: Math.floor(input.amount),
      authority: input.authority,
    });
    if (!res.ok) return { ok: false, error: res.error };

    const data = res.json?.data;
    const code = typeof data?.code === "number" ? data.code : undefined;
    const refId = data?.ref_id != null ? String(data.ref_id) : undefined;
    const cardPan = typeof data?.card_pan === "string" ? data.card_pan : undefined;

    // 100 = اولین تأیید، 101 = قبلاً تأیید شده — هر دو یعنی پرداخت معتبر است
    if ((code === 100 || code === 101) && refId) {
      return { ok: true, refId, cardPan, alreadyVerified: code === 101 };
    }

    return { ok: false, error: this.errMessage(res.json), code };
  }

  // ─── ابزارِ داخلی ──────────────────────────────────────────────────────────

  /** POST با timeout؛ نتیجهٔ structured (هرگز throw نمی‌کند). */
  private async post(
    path: string,
    body: Record<string, unknown>
  ): Promise<{ ok: true; json: ZarinpalEnvelope } | { ok: false; error: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => null)) as ZarinpalEnvelope | null;
      if (!json) return { ok: false, error: `پاسخ نامعتبر از درگاه (HTTP ${res.status}).` };
      return { ok: true, json };
    } catch (err) {
      const msg = err instanceof Error && err.name === "AbortError"
        ? "اتمام مهلتِ اتصال به درگاه پرداخت."
        : "اتصال به درگاه پرداخت برقرار نشد.";
      console.error(`[zarinpal] خطای شبکه در ${path}:`, err);
      return { ok: false, error: msg };
    } finally {
      clearTimeout(timer);
    }
  }

  /** پیام خطای انسانیِ زرین‌پال (از errors یا data.message) — بدون لو دادنِ جزئیاتِ حساس. */
  private errMessage(json: ZarinpalEnvelope | undefined): string {
    const errors = json?.errors;
    if (errors && !Array.isArray(errors) && typeof errors === "object") {
      const m = (errors as { message?: unknown }).message;
      if (typeof m === "string" && m) return `درگاه پرداخت: ${m}`;
    }
    if (Array.isArray(errors) && errors.length > 0) {
      const m = (errors[0] as { message?: unknown })?.message;
      if (typeof m === "string" && m) return `درگاه پرداخت: ${m}`;
    }
    const dm = json?.data?.message;
    if (typeof dm === "string" && dm) return `درگاه پرداخت: ${dm}`;
    return "پرداخت ناموفق بود.";
  }
}

// پوششِ پاسخِ v4 زرین‌پال — { data, errors }. در خطا data ممکن است [] باشد.
interface ZarinpalEnvelope {
  data?: {
    code?: number;
    message?: string;
    authority?: string;
    ref_id?: number | string;
    card_pan?: string;
    [k: string]: unknown;
  };
  errors?: unknown;
}
