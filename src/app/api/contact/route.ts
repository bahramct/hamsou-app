// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact — ثبت پیام فرم «تماس با ما» (DECISION-072)
// عمومی (بدون حساب). محافظ‌ها: honeypot + کپچای اختصاصی + سقف نرخ سادهٔ per-IP.
// پیام در ContactMessage ذخیره و در پنل ادمین (پیام‌های تماس) دیده می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verifyCaptcha } from "@/lib/captcha/captcha";

const NAME_MAX = 80;
const SUBJECT_MAX = 120;
const BODY_MAX = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// سقف نرخ سبک در حافظه — ۵ پیام per IP per ۱۰ دقیقه (best-effort، مثل سایر گاردهای سبک)
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const globalForRate = globalThis as unknown as { __hamsoo_contact_rate?: Map<string, number[]> };
const rateMap =
  globalForRate.__hamsoo_contact_rate ?? (globalForRate.__hamsoo_contact_rate = new Map<string, number[]>());

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (rateMap.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    rateMap.set(ip, arr);
    return true;
  }
  arr.push(now);
  rateMap.set(ip, arr);
  return false;
}

export async function POST(req: NextRequest) {
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;

  // honeypot — اگر فیلد مخفی پر شد یعنی ربات؛ بی‌صدا «موفق»
  if (typeof b.website === "string" && b.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "تعداد پیام‌ها زیاد شد — کمی بعد دوباره تلاش کن." },
      { status: 429 }
    );
  }

  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const subject = typeof b.subject === "string" ? b.subject.trim() : "";
  const body = typeof b.body === "string" ? b.body.trim() : "";
  const captchaToken = typeof b.captchaToken === "string" ? b.captchaToken : "";
  const captchaAnswer = typeof b.captchaAnswer === "string" ? b.captchaAnswer : "";

  if (!name || name.length > NAME_MAX)
    return NextResponse.json({ error: "نام را درست وارد کن." }, { status: 400 });
  if (!EMAIL_RE.test(email))
    return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
  if (subject.length > SUBJECT_MAX)
    return NextResponse.json({ error: "موضوع طولانی است." }, { status: 400 });
  if (!body || body.length > BODY_MAX)
    return NextResponse.json({ error: "متن پیام را درست وارد کن." }, { status: 400 });

  const captcha = verifyCaptcha(captchaToken, captchaAnswer);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.reason, captcha: true }, { status: 400 });
  }

  await prisma.contactMessage.create({
    data: { name, email, subject: subject || null, body },
  });

  return NextResponse.json({
    ok: true,
    message: "پیامت رسید. معمولاً ظرف ۴۸ ساعت پاسخ می‌دهیم.",
  });
}
