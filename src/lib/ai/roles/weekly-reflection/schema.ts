// ─────────────────────────────────────────────────────────────────────────────
// Weekly Reflection Role — Zod Schemas
// نقش کوچ توسعهٔ فردی — تأمل عمیق ویژهٔ کاربران Plus/Pro (DECISION-037)
// ورودی = همان دادهٔ هفته؛ خروجی = متن تأمل (کوچینگ)
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";
import {
  weeklyEntryItemSchema,
  weeklyDayInputSchema,
  weeklyGapInputSchema,
  weeklyHistoryInputSchema,
} from "@/lib/ai/roles/weekly-report/schema";

export const weeklyReflectionInputSchema = z.object({
  jalaliWeekStart: z.string(),
  jalaliWeekEnd: z.string(),
  entries: z.array(weeklyEntryItemSchema),
  // v2: همان ورودی غنیِ گزارش — اسکلت ۷ روز، گپ‌ها، سیگنال تاریخی
  days: z.array(weeklyDayInputSchema).default([]),
  gaps: z.array(weeklyGapInputSchema).default([]),
  history: weeklyHistoryInputSchema.nullable().default(null),
});

export const weeklyReflectionOutputSchema = z.object({
  reflection: z.string().min(1).max(1200),
});

export type WeeklyReflectionInput = z.infer<typeof weeklyReflectionInputSchema>;
export type WeeklyReflectionOutput = z.infer<typeof weeklyReflectionOutputSchema>;
