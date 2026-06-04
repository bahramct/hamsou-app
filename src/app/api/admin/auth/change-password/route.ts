// POST /api/admin/auth/change-password — تغییر رمز ادمینِ لاگین‌شده (DECISION-038)
// برای ورود اول (mustChangePassword) و تغییر اختیاری بعدی.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getAdminSession } from "@/lib/admin/auth-server";
import {
  verifyPassword,
  hashPassword,
  validatePasswordComplexity,
} from "@/lib/admin/password";
import { logAdminAction } from "@/lib/admin/audit";

export async function POST(req: NextRequest) {
  const ctx = await getAdminSession();
  if (!ctx) return NextResponse.json({ error: "احراز هویت لازم است." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword: unknown = body?.currentPassword;
  const newPassword: unknown = body?.newPassword;

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "رمز فعلی و رمز جدید الزامی هستند." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: ctx.admin.id },
    select: { id: true, passwordHash: true },
  });
  if (!admin) return NextResponse.json({ error: "حساب یافت نشد." }, { status: 404 });

  if (!verifyPassword(currentPassword, admin.passwordHash)) {
    return NextResponse.json({ error: "رمز فعلی نادرست است." }, { status: 401 });
  }

  const complexity = validatePasswordComplexity(newPassword);
  if (!complexity.ok) {
    return NextResponse.json({ error: complexity.error }, { status: 400 });
  }

  if (verifyPassword(newPassword, admin.passwordHash)) {
    return NextResponse.json(
      { error: "رمز جدید نباید با رمز فعلی یکسان باشد." },
      { status: 400 }
    );
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: hashPassword(newPassword), mustChangePassword: false },
  });

  await logAdminAction({ actorId: admin.id, action: "admin.password.change" });

  return NextResponse.json({ ok: true });
}
