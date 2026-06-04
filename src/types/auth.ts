// ─────────────────────────────────────────────────────────────────────────────
// تایپ‌های احراز هویت — همسو
// ─────────────────────────────────────────────────────────────────────────────

// payload ذخیره‌شده درون JWT session cookie
export interface SessionPayload {
  userId: string;
  phone: string;
}

// نتیجه بررسی session در middleware / server components
export type SessionResult =
  | { valid: true; payload: SessionPayload }
  | { valid: false; payload: null };
