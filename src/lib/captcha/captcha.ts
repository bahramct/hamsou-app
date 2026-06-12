// ─────────────────────────────────────────────────────────────────────────────
// captcha.ts — کپچای اختصاصی همسو (DECISION-072 + DECISION-077)
//
// چرا اختصاصی؟ بدون وابستگی به گوگل/سرویس خارجی (در ایران در دسترس نیست).
// مکانیزم: سرور یک چالش ریاضی (جمع دورقمی / ضرب / ضرب+جمع/تفریق) می‌سازد،
// آن را به‌صورت SVG با ارقام فارسی، چرخش تصادفی و خطوط نویز رندر می‌کند
// و پاسخ را «stateless» در یک توکنِ HMAC امضاشده (با انقضا) برمی‌گرداند.
// هیچ‌چیز در DB ذخیره نمی‌شود.
//
// امنیت: پاسخ هرگز خام در توکن نیست — فقط HMAC(answer|exp|nonce). کلاینت نمی‌تواند
// پاسخ را از توکن دربیاورد؛ سرور با پاسخِ واردشدهٔ کاربر دوباره HMAC می‌سازد.
//
// سطح پیچیدگی (DECISION-077):
//   ۱. جمع دو عدد دورقمی (مثال: ۳۴ + ۲۷)
//   ۲. ضرب دو رقم تکی (مثال: ۷ × ۸)
//   ۳. ضرب + جمع (مثال: ۵ × ۴ + ۶)
//   ۴. ضرب - تفریق (مثال: ۶ × ۷ − ۹)
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { toFaDigits, toEnDigits } from "@/lib/utils/digits";

const CAPTCHA_TTL_MS = 8 * 60 * 1000; // ۸ دقیقه فرصت برای ارسال فرم

function secret(): string {
  return process.env.NEXTAUTH_SECRET || "hamsoo-captcha-dev-secret";
}

function sign(answer: string, exp: number, nonce: string): string {
  return createHmac("sha256", secret()).update(`${answer}|${exp}|${nonce}`).digest("hex");
}

export interface CaptchaChallenge {
  token: string;
  svg: string;
}

// ─── ساخت چالش ریاضی ──────────────────────────────────────────────────────
type ChallengeType = "add2" | "mul" | "mul_add" | "mul_sub";

function buildChallenge(): { displayText: string; answer: number } {
  const types: ChallengeType[] = ["add2", "mul", "mul_add", "mul_sub"];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === "add2") {
    // جمع دو عدد دورقمی: ۱۱–۴۹ + ۱۱–۴۹
    const a = 11 + Math.floor(Math.random() * 39);
    const b = 11 + Math.floor(Math.random() * 39);
    return { displayText: `${toFaDigits(a)} + ${toFaDigits(b)}`, answer: a + b };
  }

  if (type === "mul") {
    // ضرب دو رقم: ۳–۹ × ۳–۹
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    return { displayText: `${toFaDigits(a)} × ${toFaDigits(b)}`, answer: a * b };
  }

  if (type === "mul_add") {
    // ضرب + جمع: a × b + c (نتیجه ≤ ۹۹)
    const a = 2 + Math.floor(Math.random() * 5); // ۲–۶
    const b = 2 + Math.floor(Math.random() * 5); // ۲–۶
    const maxC = Math.min(99 - a * b, 15);
    const c = 2 + Math.floor(Math.random() * Math.max(1, maxC - 1));
    return { displayText: `${toFaDigits(a)} × ${toFaDigits(b)} + ${toFaDigits(c)}`, answer: a * b + c };
  }

  // mul_sub: a × b − c (نتیجه ≥ ۲)
  const a = 3 + Math.floor(Math.random() * 5); // ۳–۷
  const b = 3 + Math.floor(Math.random() * 5); // ۳–۷
  const product = a * b;
  const maxC = Math.min(product - 2, 12);
  const c = 1 + Math.floor(Math.random() * Math.max(1, maxC));
  return { displayText: `${toFaDigits(a)} × ${toFaDigits(b)} − ${toFaDigits(c)}`, answer: product - c };
}

/** ساخت یک چالش جدید: SVG + توکنِ امضاشده. */
export function createCaptcha(): CaptchaChallenge {
  const { displayText, answer } = buildChallenge();
  const answerStr = String(answer);

  const exp = Date.now() + CAPTCHA_TTL_MS;
  const nonce = randomBytes(8).toString("hex");
  const h = sign(answerStr, exp, nonce);
  const token = Buffer.from(JSON.stringify({ exp, nonce, h })).toString("base64url");

  return { token, svg: renderSvg(displayText) };
}

export type CaptchaVerify = { ok: true } | { ok: false; reason: string };

/** بررسی پاسخ کاربر در برابر توکن — ارقام فارسی/لاتین هر دو پذیرفته. */
export function verifyCaptcha(token: string, userAnswer: string): CaptchaVerify {
  let payload: { exp?: number; nonce?: string; h?: string };
  try {
    payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "کپچا نامعتبر است — دوباره تلاش کن." };
  }
  const { exp, nonce, h } = payload;
  if (!exp || !nonce || !h) return { ok: false, reason: "کپچا نامعتبر است — دوباره تلاش کن." };
  if (Date.now() > exp) return { ok: false, reason: "کپچا منقضی شده — تصویر را تازه کن." };

  const normalized = toEnDigits(userAnswer.trim());
  if (!/^\d{1,3}$/.test(normalized)) return { ok: false, reason: "پاسخ کپچا را با عدد وارد کن." };

  const expected = sign(normalized, exp, nonce);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(h, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "پاسخ کپچا درست نیست." };
  }
  return { ok: true };
}

// ─── رندر SVG — عرض پویا + چرخش/جابجایی تصادفی + خطوط و نقاط نویز ──────────
function renderSvg(text: string): string {
  const chars = [...text];
  // عرض متناسب با تعداد کاراکتر (DECISION-077)
  const W = Math.max(180, chars.length * 22 + 40);
  const H = 64;
  const startX = 28;
  const step = chars.length > 1 ? (W - 56) / (chars.length - 1) : 0;

  const glyphs = chars
    .map((ch, i) => {
      const x = startX + i * step + rnd(-3, 3);
      const y = 40 + rnd(-6, 6);
      const rot = rnd(-18, 18);
      return `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-size="${rnd(23, 28)}" font-weight="600" fill="currentColor" text-anchor="middle" font-family="inherit">${escapeXml(ch)}</text>`;
    })
    .join("");

  const lines = Array.from({ length: 5 }, () => {
    const y1 = rnd(8, H - 8);
    const y2 = rnd(8, H - 8);
    return `<path d="M0 ${y1} C ${W / 3} ${rnd(0, H)}, ${(2 * W) / 3} ${rnd(0, H)}, ${W} ${y2}" stroke="currentColor" stroke-width="${rnd(1, 2)}" fill="none" opacity="0.20"/>`;
  }).join("");

  const dots = Array.from({ length: 20 }, () => {
    return `<circle cx="${rnd(4, W - 4)}" cy="${rnd(4, H - 4)}" r="${rnd(1, 2)}" fill="currentColor" opacity="0.16"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="کد امنیتی">${lines}${dots}${glyphs}</svg>`;
}

function rnd(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
