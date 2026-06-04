// ─────────────────────────────────────────────────────────────────────────────
// AI Orchestrator — لایه ۵
// نقطه ورود تمام فراخوانی‌های AI.
//
// مسئولیت‌ها:
//   1. lookup نقش از Registry
//   2. اعتبارسنجی input با Zod
//   3. ساخت prompt (از /prompts با placeholder substitution)
//   4. انتخاب Provider با ProviderRouter
//   5. فراخوانی provider.generate(...)
//   6. parse و اعتبارسنجی output با Zod
//   7. لاگ کامل در dev (DevAIInspector)، metadata در prod
//
// مصرف:
//   const result = await invokeAI("weekly-report", input, { userId, locale });
// ─────────────────────────────────────────────────────────────────────────────

import { getNow } from "@/lib/dev/time";
import { aiRegistry } from "@/lib/ai/registry";
import { loadPrompt } from "@/lib/ai/prompt-loader";
import { getProviderForRequest } from "@/lib/ai/provider-router";
import { recordInvocation } from "@/lib/ai/observability";
import { ensureRolesRegistered } from "@/lib/ai/bootstrap";
import { getAiConfigFloat, getAiConfigInt } from "@/lib/ai/config";
import { AI_CONFIG_KEYS } from "@/lib/ai/admin-catalog";
import type {
  AIInvocationContext,
  AIInvocationResult,
  AILocale,
} from "@/lib/ai/types";

/**
 * فراخوانی یک نقش AI با input و context کاربر.
 *
 * @param roleId شناسه نقش (e.g. "weekly-report")
 * @param input داده ورودی (با inputSchema نقش match می‌شود)
 * @param ctx context کاربر و locale
 * @returns output type-safe طبق outputSchema نقش
 */
export async function invokeAI<TInput, TOutput>(
  roleId: string,
  input: TInput,
  ctx: AIInvocationContext
): Promise<AIInvocationResult<TOutput>> {
  const invokedAt = getNow().toISOString();
  const startMs = Date.now();
  let rawText = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let model = "unknown";
  let providerId = "unknown";

  try {
    // bootstrap: مطمئن می‌شویم نقش‌ها ثبت شده‌اند
    ensureRolesRegistered();

    const role = aiRegistry.get<TInput, TOutput>(roleId, ctx.roleVersion);
    const locale: AILocale = ctx.locale ?? "fa";

    // 1. اعتبارسنجی input
    const validatedInput = role.inputSchema.parse(input);

    // 2. ساخت prompt
    const prompt = await role.buildPrompt(validatedInput, locale);

    // 3. انتخاب سرویس — بر اساس country (نه locale) + اتصال بخش→سرویس از DB (DECISION-039)
    const route = await getProviderForRequest({
      userId: ctx.userId,
      roleId,
      clientCountry: ctx.clientCountry ?? null,
      kind: role.meta.serviceKind ?? "text",
      locale,
    });
    providerId = route.adapter.id;

    // مدل از سرویس انتخاب‌شده می‌آید (route.model). پارامترهای نقش (temperature/maxTokens)
    // مستقل از سرویس‌اند و از DB override می‌شوند — fallback به مقادیر کد (DECISION-037).
    const temperature = role.meta.defaultTemperature;
    const resolvedTemperature =
      temperature !== undefined
        ? await getAiConfigFloat(AI_CONFIG_KEYS.roleTemperature(role.id), temperature)
        : undefined;
    const resolvedMaxTokens =
      role.meta.maxOutputTokens !== undefined
        ? await getAiConfigInt(
            AI_CONFIG_KEYS.roleMaxTokens(role.id),
            role.meta.maxOutputTokens
          )
        : undefined;

    // 4. فراخوانی Provider
    const result = await route.adapter.generate({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      jsonMode: role.meta.jsonMode,
      temperature: resolvedTemperature,
      maxOutputTokens: resolvedMaxTokens,
      model: route.model || undefined,
      metadata: {
        roleId: role.id,
        roleVersion: role.version,
        locale,
      },
    });

    rawText = result.text;
    inputTokens = result.usage.inputTokens;
    outputTokens = result.usage.outputTokens;
    model = result.model;

    const latencyMs = Date.now() - startMs;

    // 5. parse و اعتبارسنجی output
    const parsed = role.parseOutput(rawText);
    const validatedOutput = role.outputSchema.parse(parsed);

    // 6. لاگ موفقیت
    recordInvocation({
      roleId: role.id,
      roleVersion: role.version,
      locale,
      provider: providerId,
      model,
      userId: ctx.userId,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      rawOutput: rawText,
      parsedOutput: validatedOutput,
      latencyMs,
      inputTokens,
      outputTokens,
    });

    return {
      output: validatedOutput,
      meta: {
        roleId: role.id,
        roleVersion: role.version,
        provider: providerId,
        model,
        locale,
        latencyMs,
        inputTokens,
        outputTokens,
        invokedAt,
      },
    };
  } catch (err) {
    const latencyMs = Date.now() - startMs;
    const message = err instanceof Error ? err.message : String(err);

    // لاگ کامل در dev terminal برای دیباگ
    console.error(`[invokeAI] ❌ ${roleId} | ${providerId} | ${latencyMs}ms\n`, err);

    recordInvocation({
      roleId,
      roleVersion: ctx.roleVersion ?? "?",
      locale: ctx.locale ?? "fa",
      provider: providerId,
      model,
      userId: ctx.userId,
      systemPrompt: "",
      userPrompt: "",
      rawOutput: rawText,
      latencyMs,
      inputTokens,
      outputTokens,
      error: message,
    });

    throw err;
  }
}

// re-export برای راحتی
export { loadPrompt };
