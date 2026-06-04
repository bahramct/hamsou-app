// ─────────────────────────────────────────────────────────────────────────────
// Chat Companion Role
// نقش: همراه صمیمی کاربر — دسترسی به سابقه تعهدها، مکالمه دوستانه
// منبع پرامپت: prompts/chat-companion/v1.fa.md
// ─────────────────────────────────────────────────────────────────────────────

import { loadPrompt } from "@/lib/ai/prompt-loader";
import type { AILocale, AIRole } from "@/lib/ai/types";
import {
  chatCompanionInputSchema,
  chatCompanionOutputSchema,
  type ChatCompanionInput,
  type ChatCompanionOutput,
} from "@/lib/ai/roles/chat-companion/schema";

const ROLE_ID = "chat-companion";
const ROLE_VERSION = "1.0.0";

export const chatCompanionRole: AIRole<ChatCompanionInput, ChatCompanionOutput> = {
  id: ROLE_ID,
  version: ROLE_VERSION,
  meta: {
    description: "همراه صمیمی کاربر — مکالمه دوستانه با دسترسی به سابقه تعهدها",
    jsonMode: false,
    defaultTemperature: 0.85,
    maxOutputTokens: 500,
    privacySensitive: true,
  },
  inputSchema: chatCompanionInputSchema,
  outputSchema: chatCompanionOutputSchema,

  async buildPrompt(input: ChatCompanionInput, locale: AILocale) {
    const contextJson =
      input.contextSnapshot.recentEntries.length > 0
        ? JSON.stringify(input.contextSnapshot.recentEntries, null, 2)
        : "[]";

    // تاریخچه مکالمه — هر خط یک پیام
    const historyText =
      input.conversationHistory.length > 0
        ? input.conversationHistory
            .map((m) =>
              m.role === "user"
                ? `کاربر: ${m.content}`
                : `${input.companionName}: ${m.content}`
            )
            .join("\n")
        : "";

    return loadPrompt({
      roleId: ROLE_ID,
      version: ROLE_VERSION,
      locale,
      variables: {
        COMPANION_NAME: input.companionName,
        USER_DISPLAY_NAME: input.userDisplayName ?? "کاربر",
        TODAY_JALALI: input.todayJalali,
        CONTEXT_JSON: contextJson,
        CONVERSATION_HISTORY: historyText ? historyText + "\n" : "",
        USER_MESSAGE: input.userMessage,
      },
    }).then(({ systemPrompt, userPrompt }) => ({ systemPrompt, userPrompt }));
  },

  // خروجی plain text — در { reply } می‌پیچیم
  parseOutput(raw: string): unknown {
    return { reply: raw.trim() };
  },
};
