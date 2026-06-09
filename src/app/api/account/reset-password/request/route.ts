// ─────────────────────────────────────────────────────────────────────────────
// POST /api/account/reset-password/request — ارسال کد تغییر رمز به ایمیل کاربر
//
// کاربر باید session + ایمیل تأیید‌شده داشته باشد.
// یک EmailCode با purpose="reset-password" می‌سازد و به ایمیل ثبت‌شده ارسال می‌کند.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { sendVerificationCodeEmail } from "@/lib/email/send";
import { generateEmailCode, getEmailCodeExpiry } from "@/lib/auth/credentials";
import { devOnlyPayload } from "@/lib/utils/dev-response";
import { getNow } from "@/lib/dev/time";

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, emailVerifiedAt: true },
    });

    if (!user?.email || !user.emailVerifiedAt) {
      return NextResponse.json(
        { error: "ایمیل تأیید‌شده‌ای در حساب شما ثبت نشده است." },
        { status: 400 }
      );
    }

    const now = getNow();
    const active = await prisma.emailCode.findFirst({
      where: {
        email: user.email,
        purpose: "reset-password",
        userId: session.userId,
        isUsed: false,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });
    if (active) {
      return NextResponse.json({ ok: true, ...devOnlyPayload({ devCode: active.code }) });
    }

    const code = generateEmailCode();
    await prisma.emailCode.create({
      data: {
        email: user.email,
        code,
        purpose: "reset-password",
        userId: session.userId,
        expiresAt: getEmailCodeExpiry(),
      },
    });

    await sendVerificationCodeEmail(user.email, code, "password-reset");

    return NextResponse.json({ ok: true, ...devOnlyPayload({ devCode: code }) });
  } catch (err) {
    console.error("[account/reset-password/request]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
