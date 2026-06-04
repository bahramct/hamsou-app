// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/email/verify — مرحلهٔ ۲ از ثبت‌نامِ ایمیلی (DECISION-058)
//
// body: { email, code }
// - کدِ معتبرِ signup را پیدا و مصرف می‌کند
// - User را با email + passwordHashِ معلق + emailVerifiedAt می‌سازد
// - session JWT صادر و در cookie ذخیره می‌شود (کاربر مستقیماً وارد می‌شود)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { normalizeEmail } from "@/lib/auth/credentials";
import { createSessionToken, SESSION_COOKIE } from "@/lib/utils/session";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: unknown; code?: unknown }
      | null;
    if (!body) {
      return NextResponse.json({ error: "درخواست نامعتبر." }, { status: 400 });
    }

    const email = normalizeEmail(body.email);
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!email || !code) {
      return NextResponse.json({ error: "ایمیل و کد الزامی‌اند." }, { status: 400 });
    }

    const record = await prisma.emailCode.findFirst({
      where: {
        email,
        code,
        purpose: "signup",
        isUsed: false,
        expiresAt: { gt: getNow() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record || !record.passwordHash) {
      return NextResponse.json(
        { error: "کد تأیید نادرست یا منقضی شده است." },
        { status: 401 }
      );
    }

    // اگر در این فاصله کاربری با همین ایمیل ساخته شده (race) → جلوگیری از تکرار
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      await prisma.emailCode.update({ where: { id: record.id }, data: { isUsed: true } });
      return NextResponse.json(
        { error: "این ایمیل قبلاً ثبت شده است. وارد شو." },
        { status: 409 }
      );
    }

    await prisma.emailCode.update({ where: { id: record.id }, data: { isUsed: true } });

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: record.passwordHash,
        emailVerifiedAt: getNow(),
      },
      select: { id: true, phone: true },
    });

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
    console.error("[email/verify]", err);
    return NextResponse.json({ error: "خطای سرور. لطفاً دوباره تلاش کن." }, { status: 500 });
  }
}
