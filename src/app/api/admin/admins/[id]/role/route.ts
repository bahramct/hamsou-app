// POST /api/admin/admins/[id]/role — تغییر نقش ادمین (enforce: admins.manage)
// گاردها: نمی‌توان نقش خود را تغییر داد؛ نمی‌توان آخرین owner فعال را از owner خارج کرد.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "admins.manage")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const roleKey = typeof body?.roleKey === "string" ? body.roleKey.trim() : "";

  if (id === ctx.admin.id) {
    return NextResponse.json({ error: "نمی‌توانی نقش حساب خودت را تغییر دهی." }, { status: 400 });
  }

  // نقش «مالک سایت» قابل تخصیص نیست — هیچ‌کس را نمی‌توان به owner ارتقا داد (نکتهٔ مالک).
  if (roleKey === "owner") {
    return NextResponse.json(
      { error: "نقش «مالک سایت» قابل تخصیص نیست — مالک فقط یک حساب است." },
      { status: 400 }
    );
  }

  const newRole = await prisma.adminRole.findUnique({ where: { key: roleKey }, select: { id: true, key: true } });
  if (!newRole) return NextResponse.json({ error: "نقش نامعتبر است." }, { status: 400 });

  // حساب مالک موجود را نمی‌توان از owner خارج کرد (نقش مالک تغییرناپذیر است).
  const targetForOwnerCheck = await prisma.adminUser.findUnique({
    where: { id }, select: { role: { select: { key: true } } },
  });
  if (targetForOwnerCheck?.role.key === "owner") {
    return NextResponse.json(
      { error: "نقش «مالک سایت» تغییرناپذیر است." },
      { status: 400 }
    );
  }

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, roleId: true, isActive: true, role: { select: { key: true } } },
  });
  if (!target) return NextResponse.json({ error: "ادمین یافت نشد." }, { status: 404 });

  // محافظت: آخرین owner فعال نباید از owner خارج شود
  if (target.role.key === "owner" && newRole.key !== "owner" && target.isActive) {
    const activeOwners = await prisma.adminUser.count({
      where: { isActive: true, role: { key: "owner" } },
    });
    if (activeOwners <= 1) {
      return NextResponse.json(
        { error: "نمی‌توان نقش تنها مالک فعال را تغییر داد." },
        { status: 400 }
      );
    }
  }

  if (target.roleId !== newRole.id) {
    await prisma.adminUser.update({ where: { id }, data: { roleId: newRole.id } });
    await logAdminAction({
      actorId: ctx.admin.id,
      action: "admin.role.change",
      targetType: "admin",
      targetId: id,
      meta: { from: target.role.key, to: newRole.key },
    });
  }

  return NextResponse.json({ ok: true, roleKey: newRole.key });
}
