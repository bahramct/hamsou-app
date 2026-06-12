// ─────────────────────────────────────────────────────────────────────────────
// Adapter Factory — همسو
//
// دو نوع Adapter:
//   - AIAdapter: by-name factory (mock | gapgpt | openai | ...) — هر کدام instance خود
//   - SMSAdapter: تک‌instance، بر اساس env (mock فعلاً)
//
// قاعده طلایی:
//   ❌ کد فیچر هرگز getAIAdapterByName() مستقیم صدا نمی‌زند
//   ✅ فراخوانی از طریق invokeAI() → ProviderRouter → این factory
//
// DECISION-002: Adapter Pattern
// DECISION-028: ProviderRouter (locale ≠ country)
// DECISION-032: OpenAI-compatible adapter (یک کلاس، چند instance)
// ─────────────────────────────────────────────────────────────────────────────

import type { AIAdapter } from "@/lib/adapters/ai.adapter";
import type { SMSAdapter } from "@/lib/adapters/sms.adapter";
import type { EmailAdapter } from "@/lib/adapters/email.adapter";
import type { PaymentAdapter } from "@/lib/adapters/payment.adapter";
import type { ResolvedAiService } from "@/lib/ai/services";
import type { ResolvedSmsService } from "@/lib/sms/services";
import type { ResolvedEmailService } from "@/lib/email/services";
import type { ResolvedPaymentGateway } from "@/lib/payment/gateway";

// ─── AI Adapter — by-name factory ───────────────────────────────────────────

const aiAdapterCache = new Map<string, AIAdapter>();
// cache آداپترهای resolved بر اساس امضای (id|baseURL|apiKey) تا با تغییر کلید/آدرس بازساخته شوند
const resolvedAdapterCache = new Map<string, AIAdapter>();

/**
 * نام‌های شناخته‌شده Provider — برای validation و autocomplete
 * هر اضافه شدن: یک case جدید در switch داخل buildAdapter
 * (DECISION-048: «mock» کاملاً حذف شد — فقط سرویس‌های واقعی.)
 */
export type AIProviderName = "gapgpt" | "openai" | "gemini";

/**
 * دریافت AIAdapter بر اساس نام Provider (cache شده).
 *
 * @param name نام provider (e.g., "mock", "gapgpt", "openai")
 * @returns instance ای از AIAdapter
 * @throws اگر provider ناشناخته یا env ناقص باشد
 */
export function getAIAdapterByName(name: string): AIAdapter {
  // cache: یک instance per name
  const cached = aiAdapterCache.get(name);
  if (cached) return cached;

  const adapter = buildAdapter(name);
  aiAdapterCache.set(name, adapter);
  return adapter;
}

function buildAdapter(name: string): AIAdapter {
  switch (name) {
    case "gapgpt": {
      const { OpenAICompatibleAdapter } = require("@/lib/adapters/openai-compatible.adapter");
      return new OpenAICompatibleAdapter({
        id: "gapgpt",
        displayName: "GapGPT (ایران)",
        supportedLocales: ["fa", "en"],
        baseURL: process.env.GAPGPT_BASE_URL ?? "https://api.gapgpt.app/v1",
        apiKey: requireEnv("GAPGPT_API_KEY"),
        defaultModel: process.env.GAPGPT_MODEL ?? "gpt-4o-mini",
        timeoutMs: 90_000, // GapGPT ممکن است برای متن فارسی کند باشد
        supportsJsonMode: false, // response_format ارسال نشود
      });
    }

    case "openai": {
      const { OpenAICompatibleAdapter } = require("@/lib/adapters/openai-compatible.adapter");
      return new OpenAICompatibleAdapter({
        id: "openai",
        displayName: "OpenAI",
        supportedLocales: ["fa", "en"],
        baseURL: process.env.OPENAI_BASE_URL, // undefined → default OpenAI
        apiKey: requireEnv("OPENAI_API_KEY"),
        defaultModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        timeoutMs: 30_000,
      });
    }

    case "gemini": {
      // در TASK-AI-PROVIDERS فاز ۲ پیاده‌سازی می‌شود
      throw new Error(`[AIAdapter] "gemini" هنوز پیاده‌سازی نشده — در فاز ۲`);
    }

    default:
      throw new Error(
        `[AIAdapter] provider ناشناخته: "${name}". مقادیر مجاز: gapgpt, openai, gemini`
      );
  }
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[AIAdapter] متغیر محیطی "${key}" تنظیم نشده — .env.local را چک کن.`
    );
  }
  return value;
}

// ─── Adapter از روی یک AiService (DECISION-039) ───────────────────────────────
// منبع‌حقیقتِ مدل/آدرس/کلید حالا ردیف AiService است (نه env/config کلید-مقدار).
// متن → OpenAICompatibleAdapter؛ mock → آداپتر آزمایشی؛ تصویر → هنوز اجرا نمی‌شود (گارد).
// cache بر اساس امضای (id|baseURL|apiKey|model) تا با تغییر هرکدام آداپتر بازساخته شود.

export async function getAIAdapterForService(svc: ResolvedAiService): Promise<AIAdapter> {
  // تصویر — زیرساخت آماده است اما اجرای واقعی هنوز پیاده نشده (DECISION-039)
  if (svc.kind === "image") {
    throw new Error(
      `[AIAdapter] سرویس تصویری «${svc.label}» هنوز اجرا نمی‌شود — زیرساخت آماده است (فاز بعد).`
    );
  }

  // متنی، سازگار با OpenAI — GapGPT/OpenAI/سایر
  const sig = `${svc.id}|${svc.baseURL ?? ""}|${svc.apiKey ?? ""}|${svc.model}`;
  const cached = resolvedAdapterCache.get(sig);
  if (cached) return cached;

  if (!svc.apiKey) {
    throw new Error(
      `[AIAdapter] سرویس «${svc.label}» کلید API ندارد — در پنل ادمین تنظیمش کن.`
    );
  }

  const { OpenAICompatibleAdapter } = require("@/lib/adapters/openai-compatible.adapter");
  const adapter = new OpenAICompatibleAdapter({
    id: svc.id,
    displayName: svc.label,
    supportedLocales: ["fa", "en"],
    baseURL: svc.baseURL ?? undefined,
    apiKey: svc.apiKey,
    defaultModel: svc.model,
    timeoutMs: 90_000, // محافظه‌کارانه — برخی سرویس‌های متن فارسی کندند
    supportsJsonMode: false, // پیش‌فرض امن؛ پرامپت‌ها خودشان JSON می‌خواهند و parser از متن می‌خواند
  }) as AIAdapter;

  resolvedAdapterCache.set(sig, adapter);
  return adapter;
}

// ─── SMS Adapter از روی یک SmsService (DECISION-061) ─────────────────────────
// منبع‌حقیقتِ provider/کلید/قالب حالا ردیف SmsService است (نه فقط env).
// smsir → SmsIrAdapter؛ mock → MockSMSAdapter.
// cache بر اساس امضای (id|provider|apiKey|templateId|paramName) تا با تغییر هرکدام بازساخته شود.

const resolvedSmsAdapterCache = new Map<string, SMSAdapter>();

export function getSmsAdapterForService(svc: ResolvedSmsService): SMSAdapter {
  const sig = `${svc.id}|${svc.provider}|${svc.apiKey ?? ""}|${svc.templateId ?? ""}|${svc.paramName ?? ""}|${svc.baseURL ?? ""}`;
  const cached = resolvedSmsAdapterCache.get(sig);
  if (cached) return cached;

  let adapter: SMSAdapter;
  if (svc.provider === "smsir") {
    if (!svc.apiKey || !svc.templateId) {
      throw new Error(
        `[SMSAdapter] سرویس «${svc.label}» کلید یا شناسهٔ قالب ندارد — در پنل ادمین تنظیمش کن.`
      );
    }
    const { SmsIrAdapter } = require("@/lib/adapters/smsir-sms.adapter");
    adapter = new SmsIrAdapter({
      apiKey: svc.apiKey,
      templateId: svc.templateId,
      paramName: svc.paramName ?? undefined,
      baseURL: svc.baseURL ?? undefined,
    }) as SMSAdapter;
  } else {
    // mock یا ناشناخته → آداپتر آزمایشی (هرگز ارسال واقعی)
    const { MockSMSAdapter } = require("@/lib/adapters/mock-sms.adapter");
    adapter = new MockSMSAdapter() as SMSAdapter;
  }

  resolvedSmsAdapterCache.set(sig, adapter);
  return adapter;
}

// ─── Email Adapter از روی یک EmailService (DECISION-064) ──────────────────────
// آینهٔ SMS Adapter: منبع‌حقیقت provider/apiKey/fromAddress ردیف EmailService است.
// resend → ResendEmailAdapter؛ mock یا ناشناخته → MockEmailAdapter.
// cache بر اساس امضای (id|provider|apiKey|fromAddress) تا با تغییر هرکدام بازساخته شود.

const resolvedEmailAdapterCache = new Map<string, EmailAdapter>();

export function getEmailAdapterForService(svc: ResolvedEmailService): EmailAdapter {
  const sig = `${svc.id}|${svc.provider}|${svc.apiKey ?? ""}|${svc.fromAddress}|${svc.fromName}`;
  const cached = resolvedEmailAdapterCache.get(sig);
  if (cached) return cached;

  let adapter: EmailAdapter;
  if (svc.provider === "resend") {
    if (!svc.apiKey) {
      throw new Error(
        `[EmailAdapter] سرویس «${svc.label}» کلید API ندارد — در پنل ادمین تنظیمش کن.`
      );
    }
    const { ResendEmailAdapter } = require("@/lib/adapters/resend-email.adapter");
    adapter = new ResendEmailAdapter({
      apiKey: svc.apiKey,
      fromAddress: svc.fromAddress,
      fromName: svc.fromName,
    }) as EmailAdapter;
  } else {
    // mock یا ناشناخته → آداپتر آزمایشی
    const { MockEmailAdapter } = require("@/lib/adapters/mock-email.adapter");
    adapter = new MockEmailAdapter() as EmailAdapter;
  }

  resolvedEmailAdapterCache.set(sig, adapter);
  return adapter;
}

// legacy — برای سازگاری با کدهای قدیمی که هنوز migrate نشده‌اند
export function getEmailAdapter(): EmailAdapter {
  const { MockEmailAdapter } = require("@/lib/adapters/mock-email.adapter");
  return new MockEmailAdapter() as EmailAdapter;
}

// ─── Payment Adapter از روی یک PaymentGateway (DECISION-071) ──────────────────
// آینهٔ SMS/Email Adapter: منبع‌حقیقتِ provider/merchantId/isSandbox ردیف PaymentGateway است.
// انتخابِ config-محور (نه اجبارِ dev):
//   • provider=mock          → MockPaymentAdapter (آنی، بدونِ شبکه — برای CI/آفلاین)
//   • provider=zarinpal      → ZarinpalAdapter؛ isSandbox=true → sandbox.zarinpal.com (تستِ بدونِ پول)
// سندباکس بدونِ merchantId → یک UUIDِ تستِ پیش‌فرض (سندباکس هر UUIDی را می‌پذیرد).
// تولید (isSandbox=false) بدونِ merchantId → خطای واضح (نمی‌توان بدونِ کدِ واقعی شارژ گرفت).
// cache بر اساس امضای (id|provider|merchantId|sandbox) تا با تغییر هرکدام بازساخته شود.

// UUIDِ تستِ پیش‌فرضِ سندباکس (وقتی owner هنوز کدی وارد نکرده) — فقط برای sandbox معتبر.
const SANDBOX_TEST_MERCHANT = "00000000-0000-0000-0000-000000000000";

const resolvedPaymentAdapterCache = new Map<string, PaymentAdapter>();

export function getPaymentAdapterForGateway(gw: ResolvedPaymentGateway): PaymentAdapter {
  const sig = `${gw.id}|${gw.provider}|${gw.merchantId ?? ""}|${gw.isSandbox ? "sb" : "prod"}`;
  const cached = resolvedPaymentAdapterCache.get(sig);
  if (cached) return cached;

  let adapter: PaymentAdapter;
  if (gw.provider === "mock") {
    const { MockPaymentAdapter } = require("@/lib/adapters/mock-payment.adapter");
    adapter = new MockPaymentAdapter() as PaymentAdapter;
  } else {
    // zarinpal — واقعی یا سندباکس بر اساس isSandbox
    let merchantId = gw.merchantId?.trim() || null;
    if (!merchantId) {
      if (gw.isSandbox) {
        merchantId = SANDBOX_TEST_MERCHANT; // سندباکس هر UUIDی را می‌پذیرد
      } else {
        throw new Error(
          `[PaymentAdapter] درگاه «${gw.label}» کدِ درگاه (merchantId) ندارد — در پنل ادمین تنظیمش کن.`
        );
      }
    }
    const { ZarinpalAdapter } = require("@/lib/adapters/zarinpal.adapter");
    adapter = new ZarinpalAdapter({ merchantId, sandbox: gw.isSandbox }) as PaymentAdapter;
  }

  resolvedPaymentAdapterCache.set(sig, adapter);
  return adapter;
}
