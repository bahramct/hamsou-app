// ─────────────────────────────────────────────────────────────────────────────
// MockSMSAdapter — پیاده‌سازی تستی SMSAdapter برای فاز MVP
// DECISION-008: کد OTP در console سرور چاپ می‌شود؛ SMS واقعی در فاز ۲
// این فایل هرگز در production استفاده نمی‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import type { SMSAdapter } from "@/lib/adapters/sms.adapter";
import type { SendOTPResult } from "@/types/sms";

export class MockSMSAdapter implements SMSAdapter {
  async sendOTP(phone: string, code: string): Promise<SendOTPResult> {
    // چاپ کد در console سرور — برای توسعه محلی
    // در محیط test فقط log ذخیره می‌شود و چاپ نمی‌شود
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[MockSMSAdapter] OTP برای ${phone}: ${code}   (${new Date().toLocaleTimeString("fa-IR")})`
      );
    }

    // شبیه‌سازی تأخیر شبکه (اختیاری در dev)
    // await new Promise((r) => setTimeout(r, 300));

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }
}
