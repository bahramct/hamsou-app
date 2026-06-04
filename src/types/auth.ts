// ─────────────────────────────────────────────────────────────────────────────
// تایپ‌های احراز هویت — همسو
// ─────────────────────────────────────────────────────────────────────────────

// payload ذخیره‌شده درون JWT session cookie
// نکته (DECISION-058): از زمانِ احراز هویتِ چندگانه، کاربر ممکن است موبایل نداشته
// باشد (ثبت‌نام با ایمیل). پس phone اختیاری است؛ کلیدِ هویت همیشه userId است.
export interface SessionPayload {
  userId: string;
  phone?: string | null;
}

// نتیجه بررسی session در middleware / server components
export type SessionResult =
  | { valid: true; payload: SessionPayload }
  | { valid: false; payload: null };
