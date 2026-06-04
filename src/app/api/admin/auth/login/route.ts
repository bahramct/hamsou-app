// POST /api/admin/auth/login — ورود ادمین با نام کاربری و رمز (DECISION-038)
// محافظت brute-force: ۵ تلاش ناموفق → قفل ۱۵ دقیقه‌ای.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { getNow } from "@/lib/dev/time";
import { verifyPassword } from "@/lib/admin/password";
import { createAdminSessionToken, ADMIN_SESSION_COOKIE } from "@/lib/admin/session";
import { logAdminAction } from "@/lib/admin/audit";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// پیام یکسان برای همه خطاها — بدون افشای اینکه نام کاربری وجود دارد یا نه
const GENERIC_ERROR = "نام کاربری یا رمز عبور نادرست است.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const username: unknown = body?.username;
    const password: unknown = body?.password;

    if (typeof username !== "string" || typeof password !== "string" || !username.trim()) {
      return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی هستند." }, { status: 400 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { username: username.trim() },
      include: { role: { select: { key: true } } },
    });

    // کاربر ناموجود یا غیرفعال → پاسخ یکسان (بدون enumeration)
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    const now = getNow();

    // بررسی قفل
    if (admin.lockedUntil && admin.lockedUntil > now) {
      const mins = Math.ceil((admin.lockedUntil.getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        { error: `حساب موقتاً قفل شده. ${mins} دقیقه دیگر تلاش کن.` },
        { status: 429 }
      );
    }

    const valid = verifyPassword(password, admin.passwordHash);

    if (!valid) {
      const attempts = admin.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_ATTEMPTS;
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock ? new Date(now.getTime() + LOCK_MINUTES * 60000) : null,
        },
      });
      if (shouldLock) {
        await logAdminAction({
          actorId: admin.id,
          action: "admin.login.locked",
          meta: { lockMinutes: LOCK_MINUTES },
        });
        return NextResponse.json(
          { error: `به‌دلیل تلاش‌های ناموفق، حساب ${LOCK_MINUTES} دقیقه قفل شد.` },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // موفق: ریست شمارنده + ثبت ورود + session
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: now },
    });

    const token = await createAdminSessionToken({ adminId: admin.id, roleKey: admin.role.key });
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    await logAdminAction({ actorId: admin.id, action: "admin.login" });

    return NextResponse.json({ ok: true, mustChangePassword: admin.mustChangePassword });
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
