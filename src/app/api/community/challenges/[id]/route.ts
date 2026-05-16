import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, getFreshDb } from '@/lib/db';

// DELETE /api/community/challenges/[id] - حذف چالش (فقط توسط ایجاد‌کننده)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyToken(request);
    const { id: challengeId } = await params;

    // بررسی وجود چالش
    const freshDb = getFreshDb();
    const challenge = await freshDb.challenge.findUnique({
      where: { id: challengeId },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'چالش یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی اینکه کاربر ایجاد‌کننده چالش است
    if (challenge.creatorId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'شما اجازه حذف این چالش را ندارید' },
        { status: 403 }
      );
    }

    // بررسی شرکت‌کنندگان دیگر
    // اگر فقط ایجاد‌کننده در چالش باشد، می‌تواند بدون اخطار حذف کند
    // اگر شرکت‌کننده دیگری وجود داشته باشد، باید هشدار داده شود
    const hasOtherParticipants = challenge._count.participants > 1;

    // حذف چالش (با Cascade، شرکت‌کنندگان هم حذف می‌شوند)
    await freshDb.challenge.delete({
      where: { id: challengeId },
    });

    return NextResponse.json({
      success: true,
      message: hasOtherParticipants
        ? 'چالش با موفقیت حذف شد. توجه: این چالش از پنل شرکت‌کنندگان دیگر نیز حذف شد.'
        : 'چالش با موفقیت حذف شد.',
    });
  } catch (error: any) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف چالش' },
      { status: 500 }
    );
  }
}
