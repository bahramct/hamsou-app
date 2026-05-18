import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - علامت‌گذاری تمام نوتیفیکیشن‌ها به عنوان خوانده شده
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.notification.updateMany({
      where: {
        userId: user.userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} نوتیفیکیشن به عنوان خوانده شده علامت‌گذاری شد`,
    });
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در علامت‌گذاری نوتیفیکیشن‌ها' },
      { status: 500 }
    );
  }
}
