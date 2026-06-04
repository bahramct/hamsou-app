// ─────────────────────────────────────────────────────────────────────────────
// feedback.ts — تایپ‌های بازخورد روزانه (TASK-006)
// ─────────────────────────────────────────────────────────────────────────────

import type { FeedbackStatus } from "@/constants/feedback";

/**
 * تعهدی که منتظر بازخورد است — از Server Component به FeedbackForm پاس می‌شود.
 * تاریخ‌ها از قبل فرمت شده‌اند تا FeedbackForm به date.ts وابسته نباشد.
 */
export interface PendingFeedbackEntry {
  id: string;
  content: string;
  /** نمایش شمسی — مثال: «۲۶ اردیبهشت ۱۴۰۳» */
  dateLabel: string;
  /** روز هفته — مثال: «سه‌شنبه» */
  weekdayLabel: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ورودی/خروجی API
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateFeedbackInput {
  entryId: string;
  status: FeedbackStatus;
  note?: string;
}

export interface CreateFeedbackResult {
  ok: boolean;
  feedback?: {
    id: string;
    status: FeedbackStatus;
    note: string | null;
  };
  error?: string;
  message?: string;
}
