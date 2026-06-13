// PATCH /api/admin/admins/[id] — ویرایش پروفایل ادمین (فقط مالک)
// DELETE /api/admin/admins/[id] — حذف ادمین (فقط مالک)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, isOwner } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

// ─── PATCH: ویرایش پروفایل ───────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!isOwner(ctx)) {
    return NextResponse.json({ error: "این عملیات فقط برای مالک سایت مجاز است." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, username: true, displayName: true, role: { select: { key: true } } },
  });
  if (!target) return NextResponse.json({ error: "ادمین یافت نشد." }, { status: 404 });

  const updates: Record<string, unknown> = {};

  if (typeof body?.displayName === "string") {
    const displayName = body.displayName.trim();
    if (!displayName) return NextResponse.json({ error: "نام نمایشی نمی‌تواند خالی باشد." }, { status: 400 });
    updates.displayName = displayName;
  }

  if (typeof body?.username === "string") {
    const username = body.username.trim();
    if (!USERNAME_RE.test(username)) {
      return NextResponse.json(
        { error: "نام کاربری باید ۳ تا ۳۲ کاراکتر و فقط شامل حروف لاتین، عدد، نقطه، خط تیره و زیرخط باشد." },
        { status: 400 }
      );
    }
    if (username !== target.username) {
      const conflict = await prisma.adminUser.findUnique({ where: { username }, select: { id: true } });
      if (conflict) return NextResponse.json({ error: "این نام کاربری قبلاً استفاده شده." }, { status: 409 });
      updates.username = username;
    }
  }

  if (typeof body?.phone === "string") {
    updates.phone = body.phone.trim() || null;
  }

  if (typeof body?.avatarImage === "string" || body?.avatarImage === null) {
    updates.avatarImage = body.avatarImage || null;
  }

  if (typeof body?.mustChangePassword === "boolean") {
    updates.mustChangePassword = body.mustChangePassword;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.adminUser.update({ where: { id }, data: updates });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "admin.profile.update",
    targetType: "admin",
    targetId: id,
    meta: { fields: Object.keys(updates), targetUsername: target.username },
  });

  return NextResponse.json({ ok: true });
}

// ─── DELETE: حذف ادمین ────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!isOwner(ctx)) {
    return NextResponse.json({ error: "این عملیات فقط برای مالک سایت مجاز است." }, { status: 403 });
  }

  const { id } = await params;

  if (id === ctx.admin.id) {
    return NextResponse.json({ error: "نمی‌توانی حساب خودت را حذف کنی." }, { status: 400 });
  }

  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { username: true, role: { select: { key: true } } },
  });
  if (!target) return NextResponse.json({ error: "ادمین یافت نشد." }, { status: 404 });

  if (target.role.key === "owner") {
    return NextResponse.json({ error: "حساب مالک سایت قابل حذف نیست." }, { status: 400 });
  }

  await prisma.adminUser.delete({ where: { id } });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "admin.delete",
    targetType: "admin",
    targetId: id,
    meta: { deletedUsername: target.username },
  });

  return NextResponse.json({ ok: true });
}
