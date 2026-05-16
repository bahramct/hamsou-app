import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema برای فالو
const followSchema = z.object({
  followingId: z.string(),
});

// POST /api/community/follow - فالو کردن کاربر
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    const body = await request.json();
    const { followingId } = followSchema.parse(body);

    // بررسی وجود کاربر هدف
    const targetUser = await db.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // کاربر نمی‌تونه خودش رو فالو کنه
    if (followingId === user.userId) {
      return NextResponse.json(
        { success: false, error: 'نمی‌توانید خود را فالو کنید' },
        { status: 400 }
      );
    }

    // بررسی وجود رابطه فالو
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { success: false, error: 'قبلاً این کاربر را فالو کرده‌اید' },
        { status: 400 }
      );
    }

    // ایجاد رابطه فالو
    await db.follow.create({
      data: {
        followerId: user.userId,
        followingId: followingId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'با موفقیت فالو شد',
    });
  } catch (error: any) {
    console.error('Error following user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'خطا در فالو کردن کاربر' },
      { status: 500 }
    );
  }
}

// DELETE /api/community/follow - آنفالو کردن کاربر
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    const { searchParams } = request.nextUrl;
    const followingId = searchParams.get('followingId');

    if (!followingId) {
      return NextResponse.json(
        { success: false, error: 'followingId الزامی است' },
        { status: 400 }
      );
    }

    // حذف رابطه فالو
    const deletedFollow = await db.follow.deleteMany({
      where: {
        followerId: user.userId,
        followingId: followingId,
      },
    });

    if (deletedFollow.count === 0) {
      return NextResponse.json(
        { success: false, error: 'رابطه فالو یافت نشد' },
        { status: 404 }
      );
    }

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

// GET /api/community/follow - دریافت وضعیت فالو
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    const { searchParams } = request.nextUrl;
    const followingId = searchParams.get('followingId');

    if (!followingId) {
      return NextResponse.json(
        { success: false, error: 'followingId الزامی است' },
        { status: 400 }
      );
    }

    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.userId,
          followingId: followingId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isFollowing: !!follow,
      },
    });
  } catch (error: any) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بررسی وضعیت فالو' },
      { status: 500 }
    );
  }
}
