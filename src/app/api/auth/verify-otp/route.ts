// POST /api/auth/verify-otp
// بررسی کد OTP، ساخت/پیدا کردن User، صدور JWT در cookie

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";
import { normalizeIranPhone } from "@/lib/utils/otp";
import { createSessionToken, SESSION_COOKIE } from "@/lib/utils/session";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone: unknown = body?.phone;
    const code: unknown = body?.code;

    if (typeof rawPhone !== "string" || typeof code !== "string") {
      return NextResponse.json(
        { error: "شماره موبایل و کد تأیید الزامی هستند." },
        { status: 400 }
      );
    }

    const phone = normalizeIranPhone(rawPhone);
    if (!phone) {
      return NextResponse.json(
        { error: "شماره موبایل معتبر نیست." },
        { status: 400 }
      );
    }

    // یافتن OTP معتبر
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phone,
        code: code.trim(),
        isUsed: false,
        expiresAt: { gt: getNow() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "کد تأیید نادرست یا منقضی شده است." },
        { status: 401 }
      );
    }

    // علامت‌گذاری OTP به عنوان مصرف‌شده
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // ساخت یا پیدا کردن کاربر
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    // ساخت JWT و ذخیره در cookie
    const token = await createSessionToken({ userId: user.id, phone: user.phone });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // ۳۰ روز
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[verify-otp]", err);
    return NextResponse.json(
      { error: "خطای سرور. لطفاً دوباره تلاش کن." },
      { status: 500 }
    );
  }
}
