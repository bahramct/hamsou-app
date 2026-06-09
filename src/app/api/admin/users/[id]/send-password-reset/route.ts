// POST /api/admin/users/[id]/send-password-reset — ارسال لینک بازیابی رمز (enforce: users.write)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requirePermission } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { sendPasswordResetEmail } from "@/lib/email/send";
import { generateEmailToken, getResetLinkExpiry } from "@/lib/auth/credentials";
import { getAppBaseUrl } from "@/lib/utils/app-url";
import { getNow } from "@/lib/dev/time";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requirePermission("users.write");
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  if (!user.email) {
    return NextResponse.json({ error: "این کاربر ایمیل ثبت‌شده ندارد." }, { status: 400 });
  }
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "این کاربر با OTP ثبت‌نام کرده و رمز عبور ندارد." },
      { status: 400 }
    );
  }

  const token = generateEmailToken();
  const link = `${getAppBaseUrl()}/reset-password?token=${token}`;

  // توکن قبلی را باطل کن، توکن جدید بساز
  await prisma.emailCode.updateMany({
    where: {
      email: user.email,
      purpose: "reset-password",
      isUsed: false,
    },
    data: { isUsed: true },
  });
  await prisma.emailCode.create({
    data: {
      email: user.email,
      code: token,
      purpose: "reset-password",
      expiresAt: getResetLinkExpiry(),
    },
  });

  await sendPasswordResetEmail(user.email, link);

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "user.send.password_reset",
    targetType: "user",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
