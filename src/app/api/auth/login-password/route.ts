// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login-password — ورود با (ایمیل یا نام‌کاربری) + پسورد (DECISION-058)
//
// body: { identifier, password }
// - identifier هم ایمیل و هم نام‌کاربری را می‌پذیرد
// - پسورد با scrypt تأیید می‌شود (timing-safe)
// - پیامِ خطا عمداً عمومی است تا enumeration ممکن نباشد
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { normalizeEmail, normalizeUsername } from "@/lib/auth/credentials";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/utils/session";

const GENERIC_ERROR = "نام کاربری/ایمیل یا رمز عبور نادرست است.";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { identifier?: unknown; password?: unknown }
      | null;
    if (!body || typeof body.identifier !== "string" || typeof body.password !== "string") {
      return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
    }

    const identifier = body.identifier.trim();
    const password = body.password;
    if (!identifier || !password) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // یا ایمیل است یا نام‌کاربری — هر دو حالت را امتحان می‌کنیم
    const email = normalizeEmail(identifier);
    const username = normalizeUsername(identifier);

    const user = await prisma.user.findFirst({
      where: email
        ? { email }
        : username
          ? { username }
          : { id: "__never__" }, // ورودیِ بی‌اعتبار → هیچ تطبیقی
      select: { id: true, phone: true, passwordHash: true, isBanned: true },
    });

    // پاسخِ یکسان برای «کاربر نیست»، «پسورد ندارد» و «پسورد غلط» (ضدِ enumeration)
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: "دسترسی این حساب محدود شده است." },
        { status: 403 }
      );
    }

    const token = await createSessionToken({ userId: user.id, phone: user.phone });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // ۳۰ روز
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[login-password]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
