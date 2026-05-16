import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// تأیید توکن
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

// دریافت تنظیمات کاربر
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    // دریافت کاربر با تنظیمات
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        notificationTime: true,
        notificationEnabled: true,
        subscriptionPlan: true,
        settings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // اگر تنظیمات وجود ندارد، ایجاد می‌کنیم
    if (!user.settings) {
      const settings = await db.userSettings.create({
        data: {
          userId: user.id,
          theme: 'light',
          language: 'fa',
          timeZone: 'Asia/Tehran',
        },
      });

      return NextResponse.json({
        ...user,
        settings,
      });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    );
  }
}

// به‌روزرسانی تنظیمات کاربر
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const body = await request.json();
    const { name, notificationTime, notificationEnabled } = body;

    // به‌روزرسانی کاربر
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(notificationTime !== undefined && { notificationTime }),
        ...(notificationEnabled !== undefined && { notificationEnabled }),
      },
      select: {
        id: true,
        phone: true,
        name: true,
        notificationTime: true,
        notificationEnabled: true,
        subscriptionPlan: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی تنظیمات' },
      { status: 500 }
    );
  }
}
