// POST /api/admin/roles/[id]/delete — حذف نقش (enforce: roles.manage)
// گاردها: نقش‌های پایه (isSystem) حذف نمی‌شوند؛ نقشی که ادمینی به آن وصل است حذف نمی‌شود.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "roles.manage")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const role = await prisma.adminRole.findUnique({
    where: { id },
    select: { id: true, key: true, isSystem: true, _count: { select: { admins: true } } },
  });
  if (!role) return NextResponse.json({ error: "نقش یافت نشد." }, { status: 404 });

  if (role.isSystem) {
    return NextResponse.json({ error: "نقش‌های پایه قابل حذف نیستند." }, { status: 400 });
  }
  if (role._count.admins > 0) {
    return NextResponse.json(
      { error: "ابتدا ادمین‌های این نقش را به نقش دیگری منتقل کن." },
      { status: 400 }
    );
  }

  await prisma.adminRole.delete({ where: { id } });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "role.delete",
    targetType: "role",
    targetId: id,
    meta: { key: role.key },
  });

  return NextResponse.json({ ok: true });
}
