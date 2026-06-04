// ─────────────────────────────────────────────────────────────────────────────
// auth/password.ts — هش/تأیید/سیاستِ پسوردِ کاربرانِ سایت (DECISION-058)
//
// hashing: همان scrypt داخلیِ node:crypto که ادمین استفاده می‌کند (بدونِ وابستگیِ
//   بیرونی، salt مجزا). برای پرهیز از تکرارِ کد، توابعِ خامِ hash/verify از ماژولِ
//   ادمین re-export می‌شوند؛ اما سیاستِ پیچیدگیِ کاربر مستقل و ملایم‌تر است
//   (تجربهٔ بدون‌اصطکاکِ برند): حداقل ۸ کاراکتر، بدونِ اجبارِ نماد/حروفِ بزرگ.
//
// نکته: این فایل server-only است (node:crypto). در middleware/edge import نشود.
// ─────────────────────────────────────────────────────────────────────────────

import { hashPassword, verifyPassword } from "@/lib/admin/password";

export { hashPassword, verifyPassword };

const MIN_LENGTH = 8;
const MAX_LENGTH = 100;

export interface PasswordCheck {
  ok: boolean;
  error?: string;
}

/** بررسی پیچیدگیِ پسوردِ کاربر (ملایم‌تر از ادمین). */
export function validateUserPassword(pw: unknown): PasswordCheck {
  if (typeof pw !== "string" || pw.length < MIN_LENGTH) {
    return { ok: false, error: `رمز عبور باید حداقل ${MIN_LENGTH} کاراکتر باشد.` };
  }
  if (pw.length > MAX_LENGTH) {
    return { ok: false, error: "رمز عبور بیش از حد طولانی است." };
  }
  return { ok: true };
}
