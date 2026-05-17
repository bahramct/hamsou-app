import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// تولید کد OTP تصادفی 4 رقمی
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// در محیط توسعه، همیشه 1234 برمی‌گرداند
function getDevOTP(): string {
  return '1234';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // اعتبارسنجی شماره موبایل
    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'شماره موبایل نامعتبر است. شماره باید با 09 شروع شود و 11 رقم باشد.' },
        { status: 400 }
      );
    }

    // در محیط توسعه، کد تست را برمی‌گردانیم
    const isDev = process.env.NODE_ENV === 'development';
    const otpCode = isDev ? getDevOTP() : generateOTP();

    // در نسخه MVP، فقط کد را ذخیره می‌کنیم (بدون ارسال SMS)
    // در نسخه production، باید سرویس SMS را اضافه کنیم
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 دقیقه اعتبار

    // چک می‌کنیم آیا کاربر وجود دارد یا نه
    let user = await db.user.findUnique({
      where: { phone },
    });

    // اگر کاربر وجود ندارد، ایجاد می‌کنیم
    if (!user) {
      user = await db.user.create({
        data: {
          phone,
          // تنظیمات پیش‌فرض
          notificationTime: '09:00',
          notificationEnabled: true,
          subscriptionPlan: 'free',
          subscriptionStart: now,
        },
      });
    }

    // ذخیره کد OTP (در نسخه production باید در یک جدول جداگانه ذخیره شود)
    // فعلاً از یک روش ساده استفاده می‌کنیم
    // در production باید از Redis یا جدول OTP استفاده شود
    const otpData = {
      code: otpCode,
      phone,
      expiresAt: expiresAt.toISOString(),
    };

    // ذخیره در localStorage سمت سرور (برای MVP)
    // در production باید از Redis استفاده شود
    if (typeof global.otpStore === 'undefined') {
      (global as any).otpStore = new Map();
    }
    (global as any).otpStore.set(phone, otpData);

    // در محیط توسعه، کد را در پاسخ برمی‌گردانیم
    const response: any = {
      success: true,
      message: 'کد تأیید ارسال شد',
    };

    if (isDev) {
      response.devCode = otpCode;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال کد تأیید' },
      { status: 500 }
    );
  }
}
