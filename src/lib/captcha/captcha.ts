// ─────────────────────────────────────────────────────────────────────────────
// captcha.ts — کپچای اختصاصی همسو (DECISION-072)
//
// چرا اختصاصی؟ بدون وابستگی به گوگل/سرویس خارجی (در ایران در دسترس نیست).
// مکانیزم: سرور یک جمعِ سادهٔ دورقمی می‌سازد، آن را به‌صورت SVG با ارقام فارسی،
// چرخش تصادفی و خطوط نویز رندر می‌کند و پاسخ را «stateless» در یک توکنِ HMAC
// امضاشده (با انقضا) برمی‌گرداند. هیچ‌چیز در DB ذخیره نمی‌شود.
//
// امنیت: پاسخ هرگز خام در توکن نیست — فقط HMAC(answer|exp|nonce). کلاینت نمی‌تواند
// پاسخ را از توکن دربیاورد؛ سرور با پاسخِ واردشدهٔ کاربر دوباره HMAC می‌سازد.
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { toFaDigits, toEnDigits } from "@/lib/utils/digits";

const CAPTCHA_TTL_MS = 8 * 60 * 1000; // ۸ دقیقه فرصت برای ارسال فرم

function secret(): string {
  // NEXTAUTH_SECRET در env پروژه موجود است؛ fallback فقط برای dev بدونِ env
  return process.env.NEXTAUTH_SECRET || "hamsoo-captcha-dev-secret";
}

function sign(answer: string, exp: number, nonce: string): string {
  return createHmac("sha256", secret()).update(`${answer}|${exp}|${nonce}`).digest("hex");
}

export interface CaptchaChallenge {
  token: string;
  svg: string;
}

/** ساخت یک چالش جدید: SVG + توکنِ امضاشده. */
export function createCaptcha(): CaptchaChallenge {
  const a = 2 + Math.floor(Math.random() * 8); // ۲..۹
  const b = 1 + Math.floor(Math.random() * 9); // ۱..۹
  const answer = String(a + b);

  const exp = Date.now() + CAPTCHA_TTL_MS;
  const nonce = randomBytes(8).toString("hex");
  const h = sign(answer, exp, nonce);
  const token = Buffer.from(JSON.stringify({ exp, nonce, h })).toString("base64url");

  return { token, svg: renderSvg(`${toFaDigits(a)} + ${toFaDigits(b)}`) };
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

// ─── رندر SVG — ارقام فارسی با چرخش/جابجایی تصادفی + خطوط و نقاط نویز ─────────
function renderSvg(text: string): string {
  const W = 180;
  const H = 60;
  const chars = [...text];
  const startX = 28;
  const step = (W - 56) / Math.max(1, chars.length - 1);

  const glyphs = chars
    .map((ch, i) => {
      const x = startX + i * step + rnd(-3, 3);
      const y = 38 + rnd(-5, 5);
      const rot = rnd(-16, 16);
      return `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-size="${rnd(24, 29)}" font-weight="500" fill="currentColor" text-anchor="middle" font-family="inherit">${escapeXml(ch)}</text>`;
    })
    .join("");

  const lines = Array.from({ length: 4 }, () => {
    const y1 = rnd(8, H - 8);
    const y2 = rnd(8, H - 8);
    return `<path d="M0 ${y1} C ${W / 3} ${rnd(0, H)}, ${(2 * W) / 3} ${rnd(0, H)}, ${W} ${y2}" stroke="currentColor" stroke-width="1" fill="none" opacity="0.22"/>`;
  }).join("");

  const dots = Array.from({ length: 14 }, () => {
    return `<circle cx="${rnd(4, W - 4)}" cy="${rnd(4, H - 4)}" r="${rnd(1, 2)}" fill="currentColor" opacity="0.18"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="کد امنیتی">${lines}${dots}${glyphs}</svg>`;
}

function rnd(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
