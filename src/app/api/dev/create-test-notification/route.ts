import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

/**
 * DEV ONLY API
 * ایجاد نوتیفیکیشن تستی برای توسعه
 */

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// تأیید توکن
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Environment check - only work in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'This endpoint is only available in development mode',
      },
      { status: 404 }
    );
  }

  // Additional safety check - disable if explicitly disabled
  if (process.env.DISABLE_DEV_TOOLS === 'true') {
    return NextResponse.json(
      {
        error: 'Dev tools are disabled',
      },
      { status: 404 }
    );
  }

  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { type } = body;

    // نمونه نوتیفیکیشن‌ها برای تست
    const testNotifications = [
      {
        type: 'commitment_reminder',
        title: 'یادآوری تعهد روزانه',
        message: 'امروز هنوز تعهدی ثبت نکرده‌اید. تعهد خود را بنویسید!',
        actionUrl: '/',
        actionLabel: 'ثبت تعهد',
      },
      {
        type: 'reflection_reminder',
        title: 'یادآوری بازتاب',
        message: 'امروز بازتاب خود را ثبت کرده‌اید؟',
        actionUrl: '/',
        actionLabel: 'ثبت بازتاب',
      },
      {
        type: 'plan_completed',
        title: '🎉 تبریک!',
        message: 'برنامه "30 روز ورزش مداوم" با موفقیت تکمیل شد!',
        actionUrl: '/my-plans',
        actionLabel: 'مشاهده برنامه',
      },
      {
        type: 'weekly_report',
        title: 'گزارش هفتگی شما آماده است',
        message: 'گزارش هفتگی شما با تحلیل‌های AI آماده مشاهده است',
        actionUrl: '/reports',
        actionLabel: 'مشاهده گزارش',
      },
      {
        type: 'achievement',
        title: '🏆 موفقیت جدید!',
        message: 'شما 5 روز متوالی تعهد خود را انجام دادید!',
      },
      {
        type: 'plan_progress',
        title: 'پیشرفت برنامه',
        message: 'برنامه "یادگیری زبان انگلیسی" 50% پیشرفت دارد',
        actionUrl: '/my-plans',
        actionLabel: 'مشاهده برنامه',
      },
    ];

    // انتخاب نوتیفیکیشن بر اساس type یا random
    let notificationData;
    if (type) {
      notificationData = testNotifications.find((n) => n.type === type);
      if (!notificationData) {
        return NextResponse.json(
          { error: 'نوع نوتیفیکیشن نامعتبر است', availableTypes: testNotifications.map((n) => n.type) },
          { status: 400 }
        );
      }
    } else {
      // Random notification
      notificationData = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    }

    // ایجاد نوتیفیکیشن
    const notification = await db.notification.create({
      data: {
        userId: decoded.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        actionUrl: notificationData.actionUrl,
        actionLabel: notificationData.actionLabel,
      },
    });

    return NextResponse.json({
      success: true,
      notification,
      message: 'نوتیفیکیشن تستی با موفقیت ایجاد شد',
    });
  } catch (error: any) {
    console.error('Error creating test notification:', error);
    return NextResponse.json(
      {
        error: 'خطا در ایجاد نوتیفیکیشن تستی',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - دریافت لیست انواع نوتیفیکیشن‌های تستی
export async function GET(request: NextRequest) {
  // Environment check
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'This endpoint is only available in development mode',
      },
      { status: 404 }
    );
  }

  // Additional safety check - disable if explicitly disabled
  if (process.env.DISABLE_DEV_TOOLS === 'true') {
    return NextResponse.json(
      {
        error: 'Dev tools are disabled',
      },
      { status: 404 }
    );
  }

  try {
    const testNotifications = [
      {
        type: 'commitment_reminder',
        title: 'یادآوری تعهد روزانه',
        description: 'یادآوری برای ثبت تعهد روزانه',
      },
      {
        type: 'reflection_reminder',
        title: 'یادآوری بازتاب',
        description: 'یادآوری برای ثبت بازتاب روزانه',
      },
      {
        type: 'plan_completed',
        title: 'تکمیل برنامه',
        description: 'وقتی یک برنامه به پایان می‌رسد',
      },
      {
        type: 'weekly_report',
        title: 'گزارش هفتگی',
        description: 'وقتی گزارش هفتگی آماده می‌شود',
      },
      {
        type: 'achievement',
        title: 'موفقیت',
        description: 'وقتی کاربر یک موفقیت جدید کسب می‌کند',
      },
      {
        type: 'plan_progress',
        title: 'پیشرفت برنامه',
        description: 'به‌روزرسانی پیشرفت برنامه',
      },
    ];

    return NextResponse.json({
      availableTypes: testNotifications,
    });
  } catch (error: any) {
    console.error('Error getting test notification types:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت انواع نوتیفیکیشن' },
      { status: 500 }
    );
  }
}
