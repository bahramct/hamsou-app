// ─────────────────────────────────────────────────────────────────────────────
// OpenAICompatibleAdapter — Adapter چندمنظوره برای هر Provider سازگار با OpenAI
//
// این Adapter یک کلاس قابل پیکربندی است که با تنظیم baseURL/apiKey/model
// می‌تواند به هرکدام از این‌ها وصل شود:
//   - GapGPT (Provider ایرانی، فاز ۱)
//   - OpenAI واقعی (آینده، فاز ۲)
//   - هر Provider دیگری که با OpenAI SDK سازگار است
//
// DECISION-028: Provider Routing مبتنی بر country
// DECISION-032: OpenAI-compatible adapter pattern (یک کلاس، چند instance)
//
// ⚠️ امنیت:
//   - API key فقط از env خوانده می‌شود — هرگز در کد hardcode نیست
//   - در error messages هرگز apiKey لو نمی‌رود
//   - logging فقط metadata را ذخیره می‌کند (orchestrator مسئول است)
// ─────────────────────────────────────────────────────────────────────────────

import OpenAI from "openai";
import type {
  AIAdapter,
  AIGenerateInput,
  AIGenerateResult,
} from "@/lib/adapters/ai.adapter";

export interface OpenAICompatibleConfig {
  /** شناسه یکتای این Provider — برای routing و logging (e.g., "gapgpt", "openai") */
  id: string;
  /** نام نمایشی — برای DevAIInspector */
  displayName: string;
  /** locale هایی که این Provider از آن‌ها پشتیبانی می‌کند (لیست empty = همه) */
  supportedLocales: ReadonlyArray<string>;
  /** baseURL کامل — مثلاً "https://api.gapgpt.app/v1" یا undefined برای OpenAI default */
  baseURL?: string;
  /** کلید API — از env خوانده می‌شود، نه پارامتر */
  apiKey: string;
  /** مدل پیش‌فرض — مثلاً "gpt-4o-mini" */
  defaultModel: string;
  /** timeout میلی‌ثانیه برای فراخوانی API */
  timeoutMs?: number;
  /**
   * اگر false، هرگز response_format: json_object ارسال نمی‌شود.
   * برای GapGPT و Provider هایی که json_object را کامل ساپورت نمی‌کنند → false.
   * پیش‌فرض: false (پرامپت ما خودش JSON می‌خواهد؛ parseOutput هم extractJson دارد)
   */
  supportsJsonMode?: boolean;
}

export class OpenAICompatibleAdapter implements AIAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly supportedLocales: ReadonlyArray<string>;

  private client: OpenAI;
  private defaultModel: string;
  private timeoutMs: number;
  private supportsJsonMode: boolean;

  constructor(config: OpenAICompatibleConfig) {
    if (!config.apiKey) {
      throw new Error(
        `[${config.id}] apiKey خالی است — متغیر محیطی مربوطه را در .env.local تنظیم کن.`
      );
    }

    this.id = config.id;
    this.displayName = config.displayName;
    this.supportedLocales = config.supportedLocales;
    this.defaultModel = config.defaultModel;
    this.timeoutMs = config.timeoutMs ?? 60_000;
    // پیش‌فرض false: پرامپت ما JSON می‌طلبد؛ extractJson() هم JSON را از text استخراج می‌کند.
    // هیچ Provider ای نباید به response_format وابسته باشد مگر صراحتاً set شود.
    this.supportsJsonMode = config.supportsJsonMode ?? false;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: this.timeoutMs,
    });
  }

  async generate(input: AIGenerateInput): Promise<AIGenerateResult> {
    const startMs = Date.now();

    try {
      const useJsonMode = input.jsonMode && this.supportsJsonMode;
      // override مدل per-request (DECISION-037) → در غیر این صورت defaultModel
      const requestModel = input.model?.trim() || this.defaultModel;

      const response = await this.client.chat.completions.create({
        model: requestModel,
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt },
        ],
        // response_format فقط اگر Provider صراحتاً آن را ساپورت کند
        ...(useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
        temperature: input.temperature ?? 0.7,
        max_tokens: input.maxOutputTokens,
      });

      const latencyMs = Date.now() - startMs;
      const text = response.choices[0]?.message?.content ?? "";
      const model = response.model ?? this.defaultModel;

      return {
        text,
        usage: {
          inputTokens: response.usage?.prompt_tokens ?? 0,
          outputTokens: response.usage?.completion_tokens ?? 0,
        },
        model,
        latencyMs,
      };
    } catch (err) {
      // محافظت در برابر لو رفتن apiKey در پیام خطا
      const safeMessage = sanitizeError(err);
      throw new Error(`[${this.id}] فراخوانی API ناموفق: ${safeMessage}`);
    }
  }
}

/**
 * پاک‌سازی پیام خطا از مقادیر حساس (apiKey، token، ...)
 */
function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    let msg = err.message;
    // حذف هرگونه string شبیه sk-... که ممکن است token باشد
    msg = msg.replace(/sk-[A-Za-z0-9]{10,}/g, "sk-***REDACTED***");
    msg = msg.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer ***REDACTED***");
    return msg;
  }
  return String(err);
}
