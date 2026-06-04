// POST /api/auth/request-otp
// دریافت شماره موبایل، تولید OTP، ذخیره در DB، ارسال از طریق SMSAdapter

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSMSAdapter } from "@/lib/adapters";
import { generateOtpCode, normalizeIranPhone, getOtpExpiry } from "@/lib/utils/otp";
import { devOnlyPayload } from "@/lib/utils/dev-response";
import { getNow } from "@/lib/dev/time";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone: unknown = body?.phone;

    if (typeof rawPhone !== "string" || !rawPhone.trim()) {
      return NextResponse.json(
        { error: "شماره موبایل الزامی است." },
        { status: 400 }
      );
    }

    const phone = normalizeIranPhone(rawPhone);
    if (!phone) {
      return NextResponse.json(
        { error: "شماره موبایل معتبر نیست. فرمت صحیح: ۰۹XXXXXXXXX" },
        { status: 400 }
      );
    }

    // بررسی rate limit ساده: اگر OTP معتبر فعالی وجود دارد، دوباره ارسال نمی‌کنیم
    const existingOtp = await prisma.otpCode.findFirst({
      where: {
        phone,
        isUsed: false,
        expiresAt: { gt: getNow() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingOtp) {
      // برای جلوگیری از enumeration، همان پاسخ موفق را برمی‌گردانیم.
      // در dev، کد فعلی را به UI برمی‌گردانیم تا کاربر بتواند ادامه دهد.
      return NextResponse.json({
        ok: true,
        ...devOnlyPayload({ devCode: existingOtp.code }),
      });
    }

    // تولید و ذخیره OTP جدید
    const code = generateOtpCode();
    await prisma.otpCode.create({
      data: {
        phone,
        code,
        expiresAt: getOtpExpiry(),
      },
    });

    // ارسال OTP از طریق SMSAdapter
    const sms = getSMSAdapter();
    await sms.sendOTP(phone, code);

    // در dev، کد را در پاسخ نیز برمی‌گردانیم تا UI آن را نمایش دهد.
    // در prod، devOnlyPayload خروجی `{}` می‌دهد و هیچ کلیدی نشت نمی‌کند.
    return NextResponse.json({
      ok: true,
      ...devOnlyPayload({ devCode: code }),
    });
  } catch (err) {
    console.error("[request-otp]", err);
    return NextResponse.json(
      { error: "خطای سرور. لطفاً دوباره تلاش کن." },
      { status: 500 }
    );
  }
}
