import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

// JWT Secret (در production باید از environment variable استفاده شود)
const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    // اعتبارسنجی
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'شماره موبایل و کد الزامی است' },
        { status: 400 }
      );
    }

    // دریافت کد ذخیره شده
    if (typeof (global as any).otpStore === 'undefined') {
      return NextResponse.json(
        { error: 'کد منقضی شده است. لطفاً دوباره تلاش کنید' },
        { status: 400 }
      );
    }

    const otpData = (global as any).otpStore.get(phone);

    if (!otpData) {
      return NextResponse.json(
        { error: 'کد منقضی شده است. لطفاً دوباره تلاش کنید' },
        { status: 400 }
      );
    }

    // چک کردن انقضا
    const now = new Date();
    const expiresAt = new Date(otpData.expiresAt);

    if (now > expiresAt) {
      (global as any).otpStore.delete(phone);
      return NextResponse.json(
        { error: 'کد منقضی شده است. لطفاً دوباره تلاش کنید' },
        { status: 400 }
      );
    }

    // تأیید کد
    if (otpData.code !== code) {
      return NextResponse.json(
        { error: 'کد نامعتبر است' },
        { status: 400 }
      );
    }

    // حذف کد استفاده شده
    (global as any).otpStore.delete(phone);

    // دریافت کاربر
    const user = await db.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        name: true,
        subscriptionPlan: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // ساخت JWT Token
    const token = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return NextResponse.json({
      success: true,
      token,
      user,
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'خطا در تأیید کد' },
      { status: 500 }
    );
  }
}
