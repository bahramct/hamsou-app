// ─────────────────────────────────────────────────────────────────────────────
// Chat Companion Role — Zod Schemas
// ─────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ─── Input Schema ────────────────────────────────────────────────────────────

export const chatContextEntrySchema = z.object({
  jalaliDate: z.string(),
  content: z.string(),
  feedbackStatus: z.enum(["DONE", "NOT_DONE"]).nullable(),
});

export const chatMessageItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const chatCompanionInputSchema = z.object({
  companionName: z.string().default("همدل"),
  userDisplayName: z.string().nullable(),
  todayJalali: z.string(),
  contextSnapshot: z.object({
    recentEntries: z.array(chatContextEntrySchema),
  }),
  conversationHistory: z.array(chatMessageItemSchema),
  userMessage: z.string().min(1).max(2000),
});

export type ChatCompanionInput = z.infer<typeof chatCompanionInputSchema>;
export type ChatMessageItem = z.infer<typeof chatMessageItemSchema>;

// ─── Output Schema ───────────────────────────────────────────────────────────
// خروجی plain text — role.parseOutput آن را در { reply } می‌پیچد

export const chatCompanionOutputSchema = z.object({
  reply: z.string().min(1).max(3000),
});

export type ChatCompanionOutput = z.infer<typeof chatCompanionOutputSchema>;
