import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/achievements/share-info?token=xxx
// Get achievement info for sharing (increments view count)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'توکن اشتراک‌گذاری الزامی است' },
        { status: 400 }
      );
    }

    // Find the shared achievement
    const achievement = await db.sharedAchievement.findUnique({
      where: { shareToken: token },
      include: { user: true },
    });

    if (!achievement) {
      return NextResponse.json(
        { error: 'دستاورد یافت نشد' },
        { status: 404 }
      );
    }

    if (!achievement.isActive) {
      return NextResponse.json(
        { error: 'این لینک دیگر فعال نیست' },
        { status: 410 }
      );
    }

    // Check if expired
    if (achievement.expiresAt && achievement.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'این لینک منقضی شده است' },
        { status: 410 }
      );
    }

    // Check if max views reached
    if (achievement.maxViews && achievement.views >= achievement.maxViews) {
      return NextResponse.json(
        { error: 'حداکثر تعداد بازدید برای این لینک به اتمام رسیده است' },
        { status: 410 }
      );
    }

    // Increment view count
    await db.sharedAchievement.update({
      where: { id: achievement.id },
      data: { views: achievement.views + 1 },
    });

    // Parse achievement data
    const data = JSON.parse(achievement.data);

    // Return achievement info
    return NextResponse.json({
      success: true,
      achievement: {
        id: achievement.id,
        shareToken: achievement.shareToken,
        achievementType: achievement.achievementType,
        title: achievement.title,
        description: achievement.description,
        data,
        userName: achievement.user.name,
        userPhone: achievement.user.phone,
        imageUrl: `/api/achievements/generate-image?token=${achievement.shareToken}`,
        views: achievement.views + 1,
        createdAt: achievement.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching share info:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات اشتراک‌گذاری' },
      { status: 500 }
    );
  }
}
