// ─────────────────────────────────────────────────────────────────────────────
// AI Architecture — Core Types
// منبع: DECISION-020 (Registry/Orchestrator)، DECISION-028 (ProviderRouter)،
//        DECISION-029 (Prompt files)، DECISION-030 (ادغام TASK-009)
// ─────────────────────────────────────────────────────────────────────────────

import type { ZodType } from "zod";
import type { AIGenerateResult } from "@/lib/adapters/ai.adapter";

// ─── Locale ─────────────────────────────────────────────────────────────────
// در فاز ۱: فقط فارسی. در TASK-I18N انگلیسی هم اضافه می‌شود.
export type AILocale = "fa" | "en";
export const DEFAULT_AI_LOCALE: AILocale = "fa";

// ─── Role Metadata ──────────────────────────────────────────────────────────
export interface AIRoleMeta {
  /** توضیح فارسی نقش — برای DevAIInspector و admin panel */
  description: string;
  /** اگر true: انتظار خروجی JSON valid — orchestrator با Zod اعتبارسنجی می‌کند */
  jsonMode: boolean;
  /** ترجیح Provider (اگر خالی، default Provider) */
  defaultTemperature?: number;
  maxOutputTokens?: number;
  /** اگر این نقش حساس به privacy است (مثلاً چت) — observability log حداقلی */
  privacySensitive?: boolean;
  /**
   * نوع سرویس AI که این نقش نیاز دارد (DECISION-039).
   * "text" (پیش‌فرض) برای نقش‌های متنی؛ "image" برای نقش‌های تولید تصویر (آینده).
   * در resolution، نقش به سرویس پیش‌فرض همین kind در منطقهٔ کاربر Bind می‌شود.
   */
  serviceKind?: "text" | "image";
}

// ─── AI Role ─────────────────────────────────────────────────────────────────
// هر نقش = یک contract type-safe بین کد فیچر و AI
export interface AIRole<TInput, TOutput> {
  /** شناسه یکتا، kebab-case */
  readonly id: string;
  /** semver — تغییر prompt = bump نسخه */
  readonly version: string;
  readonly meta: AIRoleMeta;
  readonly inputSchema: ZodType<TInput>;
  readonly outputSchema: ZodType<TOutput>;
  /**
   * ساخت پرامپت — معمولاً با loadPrompt(...) از /prompts خوانده می‌شود
   * و placeholder ها با داده ورودی پر می‌شوند
   */
  buildPrompt(
    input: TInput,
    locale: AILocale
  ): Promise<{ systemPrompt: string; userPrompt: string }>;
  /**
   * پارس خروجی خام Provider به ساختار قابل اعتبارسنجی
   * (معمولاً JSON.parse با extract از code block)
   */
  parseOutput(raw: string): unknown;
}

// ─── Invocation Context ──────────────────────────────────────────────────────
// context هر فراخوانی — orchestrator این را می‌گیرد.
// مهم: locale و country دو محور **مستقل** هستند (DECISION-028):
//   - locale (fa/en) = انتخاب کاربر برای زبان پرامپت/خروجی
//   - country (IR/US/...) = از IP خوانده می‌شود → Provider Routing
// مثال: کاربر ایرانی می‌تواند locale="en" باشد و همچنان به Provider ایرانی برود
export interface AIInvocationContext {
  /** شناسه کاربر — برای routing و logging */
  userId: string;
  /** locale کاربر — fa | en. انتخاب کاربر، نه IP. در فاز ۱ همیشه fa. */
  locale?: AILocale;
  /**
   * کد ISO-2 کشور (e.g., "IR"، "US") — از IP request استخراج شده.
   * API Route باید با `getCountryFromHeaders(request.headers)` آن را پر کند.
   * تنها معیار انتخاب Provider در فاز ۲+ همین است.
   */
  clientCountry?: string | null;
  /** نسخه نقش — اگر خالی، آخرین نسخه ثبت‌شده */
  roleVersion?: string;
}

// ─── Invocation Result ───────────────────────────────────────────────────────
export interface AIInvocationResult<TOutput> {
  output: TOutput;
  meta: {
    roleId: string;
    roleVersion: string;
    provider: string;
    model: string;
    locale: AILocale;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    /** زمان فراخوانی (ISO) */
    invokedAt: string;
  };
}

// ─── Observability Log Entry ─────────────────────────────────────────────────
// فقط در dev نگه‌داری می‌شود (ring buffer) — DevAIInspector نمایش می‌دهد
export interface AIInvocationLogEntry {
  id: string;
  invokedAt: string;
  roleId: string;
  roleVersion: string;
  locale: AILocale;
  provider: string;
  model: string;
  userId: string;
  systemPromptPreview: string; // فقط ۲۰۰ کاراکتر اول
  userPromptPreview: string;
  rawOutput: string;
  parsedOutputPreview: string; // JSON.stringify slice
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  /** اگر فراخوانی fail شد، پیام خطا */
  error?: string;
}

// re-export برای راحتی — adapter-level types
export type { AIGenerateResult };
