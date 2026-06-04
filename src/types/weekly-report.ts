// ─────────────────────────────────────────────────────────────────────────────
// Weekly Report — Serialization & render types (Server→Client) — v3 (DECISION-047)
//
// اصل کلیدی v3: اعداد (متریک‌ها) در کد محاسبه می‌شوند، نه AI. AI فقط بخش کیفی
// (روایت، خوشه‌بندی دسته‌ها، بینش) را برمی‌گرداند. خروجی نهایی به‌صورت JSON در
// WeeklyReport.aiContent ذخیره می‌شود (DECISION-012).
//
// سازگاری عقب: فیلدهای v3 اختیاری‌اند تا گزارش‌های قدیمی (v1/v2) هم بدون crash
// رندر شوند؛ نرمال‌سازی نهایی در WeeklyReportCard انجام می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

export type DayState = "done" | "not_done" | "pending" | "gap" | "empty";

/** یک خانه از نوار ۷‌روزهٔ هفته (قطعی — از DB). */
export interface WeeklyDayCell {
  jalaliDate: string;
  weekday: string;
  state: DayState;
}

/** دستهٔ پویا — برچسب از AI، شمارش‌ها قطعی (از entryRefs در کد محاسبه شد).
 *  dimension: بُعدِ ثابتِ زندگی برای رادار (یکی از DIMENSION_KEYS) — اختیاری،
 *  در نبودش با کلیدواژه/fallback در mapToDimensions حدس زده می‌شود. */
export interface WeeklyCategory {
  label: string;
  doneCount: number;
  notDoneCount: number;
  total: number;
  dimension?: string;
}

/** متریک‌های قطعیِ هفته (همه در route محاسبه می‌شوند). */
export interface WeeklyMetrics {
  totalDays: number; // همیشه ۷
  activeDays: number; // روزهای دارای تعهد
  doneCount: number;
  notDoneCount: number;
  pendingCount: number;
  gapDays: number; // روزهای پوشش‌داده‌شده با GapRecord (بدون تعهد)
  emptyDays: number; // روزهای بدون تعهد و بدون گپ
  doneOfCommitted: number; // ٪ انجام از ثبت‌شده‌های دارای بازخورد (متریک ثانویه، نه سرآیند)
}

/** بینش عمیق (AI). */
export interface WeeklyInsight {
  text: string;
}

/**
 * محتوای رندرِ گزارش — ذخیره‌شده در aiContent.content.
 * فیلدهای v3 اختیاری‌اند تا گزارش‌های قدیمی نیز structurally parse شوند.
 */
export interface WeeklyReportContent {
  summary: string;
  insights?: WeeklyInsight[];
  categories?: WeeklyCategory[];
  reflection: string | null;

  // v3 — قطعی
  metrics?: WeeklyMetrics;
  dayStrip?: WeeklyDayCell[];

  // legacy (v1/v2) — برای سازگاری عقب در normalizer
  highlights?: string[];
  completionRate?: number;
  totalEntries?: number;
  doneCount?: number;
  notDoneCount?: number;
  pendingCount?: number;
}

export interface SerializedWeeklyReport {
  id: string;
  weekStart: string; // ISO
  weekEnd: string; // ISO
  jalaliStart: string;
  jalaliEnd: string;
  generatedAt: string; // ISO
  content: WeeklyReportContent;
  meta: {
    provider: string;
    model: string;
    locale: string;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
  };
  isShared: boolean;
}
