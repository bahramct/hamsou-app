// ─────────────────────────────────────────────────────────────────────────────
// POST /api/account/reset-password/verify — تأیید کد + تنظیم رمز جدید
//
// body: { code, newPassword }
// کد باید purpose="reset-password" و متعلق به همین کاربر باشد.
// پس از تأیید، رمز عبور update می‌شود.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { hashPassword, validateUserPassword } from "@/lib/auth/password";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = (await req.json().catch(() => null)) as
      | { code?: unknown; newPassword?: unknown }
      | null;

    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!code) {
      return NextResponse.json({ error: "کد تأیید الزامی است." }, { status: 400 });
    }

    const pwCheck = validateUserPassword(body?.newPassword);
    if (!pwCheck.ok) {
      return NextResponse.json({ error: pwCheck.error }, { status: 422 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, emailVerifiedAt: true },
    });
    if (!user?.email || !user.emailVerifiedAt) {
      return NextResponse.json({ error: "ایمیل تأیید‌شده‌ای یافت نشد." }, { status: 400 });
    }

    const record = await prisma.emailCode.findFirst({
      where: {
        email: user.email,
        code,
        purpose: "reset-password",
        userId: session.userId,
        isUsed: false,
        expiresAt: { gt: getNow() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!record) {
      return NextResponse.json(
        { error: "کد تأیید نادرست یا منقضی شده است." },
        { status: 401 }
      );
    }

    await prisma.emailCode.update({ where: { id: record.id }, data: { isUsed: true } });
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: hashPassword(body!.newPassword as string) },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/reset-password/verify]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
