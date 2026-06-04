// ─────────────────────────────────────────────────────────────────────────────
// Weekly Reflection Role
// نقش: کوچ توسعهٔ فردی — تأمل عمیق هفته (ویژهٔ Plus/Pro)
// منبع پرامپت: prompts/weekly-reflection/v1.fa.md
// ─────────────────────────────────────────────────────────────────────────────

import { loadPrompt } from "@/lib/ai/prompt-loader";
import type { AILocale, AIRole } from "@/lib/ai/types";
import {
  weeklyReflectionInputSchema,
  weeklyReflectionOutputSchema,
  type WeeklyReflectionInput,
  type WeeklyReflectionOutput,
} from "@/lib/ai/roles/weekly-reflection/schema";
import { buildAnalysisInput } from "@/lib/ai/roles/weekly-report/build-input";

const ROLE_ID = "weekly-reflection";
const ROLE_VERSION = "2.0.0";

export const weeklyReflectionRole: AIRole<WeeklyReflectionInput, WeeklyReflectionOutput> = {
  id: ROLE_ID,
  version: ROLE_VERSION,
  meta: {
    description: "کوچ توسعهٔ فردی — تأمل عمیق هفتگی (Plus/Pro)",
    jsonMode: false,
    defaultTemperature: 0.75,
    maxOutputTokens: 600,
  },
  inputSchema: weeklyReflectionInputSchema,
  outputSchema: weeklyReflectionOutputSchema,

  async buildPrompt(input: WeeklyReflectionInput, locale: AILocale) {
    const inputJson = JSON.stringify(buildAnalysisInput(input), null, 2);

    return loadPrompt({
      roleId: ROLE_ID,
      version: ROLE_VERSION,
      locale,
      variables: {
        WEEK_START: input.jalaliWeekStart,
        WEEK_END: input.jalaliWeekEnd,
        INPUT_JSON: inputJson,
      },
    }).then(({ systemPrompt, userPrompt }) => ({ systemPrompt, userPrompt }));
  },

  // خروجی متن ساده — در { reflection } می‌پیچیم
  parseOutput(raw: string): unknown {
    return { reflection: raw.trim() };
  },
};
