// مقادیر مجاز پلن کاربر
// SQLite + Prisma از Enum پشتیبانی نمی‌کند → مقدار به‌صورت String در DB
// validation در application layer از این لیست انجام می‌شود
export const USER_PLANS = ["FREE", "PLUS", "PRO"] as const;
export type UserPlan = (typeof USER_PLANS)[number];

export const DEFAULT_USER_PLAN: UserPlan = "FREE";

export function isUserPlan(value: unknown): value is UserPlan {
  return typeof value === "string" && (USER_PLANS as readonly string[]).includes(value);
}
