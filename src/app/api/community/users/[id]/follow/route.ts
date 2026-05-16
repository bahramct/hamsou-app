import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, getFreshDb } from '@/lib/db';

// POST /api/community/users/[id]/follow - فالو کردن کاربر
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyToken(request);

    if (id === user.userId) {
      return NextResponse.json(
        { success: false, error: 'نمی‌توانید خود را فالو کنید' },
        { status: 400 }
      );
    }

    // بررسی وجود کاربر
    const targetUser = await db.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی تکراری نبودن
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { success: false, error: 'شما قبلاً این کاربر را فالو کرده‌اید' },
        { status: 400 }
      );
    }

    // ایجاد رابطه فالووینگ
    const freshDb = getFreshDb();
    await freshDb.follow.create({
      data: {
        followerId: user.userId,
        followingId: id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'با موفقیت فالو شد',
    });
  } catch (error: any) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در فالو کردن کاربر' },
      { status: 500 }
    );
  }
}

// DELETE /api/community/users/[id]/follow - آنفالو کردن کاربر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyToken(request);

    // بررسی وجود رابطه فالووینگ
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: id,
        },
      },
    });

    if (!existingFollow) {
      return NextResponse.json(
        { success: false, error: 'شما این کاربر را فالو نکرده‌اید' },
        { status: 400 }
      );
    }

    // حذف رابطه فالووینگ
    const freshDb = getFreshDb();
    await freshDb.follow.delete({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'با موفقیت آنفالو شد',
    });
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در آنفالو کردن کاربر' },
      { status: 500 }
    );
  }
}
