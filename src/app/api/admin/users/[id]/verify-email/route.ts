// POST /api/admin/users/[id]/verify-email — تأیید دستی ایمیل کاربر (enforce: users.write)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requirePermission } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { getNow } from "@/lib/dev/time";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requirePermission("users.write");
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  if (!user.email) {
    return NextResponse.json({ error: "این کاربر ایمیل ثبت‌شده ندارد." }, { status: 400 });
  }
  if (user.emailVerifiedAt) {
    return NextResponse.json({ error: "ایمیل این کاربر قبلاً تأیید شده است." }, { status: 409 });
  }

  await prisma.user.update({
    where: { id },
    data: { emailVerifiedAt: getNow() },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "user.email.verify",
    targetType: "user",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
