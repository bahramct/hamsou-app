// ─────────────────────────────────────────────────────────────────────────────
// admin/password.ts — هش، تأیید، پیچیدگی و تولید رمز ادمین (DECISION-038)
//
// hashing: scrypt داخلی node:crypto (بدون وابستگی بیرونی، salt مجزا برای هر رمز).
// قالب ذخیره: "salt(hex):derivedKey(hex)".
// سیاست پیچیدگی: حداقل ۱۰ کاراکتر + حداقل ۳ از ۴ دسته (بزرگ/کوچک/رقم/نماد).
//
// نکته: این فایل server-only است (node:crypto). در middleware/edge import نشود.
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

const MIN_LENGTH = 10;
const MIN_CLASSES = 3;

// ─── هش و تأیید ───────────────────────────────────────────────────────────────

/** هش رمز با scrypt + salt تصادفی. خروجی: "salt:hash" (hex). */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derived = scryptSync(plain, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** تأیید رمز در برابر مقدار ذخیره‌شده. timing-safe. */
export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = scryptSync(plain, salt, expected.length);
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ─── سیاست پیچیدگی ────────────────────────────────────────────────────────────

function countClasses(pw: string): number {
  let n = 0;
  if (/[A-Z]/.test(pw)) n++;
  if (/[a-z]/.test(pw)) n++;
  if (/[0-9]/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
}

export interface ComplexityResult {
  ok: boolean;
  error?: string;
}

/** بررسی پیچیدگی رمز طبق سیاست DECISION-038. */
export function validatePasswordComplexity(pw: string): ComplexityResult {
  if (typeof pw !== "string" || pw.length < MIN_LENGTH) {
    return { ok: false, error: `رمز باید حداقل ${MIN_LENGTH} کاراکتر باشد.` };
  }
  if (countClasses(pw) < MIN_CLASSES) {
    return {
      ok: false,
      error: "رمز باید حداقل ۳ نوع از: حروف بزرگ، حروف کوچک، رقم، نماد را داشته باشد.",
    };
  }
  return { ok: true };
}

// ─── تولید رمز پیچیده (auto-generate برای حساب جدید) ──────────────────────────

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // بدون I,O برای خوانایی
const LOWER = "abcdefghijkmnpqrstuvwxyz"; // بدون l,o
const DIGITS = "23456789"; // بدون 0,1
const SYMBOLS = "@#$%*?!&";

function pick(set: string): string {
  return set[randomBytes(1)[0] % set.length];
}

/** تولید رمز پیچیده ۱۴ کاراکتری که همیشه هر ۴ دسته را دارد. */
export function generatePassword(length = 14): string {
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  for (let i = chars.length; i < length; i++) chars.push(pick(all));
  // به‌هم‌ریختن (Fisher–Yates با بایت تصادفی)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
