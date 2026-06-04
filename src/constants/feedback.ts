// مقادیر مجاز وضعیت بازخورد روزانه
// SQLite + Prisma از Enum پشتیبانی نمی‌کند → مقدار به‌صورت String در DB
export const FEEDBACK_STATUSES = ["DONE", "NOT_DONE"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export function isFeedbackStatus(value: unknown): value is FeedbackStatus {
  return typeof value === "string" && (FEEDBACK_STATUSES as readonly string[]).includes(value);
}
