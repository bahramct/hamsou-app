// POST /api/admin/admins/[id]/active — فعال/غیرفعال کردن ادمین (enforce: admins.manage)
// گاردها: نمی‌توان خود را غیرفعال کرد؛ نمی‌توان آخرین owner فعال را غیرفعال کرد.

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
  const isActive: unknown = body?.isActive;
  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "مقدار isActive باید boolean باشد." }, { status: 400 });
  }

  if (id === ctx.admin.id) {
    return NextResponse.json({ error: "نمی‌توانی وضعیت حساب خودت را تغییر دهی." }, { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, isActive: true, role: { select: { key: true } } },
  });
  if (!target) return NextResponse.json({ error: "ادمین یافت نشد." }, { status: 404 });

  // محافظت: آخرین owner فعال نباید غیرفعال شود
  if (!isActive && target.role.key === "owner") {
    const activeOwners = await prisma.adminUser.count({
      where: { isActive: true, role: { key: "owner" } },
    });
    if (activeOwners <= 1) {
      return NextResponse.json(
        { error: "نمی‌توان تنها مالک فعال را غیرفعال کرد." },
        { status: 400 }
      );
    }
  }

  if (target.isActive !== isActive) {
    await prisma.adminUser.update({ where: { id }, data: { isActive } });
    await logAdminAction({
      actorId: ctx.admin.id,
      action: isActive ? "admin.activate" : "admin.deactivate",
      targetType: "admin",
      targetId: id,
    });
  }

  return NextResponse.json({ ok: true, isActive });
}
