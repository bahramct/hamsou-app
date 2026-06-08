// ─────────────────────────────────────────────────────────────────────────────
// MockEmailAdapter — پیاده‌سازی تستیِ EmailAdapter برای فاز MVP (DECISION-058)
// کدِ تأیید در console سرور چاپ می‌شود؛ ارسالِ واقعیِ ایمیل در فاز بعد.
// در dev، کد از طریق devOnlyPayload در UI هم نمایش داده می‌شود (مثل OTP).
// این فایل هرگز در production برای ارسالِ واقعی استفاده نمی‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import type { EmailAdapter } from "@/lib/adapters/email.adapter";
import type { SendEmailResult } from "@/types/email";

export class MockEmailAdapter implements EmailAdapter {
  async sendVerificationCode(email: string, code: string): Promise<SendEmailResult> {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[MockEmailAdapter] کدِ تأیید برای ${email}: ${code}   (${new Date().toLocaleTimeString("fa-IR")})`
      );
    }
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  async sendVerificationLink(email: string, link: string): Promise<SendEmailResult> {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[MockEmailAdapter] لینک تأیید ثبت‌نام برای ${email}:\n  ${link}   (${new Date().toLocaleTimeString("fa-IR")})`
      );
    }
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  async sendPasswordResetLink(email: string, link: string): Promise<SendEmailResult> {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[MockEmailAdapter] لینک بازیابی رمز برای ${email}:\n  ${link}   (${new Date().toLocaleTimeString("fa-IR")})`
      );
    }
    return { success: true, messageId: `mock-${Date.now()}` };
  }
}
