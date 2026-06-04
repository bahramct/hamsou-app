// POST /api/admin/users/[id]/ban  — مسدود/رفع مسدودی کاربر (enforce: users.ban)

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
  if (!can(ctx, "users.ban")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const isBanned: unknown = body?.isBanned;

  if (typeof isBanned !== "boolean") {
    return NextResponse.json({ error: "مقدار isBanned باید boolean باشد." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, isBanned: true } });
  if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });

  if (user.isBanned !== isBanned) {
    await prisma.user.update({ where: { id }, data: { isBanned } });
    await logAdminAction({
      actorId: ctx.admin.id,
      action: isBanned ? "user.ban" : "user.unban",
      targetType: "user",
      targetId: id,
    });
  }

  return NextResponse.json({ ok: true, isBanned });
}
