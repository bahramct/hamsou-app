import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, getFreshDb } from '@/lib/db';

// DELETE /api/community/posts/[id] - حذف پست
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    const { id: postId } = await params;

    // بررسی وجود پست و مالکیت
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

    // فقط کاربر می‌تونه پست خودش رو حذف کنه
    if (post.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'اجازه حذف این پست را ندارید' },
        { status: 403 }
      );
    }

    // حذف لایک‌های پست
    await freshDb.like.deleteMany({
      where: { postId: postId },
    });

    // حذف کامنت‌های پست
    await freshDb.comment.deleteMany({
      where: { postId: postId },
    });

    // حذف پست
    await freshDb.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: 'پست حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف پست' },
      { status: 500 }
    );
  }
}
