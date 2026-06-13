// POST /api/admin/admins/[id]/reset-password — بازنشانی رمز ادمین (فقط مالک)
// رمز جدید auto-generate شده، یک‌بار نمایش داده می‌شود و در DB فقط hash ذخیره است.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, isOwner } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { generatePassword, hashPassword } from "@/lib/admin/password";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!isOwner(ctx)) {
    return NextResponse.json({ error: "این عملیات فقط برای مالک سایت مجاز است." }, { status: 403 });
  }

  const { id } = await params;

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { username: true, role: { select: { key: true } } },
  });
  if (!target) return NextResponse.json({ error: "ادمین یافت نشد." }, { status: 404 });

  const newPassword = generatePassword();
  await prisma.adminUser.update({
    where: { id },
    data: {
      passwordHash: hashPassword(newPassword),
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "admin.password.reset",
    targetType: "admin",
    targetId: id,
    meta: { targetUsername: target.username },
  });

  // رمز فقط همین یک‌بار برمی‌گردد — در DB فقط hash است.
  return NextResponse.json({ ok: true, username: target.username, password: newPassword });
}
