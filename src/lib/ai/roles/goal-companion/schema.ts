// ─────────────────────────────────────────────────────────────────────────────
// Goal Companion («همراه») Role — Zod Schemas
// نقش: تارگت‌منیجر + کوچ حرفه‌ای توسعهٔ فردی، متمرکز روی هدفِ کاربر (DECISION-082).
// متمایز از chat-companion (همدم): این نقش تحلیلگرِ مسیرِ هدف است، نه چتِ آزاد.
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ─── Input ───────────────────────────────────────────────────────────────────

export const goalStoryItemSchema = z.object({
  jalaliDate: z.string(),
  content: z.string(),
  mood: z.string().nullable().optional(),
});

export const goalCommitmentItemSchema = z.object({
  jalaliDate: z.string(),
  content: z.string(),
  feedbackStatus: z.enum(["DONE", "NOT_DONE"]).nullable(),
});

export const goalCompanionInputSchema = z.object({
  goalTitle: z.string(),
  startJalali: z.string(),
  endJalali: z.string(),
  dayNumber: z.number().int().positive(),
  totalDays: z.number().int().positive(),
  stories: z.array(goalStoryItemSchema),
  recentCommitments: z.array(goalCommitmentItemSchema),
  weeklySignal: z.string().nullable(),
  recentChat: z.string().nullable(),
});

export type GoalCompanionInput = z.infer<typeof goalCompanionInputSchema>;

// ─── Output ──────────────────────────────────────────────────────────────────
// خروجیِ JSON نقش: reflection + observations + suggestions (لحنِ دعوتی، بدون قضاوت).

export const goalCompanionOutputSchema = z.object({
  reflection: z.string().min(1).max(2000),
  observations: z.array(z.string().min(1).max(600)).max(5).default([]),
  suggestions: z.array(z.string().min(1).max(600)).min(1).max(3),
});

export type GoalCompanionOutput = z.infer<typeof goalCompanionOutputSchema>;
