import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// PATCH - علامت‌گذاری یک نوتیفیکیشن به عنوان خوانده شده
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { read } = body;

    // بررسی وجود نوتیفیکیشن
    const existingNotification = await db.notification.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingNotification) {
      return NextResponse.json({ error: 'نوتیفیکیشن یافت نشد' }, { status: 404 });
    }

    // آپدیت نوتیفیکیشن
    const updateData: any = { read };

    if (read === true) {
      updateData.readAt = new Date();
    }

    const notification = await db.notification.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در به‌روزرسانی نوتیفیکیشن' },
      { status: 500 }
    );
  }
}

// DELETE - حذف نوتیفیکیشن
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // بررسی وجود نوتیفیکیشن
    const existingNotification = await db.notification.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });

    if (!existingNotification) {
      return NextResponse.json({ error: 'نوتیفیکیشن یافت نشد' }, { status: 404 });
    }

    // حذف نوتیفیکیشن
    await db.notification.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'نوتیفیکیشن با موفقیت حذف شد' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در حذف نوتیفیکیشن' },
      { status: 500 }
    );
  }
}
