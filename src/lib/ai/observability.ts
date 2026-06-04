// ─────────────────────────────────────────────────────────────────────────────
// AI Observability — ring buffer in-memory
// در dev: همه فراخوانی‌ها لاگ می‌شوند → DevAIInspector نمایش می‌دهد.
// در prod: فقط metadata (نه prompt کامل، نه خروجی کامل) — رعایت حریم.
//
// فاز ۱: in-memory فقط. در فاز ۲ به DB persist می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { IS_DEV_MODE } from "@/lib/env";
import { getNow } from "@/lib/dev/time";
import type { AIInvocationLogEntry } from "@/lib/ai/types";

const MAX_BUFFER_SIZE = 50;
const PROMPT_PREVIEW_LEN = 500;
const OUTPUT_PREVIEW_LEN = 500;

// نگه‌داری روی globalThis برای جلوگیری از تکرار در Next.js HMR
const globalForLogs = globalThis as unknown as {
  __hamsoo_ai_logs?: AIInvocationLogEntry[];
};

function getBuffer(): AIInvocationLogEntry[] {
  if (!globalForLogs.__hamsoo_ai_logs) {
    globalForLogs.__hamsoo_ai_logs = [];
  }
  return globalForLogs.__hamsoo_ai_logs;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

export interface RecordInvocationInput {
  roleId: string;
  roleVersion: string;
  locale: "fa" | "en";
  provider: string;
  model: string;
  userId: string;
  systemPrompt: string;
  userPrompt: string;
  rawOutput: string;
  parsedOutput?: unknown;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  error?: string;
}

export function recordInvocation(input: RecordInvocationInput): void {
  const buffer = getBuffer();
  const entry: AIInvocationLogEntry = {
    id: `inv_${getNow().getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    invokedAt: getNow().toISOString(),
    roleId: input.roleId,
    roleVersion: input.roleVersion,
    locale: input.locale,
    provider: input.provider,
    model: input.model,
    userId: input.userId,
    // در prod: فقط metadata. در dev: preview ها.
    systemPromptPreview: IS_DEV_MODE
      ? truncate(input.systemPrompt, PROMPT_PREVIEW_LEN)
      : "",
    userPromptPreview: IS_DEV_MODE
      ? truncate(input.userPrompt, PROMPT_PREVIEW_LEN)
      : "",
    rawOutput: IS_DEV_MODE ? truncate(input.rawOutput, OUTPUT_PREVIEW_LEN) : "",
    parsedOutputPreview:
      IS_DEV_MODE && input.parsedOutput !== undefined
        ? truncate(JSON.stringify(input.parsedOutput), OUTPUT_PREVIEW_LEN)
        : "",
    latencyMs: input.latencyMs,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    error: input.error,
  };

  buffer.push(entry);
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.splice(0, buffer.length - MAX_BUFFER_SIZE);
  }

  // در dev، به console هم لاگ کن (برای راحتی debug)
  if (IS_DEV_MODE) {
    const tag = `[AI] ${entry.roleId}@${entry.roleVersion}`;
    if (entry.error) {
      console.error(`${tag} ❌ ${entry.latencyMs}ms — ${entry.error}`);
    } else {
      console.log(
        `${tag} ✅ ${entry.latencyMs}ms · ${entry.provider}/${entry.model} · tokens ${entry.inputTokens}→${entry.outputTokens}`
      );
    }
  }
}

/** آخرین n فراخوانی — برای DevAIInspector */
export function recentInvocations(limit = MAX_BUFFER_SIZE): AIInvocationLogEntry[] {
  const buffer = getBuffer();
  return buffer.slice(-limit).reverse(); // جدیدترین اول
}

/** پاک کردن buffer — فقط dev */
export function clearInvocations(): void {
  const buffer = getBuffer();
  buffer.length = 0;
}
