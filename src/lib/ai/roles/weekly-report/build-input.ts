// ─────────────────────────────────────────────────────────────────────────────
// سازندهٔ ورودیِ تحلیل (مشترک بین weekly-report و weekly-reflection) — DECISION-047
//
// خروجی، JSON ساختاریافته‌ای است که کلِ هفته را به AI نشان می‌دهد:
//   • days   = اسکلت کامل ۷ روز (شامل خالی/گپ)
//   • gaps   = گپ‌های صریح کاربر (با توضیح)
//   • history= سیگنال فشردهٔ ۴ هفتهٔ گذشته (انرژی/مشغله/روند)
//   • entries= تعهدها، هرکدام با شمارهٔ ref برای ارجاع در categories
// ─────────────────────────────────────────────────────────────────────────────

import type {
  WeeklyEntryItem,
  WeeklyDayInput,
  WeeklyGapInput,
  WeeklyHistoryInput,
} from "@/lib/ai/roles/weekly-report/schema";

export interface AnalysisInputShape {
  jalaliWeekStart: string;
  jalaliWeekEnd: string;
  entries: WeeklyEntryItem[];
  days?: WeeklyDayInput[];
  gaps?: WeeklyGapInput[];
  history?: WeeklyHistoryInput | null;
}

export function buildAnalysisInput(input: AnalysisInputShape) {
  return {
    week: `${input.jalaliWeekStart} تا ${input.jalaliWeekEnd}`,
    history: input.history ?? null,
    days: (input.days ?? []).map((d) => ({
      weekday: d.weekday,
      date: d.jalaliDate,
      state: d.state,
      content: d.content,
      note: d.note,
    })),
    gaps: (input.gaps ?? []).map((g) => ({
      from: g.fromJalali,
      to: g.toJalali,
      days: g.days,
      note: g.note,
    })),
    entries: input.entries.map((e, i) => ({
      ref: i + 1,
      date: e.jalaliDate,
      weekday: e.weekday,
      content: e.content,
      status: e.feedbackStatus,
      note: e.feedbackNote,
    })),
  };
}
