// ─────────────────────────────────────────────────────────────────────────────
// Weekly Report Role — Zod Schemas (v3) — DECISION-047
//
// تغییر بنیادی v3:
//   • ورودی غنی شد: علاوه بر entries، اکنون «اسکلت کامل ۷ روز» (days)، گپ‌های
//     صریح کاربر (gaps)، و سیگنال تاریخی ۴ هفته (history) هم به AI داده می‌شود.
//   • خروجی AI فقط «کیفی» است: summary + categories(برچسب + entryRefs) + insights.
//     هیچ عددی از AI خواسته نمی‌شود — همهٔ متریک‌ها در route قطعی محاسبه می‌شوند.
//     این کل کلاسِ باگِ «۱۰۰٪» را حذف می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import { FEEDBACK_STATUSES } from "@/constants/feedback";

// ─── Input ───────────────────────────────────────────────────────────────────

export const weeklyEntryItemSchema = z.object({
  date: z.string(),
  jalaliDate: z.string(),
  weekday: z.string(),
  content: z.string(),
  feedbackStatus: z.enum(FEEDBACK_STATUSES).nullable(),
  feedbackNote: z.string().nullable(),
});

/** اسکلت کامل یک روز از هفته — شامل روزهای خالی و گپ */
export const weeklyDayInputSchema = z.object({
  jalaliDate: z.string(),
  weekday: z.string(),
  state: z.enum(["done", "not_done", "pending", "gap", "empty"]),
  content: z.string().nullable(),
  note: z.string().nullable(),
});

/** گپ صریحِ ثبت‌شدهٔ کاربر (GapRecord) که با هفته همپوشانی دارد */
export const weeklyGapInputSchema = z.object({
  fromJalali: z.string(),
  toJalali: z.string(),
  days: z.number(),
  note: z.string().nullable(),
});

/** سیگنال فشردهٔ ۴ هفتهٔ گذشته — برای استنتاج رفتاری (انرژی/مشغله) */
export const weeklyHistoryInputSchema = z.object({
  weeksConsidered: z.number(),
  avgActiveDays: z.number(), // 0..7
  avgDoneRate: z.number(), // 0..100
  gapWeeks: z.number(),
  trend: z.enum(["rising", "steady", "declining", "unknown"]),
});

export const weeklyReportInputSchema = z.object({
  userId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  jalaliWeekStart: z.string(),
  jalaliWeekEnd: z.string(),
  entries: z.array(weeklyEntryItemSchema),
  days: z.array(weeklyDayInputSchema).default([]),
  gaps: z.array(weeklyGapInputSchema).default([]),
  history: weeklyHistoryInputSchema.nullable().default(null),
  // فقط Plus/Pro: تأمل در نقش جدا (weekly-reflection) — اینجا فقط برای سازگاری
  includeCoaching: z.boolean().default(false),
});

export type WeeklyReportInput = z.infer<typeof weeklyReportInputSchema>;
export type WeeklyEntryItem = z.infer<typeof weeklyEntryItemSchema>;
export type WeeklyDayInput = z.infer<typeof weeklyDayInputSchema>;
export type WeeklyGapInput = z.infer<typeof weeklyGapInputSchema>;
export type WeeklyHistoryInput = z.infer<typeof weeklyHistoryInputSchema>;

// ─── Output (فقط کیفی — هیچ عددی) ─────────────────────────────────────────────

const coercedInt = z
  .union([z.number(), z.string()])
  .transform((v) => {
    const n = typeof v === "number" ? v : parseFloat(v);
    return isNaN(n) ? 0 : Math.round(n);
  });

/** دستهٔ پویا از AI — برچسب + ارجاع به شمارهٔ تعهدها (۱-based) + بُعدِ ثابتِ زندگی.
 *  dimension: یکی از ۶ بُعد ثابت (work/health/relationships/learning/calm/growth)
 *  برای رادارِ همیشه‌۶محور. اگر AI نداد یا نامعتبر بود → undefined (حدس در کد). */
const aiCategorySchema = z.object({
  label: z.string().min(1).max(40),
  entryRefs: z.array(coercedInt).default([]),
  dimension: z
    .enum(["work", "health", "relationships", "learning", "calm", "growth"])
    .optional(),
});

const aiInsightSchema = z.object({
  text: z.string().min(1).max(600),
});

export const weeklyReportOutputSchema = z.object({
  summary: z.string().min(5).max(3000),
  categories: z.array(aiCategorySchema).max(6).default([]),
  insights: z.array(aiInsightSchema).max(8).default([]),
});

export type WeeklyReportOutput = z.infer<typeof weeklyReportOutputSchema>;
export type AICategory = z.infer<typeof aiCategorySchema>;
export type AIInsight = z.infer<typeof aiInsightSchema>;
