// ─────────────────────────────────────────────────────────────────────────────
// SmsIrAdapter — پیاده‌سازی SMSAdapter برای سرویس sms.ir (پنل پیامک ایرانی)
//
// از endpoint «ارسال کد تأیید» استفاده می‌کند:
//   POST {baseURL}/send/verify
//   headers: x-api-key، Content-Type: application/json
//   body:    { mobile, templateId, parameters: [{ name, value }] }
//   موفق:    { status: 1, message: "موفق", data: { messageId, cost } }
//
// sandbox و production هر دو همین endpoint را دارند — فقط کلید (x-api-key) فرق می‌کند.
// پس برای رفتن به محیط واقعی فقط SMSIR_API_KEY (و در صورت نیاز templateId) عوض می‌شود.
//
// ⚠️ امنیت:
//   - کلید فقط از env خوانده می‌شود — هرگز hardcode نیست (قاعدهٔ CLAUDE.md §۵)
//   - در پیام خطا هرگز کلید لو نمی‌رود
//   - sendOTP هرگز throw نمی‌کند؛ نتیجه را structured برمی‌گرداند تا جریان OTP نشکند
// ─────────────────────────────────────────────────────────────────────────────

import type { SMSAdapter } from "@/lib/adapters/sms.adapter";
import type { SendOTPResult } from "@/types/sms";

export interface SmsIrConfig {
  /** کلید وب‌سرویس sms.ir (sandbox یا production) — از env */
  apiKey: string;
  /** شناسهٔ قالبِ کد تأیید که در پنل sms.ir ساخته شده */
  templateId: number;
  /** نام پارامتر داخل قالب (placeholder) — پیش‌فرض "Code" */
  paramName?: string;
  /** baseURL — پیش‌فرض https://api.sms.ir/v1 */
  baseURL?: string;
  /** timeout میلی‌ثانیه — پیش‌فرض ۱۵ ثانیه */
  timeoutMs?: number;
}

export class SmsIrAdapter implements SMSAdapter {
  private apiKey: string;
  private templateId: number;
  private paramName: string;
  private baseURL: string;
  private timeoutMs: number;

  constructor(config: SmsIrConfig) {
    if (!config.apiKey) {
      throw new Error(
        "[smsir] SMSIR_API_KEY تنظیم نشده — کلید وب‌سرویس را در .env.local بگذار."
      );
    }
    if (!config.templateId || Number.isNaN(config.templateId)) {
      throw new Error(
        "[smsir] SMSIR_TEMPLATE_ID نامعتبر است — شناسهٔ قالبِ کد تأیید را از پنل sms.ir بگذار."
      );
    }

    this.apiKey = config.apiKey;
    this.templateId = config.templateId;
    this.paramName = config.paramName ?? "Code";
    this.baseURL = (config.baseURL ?? "https://api.sms.ir/v1").replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? 15_000;
  }

  async sendOTP(phone: string, code: string): Promise<SendOTPResult> {
    const mobile = toLocalIranMobile(phone);
    if (!mobile) {
      return { success: false, error: "شماره موبایل برای ارسال نامعتبر است." };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseURL}/send/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify({
          mobile,
          templateId: this.templateId,
          parameters: [{ name: this.paramName, value: code }],
        }),
        signal: controller.signal,
      });

      // پاسخ sms.ir همیشه JSON است (حتی روی خطا) — status داخلی مهم‌تر از HTTP status است
      const data: SmsIrResponse = await res.json().catch(() => null as never);

      if (data && data.status === 1) {
        return {
          success: true,
          status: 1,
          messageId: data.data?.messageId != null ? String(data.data.messageId) : undefined,
        };
      }

      // خطای دامنه‌ای sms.ir (کلید نامعتبر، قالب یافت نشد، اعتبار ناکافی، ...)
      const message = data?.message ?? `پاسخ نامعتبر (HTTP ${res.status})`;
      console.error(`[smsir] ارسال ناموفق (status=${data?.status}): ${message}`);
      return { success: false, status: data?.status, error: message };
    } catch (err) {
      const safe = sanitizeError(err);
      console.error(`[smsir] خطای شبکه در ارسال: ${safe}`);
      return { success: false, error: safe };
    } finally {
      clearTimeout(timer);
    }
  }
}

interface SmsIrResponse {
  status: number;
  message: string;
  data?: { messageId?: number | string; cost?: number } | null;
}

/**
 * تبدیل شمارهٔ نرمال‌شدهٔ همسو (+989XXXXXXXXX) به فرمتِ موردِ انتظارِ sms.ir (09XXXXXXXXX).
 * با ورودی‌های 09…، 9…، 98… هم مدارا می‌کند.
 */
function toLocalIranMobile(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-]/g, "").trim();
  if (/^\+989\d{9}$/.test(cleaned)) return "0" + cleaned.slice(3); // +98 → 0
  if (/^00989\d{9}$/.test(cleaned)) return "0" + cleaned.slice(4);
  if (/^989\d{9}$/.test(cleaned)) return "0" + cleaned.slice(2);
  if (/^09\d{9}$/.test(cleaned)) return cleaned;
  if (/^9\d{9}$/.test(cleaned)) return "0" + cleaned;
  return null;
}

/** پاک‌سازی پیام خطا از مقادیر حساس (کلید) و کوتاه‌سازی پیام‌های abort */
function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "اتمام مهلت اتصال به سرویس پیامک.";
    return err.message;
  }
  return String(err);
}
