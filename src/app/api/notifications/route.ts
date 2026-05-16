import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - دریافت لیست نوتیفیکیشن‌ها
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { userId: user.id };

    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // شمارش نوتیفیکیشن‌های خوانده نشده
    const unreadCount = await db.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت نوتیفیکیشن‌ها' },
      { status: 500 }
    );
  }
}

// POST - ایجاد نوتیفیکیشن جدید (internal use)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, actionUrl, actionLabel, metadata } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'نوع، عنوان و پیام الزامی است' },
        { status: 400 }
      );
    }

    const notification = await db.notification.create({
      data: {
        userId: user.id,
        type,
        title,
        message,
        actionUrl,
        actionLabel,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ایجاد نوتیفیکیشن' },
      { status: 500 }
    );
  }
}
