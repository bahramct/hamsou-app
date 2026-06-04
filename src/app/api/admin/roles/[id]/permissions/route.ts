// POST /api/admin/roles/[id]/permissions — تنظیم دسترسی‌های یک نقش (enforce: roles.manage)
// گارد: نقش owner قابل ویرایش نیست (همیشه همهٔ دسترسی‌ها را دارد تا قفل نشویم).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { ALL_PERMISSION_KEYS } from "@/lib/admin/permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "roles.manage")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const keys: unknown = body?.keys;

  if (!Array.isArray(keys) || keys.some((k) => typeof k !== "string")) {
    return NextResponse.json({ error: "فهرست دسترسی‌ها نامعتبر است." }, { status: 400 });
  }

  const role = await prisma.adminRole.findUnique({ where: { id }, select: { id: true, key: true } });
  if (!role) return NextResponse.json({ error: "نقش یافت نشد." }, { status: 404 });

  if (role.key === "owner") {
    return NextResponse.json(
      { error: "دسترسی‌های نقش «مالک سایت» قابل تغییر نیست (همیشه کامل است)." },
      { status: 400 }
    );
  }

  // فقط کلیدهای معتبر از کاتالوگ پذیرفته می‌شوند
  const validKeys = (keys as string[]).filter((k) =>
    (ALL_PERMISSION_KEYS as string[]).includes(k)
  );

  const perms = await prisma.adminPermission.findMany({
    where: { key: { in: validKeys } },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.adminRolePermission.deleteMany({ where: { roleId: id } }),
    prisma.adminRolePermission.createMany({
      data: perms.map((p) => ({ roleId: id, permissionId: p.id })),
    }),
  ]);

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "role.permissions.set",
    targetType: "role",
    targetId: id,
    meta: { count: perms.length },
  });

  return NextResponse.json({ ok: true, count: perms.length });
}
