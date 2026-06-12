// ─────────────────────────────────────────────────────────────────────────────
// POST /api/account/set-password — تعیین رمز عبور برای کاربران ایمیلی بدون رمز (DECISION-080)
// فقط کاربران با ایمیلِ تأییدشده که هنوز passwordHash ندارند می‌توانند از این route استفاده کنند.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSessionUser } from "@/lib/utils/auth-server";
import { hashPassword, validateUserPassword } from "@/lib/auth/password";

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, emailVerifiedAt: true, passwordHash: true },
  });
  if (!user || !user.email || !user.emailVerifiedAt) {
    return NextResponse.json({ error: "این عملیات فقط برای کاربران ایمیلی مجاز است." }, { status: 403 });
  }
  if (user.passwordHash) {
    return NextResponse.json({ error: "رمز عبور قبلاً تنظیم شده است." }, { status: 409 });
  }

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const pwCheck = validateUserPassword(b?.newPassword);
  if (!pwCheck.ok) {
    return NextResponse.json({ error: pwCheck.error }, { status: 400 });
  }
  const newPassword = b!.newPassword as string;

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  });

  return NextResponse.json({ ok: true });
}
