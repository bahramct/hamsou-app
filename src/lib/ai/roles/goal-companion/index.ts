// ─────────────────────────────────────────────────────────────────────────────
// Goal Companion («همراه») Role — DECISION-082
// نقش: تارگت‌منیجر + کوچ حرفه‌ای توسعهٔ فردی برای مسیرِ یک هدفِ بازه‌ای.
// منبع پرامپت: prompts/goal-companion/v1.fa.md
// مصرف: invokeAI("goal-companion", input, ctx) — هرگز مستقیم adapter صدا نمی‌زند.
// ─────────────────────────────────────────────────────────────────────────────

import { loadPrompt } from "@/lib/ai/prompt-loader";
import type { AILocale, AIRole } from "@/lib/ai/types";
import {
  goalCompanionInputSchema,
  goalCompanionOutputSchema,
  type GoalCompanionInput,
  type GoalCompanionOutput,
} from "@/lib/ai/roles/goal-companion/schema";

const ROLE_ID = "goal-companion";
const ROLE_VERSION = "1.0.0";

export const goalCompanionRole: AIRole<GoalCompanionInput, GoalCompanionOutput> = {
  id: ROLE_ID,
  version: ROLE_VERSION,
  meta: {
    description:
      "همراه — تارگت‌منیجر/کوچ حرفه‌ای: تحلیلِ روندِ هدف + مشاهدات + پیشنهادهای دعوتی (Pro)",
    jsonMode: true,
    defaultTemperature: 0.7,
    maxOutputTokens: 900,
    privacySensitive: true,
  },
  inputSchema: goalCompanionInputSchema,
  outputSchema: goalCompanionOutputSchema,

  async buildPrompt(input: GoalCompanionInput, locale: AILocale) {
    const storiesJson =
      input.stories.length > 0 ? JSON.stringify(input.stories, null, 2) : "[]";
    const commitmentsJson =
      input.recentCommitments.length > 0
        ? JSON.stringify(input.recentCommitments, null, 2)
        : "[]";

    return loadPrompt({
      roleId: ROLE_ID,
      version: ROLE_VERSION,
      locale,
      variables: {
        GOAL_TITLE: input.goalTitle,
        START_JALALI: input.startJalali,
        END_JALALI: input.endJalali,
        DAY_NUMBER: String(input.dayNumber),
        TOTAL_DAYS: String(input.totalDays),
        STORIES_JSON: storiesJson,
        COMMITMENTS_JSON: commitmentsJson,
        WEEKLY_SIGNAL: input.weeklySignal ?? "(ندارد)",
        RECENT_CHAT: input.recentChat ?? "(ندارد)",
      },
    }).then(({ systemPrompt, userPrompt }) => ({ systemPrompt, userPrompt }));
  },

  parseOutput(raw: string): unknown {
    return extractJson(raw);
  },
};

// استخراجِ JSON از خروجیِ provider — مثل weekly-report (تحملِ code fence / متنِ اطراف).
function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // ادامه
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
    "[goal-companion] خروجی Provider قابل parse به JSON نیست — متن خام:\n" +
      trimmed.slice(0, 300)
  );
}
