import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/community/challenges/[id]/join - پیوستن به چالش
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const challengeId = params.id;

    // بررسی وجود چالش
    const challenge = await db.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'چالش یافت نشد' },
        { status: 404 }
      );
    }

    // بررسی وضعیت چالش
    if (challenge.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'این چالش دیگر فعال نیست' },
        { status: 400 }
      );
    }

    // بررسی محدودیت تعداد شرکت‌کنندگان
    if (challenge.participantLimit) {
      const participantCount = await db.challengeParticipant.count({
        where: { challengeId: challengeId },
      });

      if (participantCount >= challenge.participantLimit) {
        return NextResponse.json(
          { success: false, error: 'ظرفیت چالش تکمیل شده است' },
          { status: 400 }
        );
      }
    }

    // بررسی شرکت‌کردن قبلی
    const existingParticipant = await db.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId: challengeId,
          userId: user.id,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { success: false, error: 'شما قبلاً در این چالش شرکت کرده‌اید' },
        { status: 400 }
      );
    }

    // ایجاد رابطه شرکت‌کننده
    await db.challengeParticipant.create({
      data: {
        challengeId: challengeId,
        userId: user.id,
      },
    });

    // بروزرسانی تعداد شرکت‌کنندگان
    await db.challenge.update({
      where: { id: challengeId },
      data: {
        participantCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'با موفقیت به چالش پیوستید',
    });
  } catch (error: any) {
    console.error('Error joining challenge:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پیوستن به چالش' },
      { status: 500 }
    );
  }
}

// DELETE /api/community/challenges/[id]/join - خروج از چالش
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    const challengeId = params.id;

    // حذف رابطه شرکت‌کننده
    const deletedParticipant = await db.challengeParticipant.deleteMany({
      where: {
        challengeId: challengeId,
        userId: user.id,
      },
    });

    if (deletedParticipant.count === 0) {
      return NextResponse.json(
        { success: false, error: 'شما در این چالش شرکت نکرده‌اید' },
        { status: 404 }
      );
    }

    // بروزرسانی تعداد شرکت‌کنندگان
    await db.challenge.update({
      where: { id: challengeId },
      data: {
        participantCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'با موفقیت از چالش خارج شدید',
    });
  } catch (error: any) {
    console.error('Error leaving challenge:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در خروج از چالش' },
      { status: 500 }
    );
  }
}
