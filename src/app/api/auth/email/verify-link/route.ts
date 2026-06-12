// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/email/verify-link?token=... — تأییدِ ایمیل از طریق لینک
//
// - توکن ۳۲-بایتی را از query param می‌گیرد
// - EmailCode.signup را پیدا، مصرف، و کاربر می‌سازد
// - session صادر می‌کند (کاربر مستقیماً وارد می‌شود)
// - هر خطا → JSON (صفحهٔ /verify-email خطا را نمایش می‌دهد)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { createSessionToken, SESSION_COOKIE } from "@/lib/utils/session";
import { getNow } from "@/lib/dev/time";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")?.trim() ?? "";
    if (!token || token.length !== 64) {
      return NextResponse.json({ error: "لینک تأیید نادرست است." }, { status: 400 });
    }

    const now = getNow();
    const record = await prisma.emailCode.findFirst({
      where: {
        code: token,
        purpose: "signup",
        isUsed: false,
        expiresAt: { gt: now },
      },
    });

    if (!record || !record.email) {
      return NextResponse.json(
        { error: "لینک تأیید نادرست یا منقضی شده است." },
        { status: 401 }
      );
    }

    // race condition: ایمیل در این فاصله ثبت شده؟
    const existing = await prisma.user.findUnique({
      where: { email: record.email },
      select: { id: true },
    });
    if (existing) {
      await prisma.emailCode.update({ where: { id: record.id }, data: { isUsed: true } });
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است. وارد شو." },
        { status: 409 }
      );
    }

    await prisma.emailCode.update({ where: { id: record.id }, data: { isUsed: true } });

    const user = await prisma.user.create({
      data: {
        email: record.email,
        // رمز عبور در مودال پروفایل تنظیم می‌شود (DECISION-080)
        passwordHash: record.passwordHash ?? null,
        emailVerifiedAt: now,
      },
      select: { id: true, phone: true },
    });

    const sessionToken = await createSessionToken({ userId: user.id, phone: user.phone });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[email/verify-link]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
