// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password — درخواست بازیابی رمز عبور
//
// body: { email } — ایمیل کاربر
// - کاربر را از روی ایمیل پیدا می‌کند
// - اگر پیدا شد و رمز دارد → توکن ۳۲-بایتی می‌سازد و لینک می‌فرستد
// - پاسخ همیشه ۲۰۰ است (security: نمی‌گوییم آیا حساب وجود دارد یا نه)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { normalizeEmail, generateEmailToken, getResetLinkExpiry } from "@/lib/auth/credentials";
import { devOnlyPayload } from "@/lib/utils/dev-response";
import { getNow } from "@/lib/dev/time";
import { getAppBaseUrl } from "@/lib/utils/app-url";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
    if (!body) {
      return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
    }

    const raw = typeof body.email === "string" ? body.email.trim() : "";
    if (!raw) {
      return NextResponse.json({ error: "ایمیل الزامی است." }, { status: 400 });
    }

    const asEmail = normalizeEmail(raw);
    if (!asEmail) {
      return NextResponse.json({ error: "فرمت ایمیل معتبر نیست." }, { status: 400 });
    }

    let userEmail: string | null = null;

    const user = await prisma.user.findUnique({
      where: { email: asEmail },
      select: { email: true, passwordHash: true },
    });
    // فقط کاربرانی که رمز دارند (مسیر ایمیل/پسورد، نه OTP)
    if (user?.email && user.passwordHash) {
      userEmail = user.email;
    }

    // پاسخ همیشه ۲۰۰ (جلوگیری از user enumeration)
    if (!userEmail) {
      return NextResponse.json({
        ok: true,
        ...devOnlyPayload({ devNote: "کاربر پیدا نشد یا ایمیل ندارد" }),
      });
    }

    const now = getNow();

    // rate limit: اگر توکنِ فعالی هست، همان را برگردان
    const active = await prisma.emailCode.findFirst({
      where: { email: userEmail, purpose: "reset-password", isUsed: false, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    const token = active?.code ?? generateEmailToken();
    const link = `${getAppBaseUrl()}/reset-password?token=${token}`;

    if (!active) {
      await prisma.emailCode.create({
        data: {
          email: userEmail,
          code: token,
          purpose: "reset-password",
          expiresAt: getResetLinkExpiry(),
        },
      });
    }

    await sendPasswordResetEmail(userEmail, link);

    return NextResponse.json({
      ok: true,
      ...devOnlyPayload({ devLink: link }),
    });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
