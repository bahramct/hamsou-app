// ─────────────────────────────────────────────────────────────────────────────
// utils.ts — توابع کمکیِ بلاگ (DECISION-065)
// slug، لینک کوتاه، زمان مطالعه، fingerprint لایک، excerpt.
// ─────────────────────────────────────────────────────────────────────────────

import { createHash, randomBytes } from "crypto";
import { stripMarkdown } from "./markdown";

/**
 * slugify — تولید slug برای URL.
 * فارسی و لاتین و رقم حفظ می‌شوند (مرورگر encode می‌کند)؛ فاصله/نویسهٔ نامجاز → "-".
 * نتیجهٔ خالی (مثلاً ورودیِ تماماً نمادین) → رشتهٔ تصادفی.
 */
export function slugify(input: string): string {
  const s = (input || "")
    .trim()
    .toLowerCase()
    // حذف نویسه‌های کنترلی و نمادهای نامجاز؛ حفظ حروف فارسی/عربی، لاتین، رقم
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || `post-${randomCode(6)}`;
}

/** کدِ تصادفیِ base62 با طولِ مشخص. */
function randomCode(len: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** لینکِ کوتاهِ یکتا (۷ نویسه) — مسیر /b/<code>. یکتایی در سطح DB با @unique تضمین می‌شود. */
export function generateShortCode(): string {
  return randomCode(7);
}

/**
 * زمانِ تخمینیِ مطالعه به دقیقه.
 * متنِ فارسی ~۲۰۰ کلمه در دقیقه. حداقل ۱ دقیقه.
 */
export function calcReadingMinutes(content: string): number {
  const text = stripMarkdown(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * excerpt — خلاصهٔ خودکار از محتوا (وقتی ادمین خلاصهٔ دستی نگذاشته).
 * Markdown حذف، تا maxLen نویسه با حفظِ مرزِ کلمه.
 */
export function makeExcerpt(content: string, maxLen = 160): string {
  const text = stripMarkdown(content);
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/**
 * fingerprint — شناسهٔ ناشناسِ بازدیدکننده برای جلوگیری از لایکِ تکراری.
 * کاربر لاگین نیست → hash(IP + User-Agent). برگشت‌پذیر نیست (حریم خصوصی).
 */
export function visitorFingerprint(ip: string, userAgent: string): string {
  return createHash("sha256").update(`${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

/** IP درخواست از headerهای رایجِ پروکسی/CDN. */
export function getRequestIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "0.0.0.0"
  );
}
