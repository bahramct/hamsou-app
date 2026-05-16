import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, getFreshDb } from '@/lib/db';

// DELETE /api/community/comments/[id] - حذف کامنت
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const commentId = params.id;

    // بررسی وجود کامنت و مالکیت
    const comment = await db.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'کامنت یافت نشد' },
        { status: 404 }
      );
    }

    // فقط کاربر می‌تونه کامنت خودش رو حذف کنه
    if (comment.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'اجازه حذف این کامنت را ندارید' },
        { status: 403 }
      );
    }

    // حذف تمام پاسخ‌های این کامنت
    await db.comment.deleteMany({
      where: { parentId: commentId },
    });

    // حذف کامنت
    await db.comment.delete({
      where: { id: commentId },
    });

    // بروزرسانی تعداد کامنت‌های پست (اگر کامنت اصلی است)
    if (!comment.parentId) {
      const freshDb = getFreshDb();
      await freshDb.post.update({
        where: { id: comment.postId },
        data: {
          commentsCount: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'کامنت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف کامنت' },
      { status: 500 }
    );
  }
}
