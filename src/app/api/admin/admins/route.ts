// POST /api/admin/admins — ساخت ادمین جدید (enforce: admins.manage) — DECISION-038
// رمز پیچیده auto-generate می‌شود، mustChangePassword=true، و رمز فقط یک‌بار در پاسخ برمی‌گردد.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession, can } from "@/lib/admin/auth-server";
import { logAdminAction } from "@/lib/admin/audit";
import { generatePassword, hashPassword } from "@/lib/admin/password";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });
  if (!can(ctx, "admins.manage")) {
    return NextResponse.json({ error: "دسترسی لازم را نداری." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
  const roleKey = typeof body?.roleKey === "string" ? body.roleKey.trim() : "";
  const phone = typeof body?.phone === "string" && body.phone.trim() ? body.phone.trim() : null;

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "نام کاربری باید ۳ تا ۳۲ کاراکتر و فقط شامل حروف لاتین، عدد، نقطه، خط تیره و زیرخط باشد." },
      { status: 400 }
    );
  }
  if (!displayName) {
    return NextResponse.json({ error: "نام نمایشی الزامی است." }, { status: 400 });
  }

  // نقش «مالک سایت» یکتا و غیرقابل‌انتساب است — فقط حساب seedشده آن را دارد (نکتهٔ مالک).
  if (roleKey === "owner") {
    return NextResponse.json(
      { error: "نقش «مالک سایت» قابل تخصیص نیست — مالک فقط یک حساب است." },
      { status: 400 }
    );
  }

  const role = await prisma.adminRole.findUnique({ where: { key: roleKey }, select: { id: true } });
  if (!role) return NextResponse.json({ error: "نقش نامعتبر است." }, { status: 400 });

  const exists = await prisma.adminUser.findUnique({ where: { username }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "این نام کاربری قبلاً استفاده شده." }, { status: 409 });

  const password = generatePassword();
  const created = await prisma.adminUser.create({
    data: {
      username,
      displayName,
      phone,
      passwordHash: hashPassword(password),
      mustChangePassword: true,
      roleId: role.id,
      isActive: true,
    },
    select: { id: true, username: true },
  });

  await logAdminAction({
    actorId: ctx.admin.id,
    action: "admin.create",
    targetType: "admin",
    targetId: created.id,
    meta: { username, roleKey },
  });

  // رمز فقط همین‌جا و یک‌بار برمی‌گردد — در DB فقط hash است.
  return NextResponse.json({ ok: true, username: created.username, password });
}
