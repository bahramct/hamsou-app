// ─────────────────────────────────────────────────────────────────────────────
// constants.ts — مقادیر ثابتِ بلاگ (DECISION-065)
// وضعیت‌ها رشته‌اند (SQLite enum ندارد)؛ این فایل منبع‌حقیقتِ کد است.
// ─────────────────────────────────────────────────────────────────────────────

export const POST_STATUSES = ["draft", "published", "archived"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: "پیش‌نویس",
  published: "منتشر شده",
  archived: "بایگانی",
};

export const COMMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  pending: "در انتظار تأیید",
  approved: "تأیید شده",
  rejected: "رد شده",
};

/** تعداد مقاله در هر صفحهٔ فهرستِ عمومی. */
export const POSTS_PER_PAGE = 9;

/** حداکثر طولِ کامنت (نویسه). */
export const COMMENT_MAX_LEN = 1500;
/** حداکثر طولِ نامِ کامنت‌گذار. */
export const COMMENT_NAME_MAX_LEN = 60;
