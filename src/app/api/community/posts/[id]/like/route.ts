import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, getFreshDb } from '@/lib/db';

// POST /api/community/posts/[id]/like - لایک کردن پست
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const postId = params.id;

    // بررسی وجود پست
    const freshDb = getFreshDb();
    const post = await freshDb.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'پست یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی آیا کاربر قبلاً لایک کرده است
    const existingLike = await db.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: 'قبلاً لایک کرده‌اید' },
        { status: 400 }
      );
    }

    // ایجاد لایک
    await db.like.create({
      data: {
        userId: user.id,
        postId: postId,
      },
    });

    // بروزرسانی تعداد لایک‌ها
    const freshDb = getFreshDb();
    await freshDb.post.update({
      where: { id: postId },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'لایک ثبت شد',
    });
  } catch (error: any) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ثبت لایک' },
      { status: 500 }
    );
  }
}

// DELETE /api/community/posts/[id]/like - حذف لایک
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const postId = params.id;

    // حذف لایک
    const deletedLike = await db.like.deleteMany({
      where: {
        userId: user.id,
        postId: postId,
      },
    });

    if (deletedLike.count === 0) {
      return NextResponse.json(
        { success: false, error: 'لایک یافت نشد' },
        { status: 404 }
      );
    }

    // بروزرسانی تعداد لایک‌ها
    const freshDb = getFreshDb();
    await freshDb.post.update({
      where: { id: postId },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'لایک حذف شد',
    });
  } catch (error: any) {
    console.error('Error unliking post:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف لایک' },
      { status: 500 }
    );
  }
}
