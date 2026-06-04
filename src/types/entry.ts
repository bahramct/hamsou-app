// ─────────────────────────────────────────────────────────────────────────────
// entry.ts — تایپ‌های تعهد روزانه
//
// SerializedEntry: نسخه‌ای که از Server Component به Client Component پاس می‌شود.
// تاریخ‌ها به ISO string تبدیل می‌شوند چون Date object از Server به Client قابل انتقال نیست.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * تعهد روزانه — آماده انتقال از Server به Client
 */
export interface SerializedEntry {
  id: string;
  content: string;
  /** ISO string — زمان ثبت تعهد */
  createdAt: string;
  /** ISO string — مهلت ویرایش (createdAt + 2 ساعت) */
  editableUntil: string;
  /** true اگر بازه ویرایش به‌صورت صریح بسته شده باشد */
  isLocked: boolean;
  /**
   * آیا الان (در زمان render سمت server) می‌توان ویرایش کرد؟
   * Client Component باید با canEdit(editableUntil) این را واقعی‌تر بررسی کند.
   */
  canEdit: boolean;
  /** true اگر محتوا حداقل یک بار ویرایش شده باشد */
  wasEdited: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ورودی/خروجی API
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateEntryInput {
  content: string;
}

export interface CreateEntryResult {
  ok: boolean;
  entry?: SerializedEntry;
  error?: string;
}

export interface UpdateEntryInput {
  content: string;
}

export interface UpdateEntryResult {
  ok: boolean;
  entry?: SerializedEntry;
  error?: string;
}
