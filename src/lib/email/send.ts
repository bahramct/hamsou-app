// ─────────────────────────────────────────────────────────────────────────────
// email/send.ts — تنها نقطهٔ ارسال ایمیل (DECISION-064؛ آینهٔ sms/send.ts)
//
// قاعدهٔ طلایی (مثل sendVerificationSms برای پیامک): هیچ کد فیچری مستقیم EmailAdapter
// را صدا نمی‌زند. همیشه از توابع این فایل استفاده کن.
//
// مسئولیت‌ها:
//   1. resolve سرویس: DB پیش‌فرض → fallback mock (هرگز throw نمی‌کند)
//   2. ساخت adapter + ارسال
//   3. ثبت EmailLog به‌صورت best-effort (هرگز جریان ارسال را نمی‌شکند)
//   4. خروجی structured برای caller
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getDefaultEmailService, type ResolvedEmailService } from "@/lib/email/services";
import { getEmailAdapterForService } from "@/lib/adapters";

export type EmailPurpose = "signup" | "add-email" | "password-reset" | "test" | "contact-reply";

export interface SendEmailServiceResult {
  success: boolean;
  providerId: string; // "resend" | "mock"
  serviceLabel: string;
  source: "db" | "mock"; // از کجا resolve شد
  messageId?: string;
  error?: string;
}

export interface ActiveEmailInfo {
  provider: string;
  label: string;
  source: "db" | "mock";
  hasKey: boolean;
  fromAddress: string;
  ready: boolean;
}

/** ماسک‌کردن ایمیل برای لاگ: user@example.com → u***@example.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const masked = local.length <= 1 ? "***" : local[0] + "***";
  return `${masked}@${domain}`;
}

/** subject ایمیل بر اساس نوع ارسال */
const SUBJECTS: Record<string, string> = {
  signup: "تأیید حساب — همسو",
  "add-email": "کد تأیید ایمیل — همسو",
  "password-reset": "بازیابی رمز عبور — همسو",
  test: "ایمیل آزمایشی — همسو",
  "contact-reply": "پاسخ همسو",
};

function mockService(): ResolvedEmailService {
  return {
    id: "mock",
    label: "Mock (fallback)",
    provider: "mock",
    apiKey: null,
    fromAddress: "noreply@hamsoo.app",
    fromName: "همسو",
    isActive: true,
    isDefault: true,
  };
}

async function resolveActiveService(): Promise<{ svc: ResolvedEmailService; source: "db" | "mock" }> {
  const dbSvc = await getDefaultEmailService();
  if (dbSvc) return { svc: dbSvc, source: "db" };
  return { svc: mockService(), source: "mock" };
}

/** اطلاعاتِ غیرحساسِ سرویسِ فعال — برای بنرِ «سرویس فعال» در پنل. */
export async function getActiveEmailServiceInfo(): Promise<ActiveEmailInfo> {
  const { svc, source } = await resolveActiveService();
  const ready = svc.provider === "resend" ? Boolean(svc.apiKey) : true;
  return {
    provider: svc.provider,
    label: svc.label,
    source,
    hasKey: Boolean(svc.apiKey),
    fromAddress: svc.fromAddress,
    ready,
  };
}

// ─── توابع ارسال (یک تابع per نوع ایمیل) ────────────────────────────────────

/** ارسال کد تأیید ایمیل — برای افزودن ایمیل یا تغییر رمز کاربر لاگین‌کرده */
export async function sendVerificationCodeEmail(
  email: string,
  code: string,
  purpose: EmailPurpose = "add-email"
): Promise<SendEmailServiceResult> {
  return _send(email, purpose, (adapter) => adapter.sendVerificationCode(email, code));
}

export async function sendVerificationLinkEmail(
  email: string,
  link: string
): Promise<SendEmailServiceResult> {
  return _send(email, "signup", (adapter) => adapter.sendVerificationLink(email, link));
}

export async function sendPasswordResetEmail(
  email: string,
  link: string
): Promise<SendEmailServiceResult> {
  return _send(email, "password-reset", (adapter) => adapter.sendPasswordResetLink(email, link));
}

/** پاسخِ ادمین به پیامِ «تماس با ما» — فرستنده = سرویسِ پیش‌فرض (hello@hamsouapp.ir) (DECISION-079). */
export async function sendContactReplyEmail(
  email: string,
  subject: string,
  message: string
): Promise<SendEmailServiceResult> {
  return _send(email, "contact-reply", (adapter) => adapter.sendContactReply(email, subject, message));
}

// ─── هسته مشترک ──────────────────────────────────────────────────────────────

async function _send(
  email: string,
  purpose: EmailPurpose,
  fn: (adapter: ReturnType<typeof getEmailAdapterForService>) => Promise<{ success: boolean; messageId?: string; error?: string }>
): Promise<SendEmailServiceResult> {
  const { svc, source } = await resolveActiveService();

  let result: { success: boolean; messageId?: string; error?: string };
  try {
    const adapter = getEmailAdapterForService(svc);
    result = await fn(adapter);
  } catch (err) {
    result = { success: false, error: err instanceof Error ? err.message : String(err) };
  }

  // ثبت لاگ — best-effort
  try {
    await prisma.emailLog.create({
      data: {
        provider: svc.provider,
        serviceId: svc.id === "mock" ? null : svc.id,
        purpose,
        emailMasked: maskEmail(email),
        subject: SUBJECTS[purpose] ?? purpose,
        success: result.success,
        messageId: result.messageId ?? null,
        error: result.error ?? null,
      },
    });
  } catch (e) {
    console.error("[email] ثبت لاگ ناموفق:", e);
  }

  return {
    success: result.success,
    providerId: svc.provider,
    serviceLabel: svc.label,
    source,
    messageId: result.messageId,
    error: result.error,
  };
}
