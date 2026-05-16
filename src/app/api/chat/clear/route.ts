import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// پاک کردن تاریخچه چت
export async function POST(req: NextRequest) {
  try {
    const { userId, chatType = 'general' } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربری الزامی است' },
        { status: 400 }
      );
    }

    // حذف پیام‌های چت
    await db.chatMessage.deleteMany({
      where: {
        userId,
        chatType,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تاریخچه چت با موفقیت پاک شد',
    });
  } catch (error) {
    console.error('Error in chat clear API:', error);
    return NextResponse.json(
      { error: 'خطا در پاک کردن تاریخچه چت' },
      { status: 500 }
    );
  }
}
