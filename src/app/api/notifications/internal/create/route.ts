import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Internal API برای ایجاد نوتیفیکیشن بدون نیاز به توکن کاربر
 * این endpoint فقط از سمت سرور و در codebase داخلی استفاده می‌شود
 * برای جلوگیری از سوءاستفاده، یک internal secret چک می‌شود
 */

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'hamsou-internal-secret';

// POST - ایجاد نوتیفیکیشن (internal use only)
export async function POST(request: NextRequest) {
  try {
    // چک کردن internal secret
    const authHeader = request.headers.get('x-internal-secret');
    if (authHeader !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, message, actionUrl, actionLabel, metadata } = body;

    // اعتبارسنجی
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'userId, type, title و message الزامی هستند' },
        { status: 400 }
      );
    }

    // ایجاد نوتیفیکیشن
    const notification = await db.notification.create({
      data: {
        userId,
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
    console.error('Error creating notification (internal):', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ایجاد نوتیفیکیشن' },
      { status: 500 }
    );
  }
}
