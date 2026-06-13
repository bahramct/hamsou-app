// POST /api/admin/admins/[id]/transfer-ownership — انتقال مالکیت سایت (فقط مالک کنونی)
// عملیات اتمیک: هدف → owner، مالک کنونی → admin
// غیرقابل‌بازگشت بدون اقدام صریح مالک جدید.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, isOwner } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!isOwner(ctx)) {
    return NextResponse.json({ error: "این عملیات فقط برای مالک کنونی سایت مجاز است." }, { status: 403 });
  }

  const { id } = await params;

  if (id === ctx.admin.id) {
    return NextResponse.json({ error: "نمی‌توانی مالکیت را به خودت منتقل کنی." }, { status: 400 });
  }

  const [ownerRole, adminRole, target] = await Promise.all([
    prisma.adminRole.findUnique({ where: { key: "owner" }, select: { id: true } }),
    prisma.adminRole.findUnique({ where: { key: "admin" }, select: { id: true } }),
    prisma.adminUser.findUnique({
      where: { id },
      select: { username: true, displayName: true, isActive: true, role: { select: { key: true } } },
    }),
  ]);

  if (!ownerRole || !adminRole) {
    return NextResponse.json({ error: "نقش‌های سیستمی یافت نشدند." }, { status: 500 });
  }
  if (!target) return NextResponse.json({ error: "ادمین مورد نظر یافت نشد." }, { status: 404 });
  if (!target.isActive) {
    return NextResponse.json({ error: "نمی‌توان مالکیت را به حساب غیرفعال منتقل کرد." }, { status: 400 });
  }

  // تراکنش اتمیک: هر دو تغییر باید با هم انجام شوند
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id }, data: { roleId: ownerRole.id } }),
    prisma.adminUser.update({ where: { id: ctx.admin.id }, data: { roleId: adminRole.id } }),
  ]);

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "admin.ownership.transfer",
    targetType: "admin",
    targetId: id,
    meta: {
      newOwnerUsername: target.username,
      previousOwnerUsername: ctx.admin.username,
    },
  });

  return NextResponse.json({ ok: true });
}
