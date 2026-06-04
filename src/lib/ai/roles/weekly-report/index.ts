// ─────────────────────────────────────────────────────────────────────────────
// Weekly Report Role — v2
// نقش: تحلیل عمیق هفته کاربر — دسته‌بندی پویا، بینش‌های واقعی، کوچینگ Plus/Pro
// منبع پرامپت: prompts/weekly-report/v2.fa.md
// ─────────────────────────────────────────────────────────────────────────────

import { loadPrompt } from "@/lib/ai/prompt-loader";
import type { AILocale, AIRole } from "@/lib/ai/types";
import {
  weeklyReportInputSchema,
  weeklyReportOutputSchema,
  type WeeklyReportInput,
  type WeeklyReportOutput,
} from "@/lib/ai/roles/weekly-report/schema";
import { buildAnalysisInput } from "@/lib/ai/roles/weekly-report/build-input";

const ROLE_ID = "weekly-report";
const ROLE_VERSION = "3.0.0";

export const weeklyReportRole: AIRole<WeeklyReportInput, WeeklyReportOutput> = {
  id: ROLE_ID,
  version: ROLE_VERSION,
  meta: {
    description:
      "تحلیلگر رفتار — تحلیل کلِ هفته (تعهد/گپ/خالی) + خوشه‌بندی پویا + بینش عمیق + سیگنال تاریخی",
    jsonMode: false,
    defaultTemperature: 0.7,
    maxOutputTokens: 1400,
  },
  inputSchema: weeklyReportInputSchema,
  outputSchema: weeklyReportOutputSchema,

  async buildPrompt(input: WeeklyReportInput, locale: AILocale) {
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

  parseOutput(raw: string): unknown {
    return extractJson(raw);
  },
};

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // ignore
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1));
  }

  throw new Error(
    "[weekly-report] خروجی Provider قابل parse به JSON نیست — متن خام:\n" +
      trimmed.slice(0, 300)
  );
}
