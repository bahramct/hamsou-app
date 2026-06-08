// ─────────────────────────────────────────────────────────────────────────────
// sms/send.ts — تنها نقطهٔ ارسال پیامک تأیید (DECISION-061)
//
// قاعدهٔ طلایی (مثل invokeAI برای AI): هیچ کد فیچری مستقیم adapter پیامک را صدا نمی‌زند.
// همیشه: await sendVerificationSms(phone, code, purpose)
//
// مسئولیت‌ها:
//   1. resolve سرویس: DB پیش‌فرض → (legacy) env SMS_PROVIDER → mock  (fallback امن)
//   2. ساخت adapter + ارسال
//   3. ثبت SmsLog به‌صورت best-effort (هرگز جریان OTP را نمی‌شکند؛ کد ذخیره نمی‌شود)
//   4. خروجی structured برای caller
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/client";
import { getDefaultSmsService, type ResolvedSmsService } from "@/lib/sms/services";
import { getSmsAdapterForService } from "@/lib/adapters";
import type { SendOTPResult } from "@/types/sms";

export type SmsPurpose = "otp-login" | "otp-add-phone" | "test";

export interface SendSmsResult {
  success: boolean;
  providerId: string; // "smsir" | "mock"
  isSandbox: boolean;
  serviceLabel: string;
  messageId?: string;
  status?: number;
  error?: string;
}

/** ماسک‌کردن شماره برای لاگ (حریم خصوصی): 09353273500 → 0935***3500 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("98")
    ? "0" + digits.slice(2)
    : digits.startsWith("0")
      ? digits
      : "0" + digits;
  if (local.length < 8) return "***";
  return local.slice(0, 4) + "***" + local.slice(-4);
}

/** ساخت یک ResolvedSmsService از env — fallback لگاسی (DECISION-060) وقتی DB خالی است. */
function serviceFromEnv(): ResolvedSmsService {
  const provider = (process.env.SMS_PROVIDER ?? "mock").trim();
  if (provider === "smsir") {
    const tid = process.env.SMSIR_TEMPLATE_ID;
    return {
      id: "env",
      label: "sms.ir (env)",
      provider: "smsir",
      apiKey: process.env.SMSIR_API_KEY ?? null,
      templateId: tid ? parseInt(tid, 10) : null,
      paramName: process.env.SMSIR_PARAM_NAME ?? "Code",
      baseURL: process.env.SMSIR_BASE_URL ?? null,
      isSandbox: true,
      isActive: true,
      isDefault: true,
    };
  }
  return {
    id: "env",
    label: "Mock (env)",
    provider: "mock",
    apiKey: null,
    templateId: null,
    paramName: null,
    baseURL: null,
    isSandbox: false,
    isActive: true,
    isDefault: true,
  };
}

/** سرویس فعال را تعیین می‌کند: DB پیش‌فرض → env fallback. */
async function resolveActiveService(): Promise<ResolvedSmsService> {
  const dbSvc = await getDefaultSmsService();
  return dbSvc ?? serviceFromEnv();
}

export interface ActiveSmsInfo {
  provider: string; // "smsir" | "mock"
  label: string;
  isSandbox: boolean;
  source: "db" | "env"; // از کجا resolve شد
  hasKey: boolean;
  /** آیا قابلِ ارسالِ واقعی است؟ (smsir: کلید+قالب دارد؛ mock: همیشه) */
  ready: boolean;
}

/** اطلاعاتِ غیرحساسِ سرویسِ فعال — برای بنرِ «سرویس فعال» در پنل. apiKey برنمی‌گردد. */
export async function getActiveSmsServiceInfo(): Promise<ActiveSmsInfo> {
  const dbSvc = await getDefaultSmsService();
  const svc = dbSvc ?? serviceFromEnv();
  const ready = svc.provider === "smsir" ? Boolean(svc.apiKey && svc.templateId) : true;
  return {
    provider: svc.provider,
    label: svc.label,
    isSandbox: svc.isSandbox,
    source: dbSvc ? "db" : "env",
    hasKey: Boolean(svc.apiKey),
    ready,
  };
}

/** ارسال کد تأیید از مسیر سرویسِ فعال + ثبت لاگ. هرگز throw نمی‌کند. */
export async function sendVerificationSms(
  phone: string,
  code: string,
  purpose: SmsPurpose
): Promise<SendSmsResult> {
  const svc = await resolveActiveService();

  let result: SendOTPResult;
  try {
    const adapter = getSmsAdapterForService(svc);
    result = await adapter.sendOTP(phone, code);
  } catch (err) {
    // getSmsAdapterForService ممکن است throw کند (کلید/قالب ناقص) → ثبت ناموفق، عدم‌شکست
    result = { success: false, error: err instanceof Error ? err.message : String(err) };
  }

  // ثبت لاگ — best-effort؛ خطای لاگ هرگز ارسال/ورود را نمی‌شکند
  try {
    await prisma.smsLog.create({
      data: {
        provider: svc.provider,
        serviceId: svc.id === "env" ? null : svc.id,
        purpose,
        phoneMasked: maskPhone(phone),
        success: result.success,
        status: result.status ?? null,
        messageId: result.messageId ?? null,
        error: result.error ?? null,
        isSandbox: svc.isSandbox,
      },
    });
  } catch (e) {
    console.error("[sms] ثبت لاگ ناموفق:", e);
  }

  return {
    success: result.success,
    providerId: svc.provider,
    isSandbox: svc.isSandbox,
    serviceLabel: svc.label,
    messageId: result.messageId,
    status: result.status,
    error: result.error,
  };
}
