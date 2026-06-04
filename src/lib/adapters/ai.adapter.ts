// ─────────────────────────────────────────────────────────────────────────────
// AIAdapter Interface — همسو
// Generic interface برای هر Provider هوش مصنوعی.
// نقش‌های مشخص (weekly-report، chat، ...) در src/lib/ai/roles/ تعریف می‌شوند؛
// این لایه فقط prompt-in / text-out است.
//
// قاعده طلایی: کد فیچر هرگز مستقیماً این Adapter را صدا نمی‌زند.
// همه فراخوانی‌ها از طریق src/lib/ai/orchestrator.ts → ProviderRouter → AIAdapter.
//
// DECISION-002: Adapter Pattern
// DECISION-028: ProviderRouter
// DECISION-030: ادغام TASK-009 با AI Architecture
// ─────────────────────────────────────────────────────────────────────────────

export interface AIGenerateInput {
  systemPrompt: string;
  userPrompt: string;
  /** اگر Provider پشتیبانی کند, خروجی به‌صورت JSON valid تضمین می‌شود */
  jsonMode?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  /** override مدل برای این فراخوانی (DECISION-037) — اگر خالی، defaultModel آداپتر */
  model?: string;
  /** متادیتای فراخوانی — برای logging و routing */
  metadata: {
    roleId: string;
    roleVersion: string;
    locale: string;
  };
}

export interface AIGenerateResult {
  /** خروجی خام Provider — اگر jsonMode، باید JSON valid باشد */
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  /** نام مدل واقعی استفاده‌شده (مثلاً "gpt-4o-mini" یا "mock") */
  model: string;
  latencyMs: number;
}

export interface AIAdapter {
  /** شناسه یکتای Provider — برای routing و logging */
  readonly id: string;

  /** نام provider برای نمایش (در DevAIInspector و …) */
  readonly displayName: string;

  /** اطلاع‌رسانی locale های پشتیبانی‌شده — ProviderRouter از این استفاده می‌کند */
  readonly supportedLocales: ReadonlyArray<string>;

  /** فراخوانی اصلی — generic prompt → text */
  generate(input: AIGenerateInput): Promise<AIGenerateResult>;
}
