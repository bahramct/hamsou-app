import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// دریافت دستاورد اشتراک‌گذاری شده
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // دریافت دستاورد
    const achievement = await db.sharedAchievement.findUnique({
      where: { shareToken: token },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
    });

    if (!achievement) {
      return NextResponse.json({ error: 'لینک اشتراک‌گذاری یافت نشد' }, { status: 404 });
    }

    // چک کردن فعال بودن
    if (!achievement.isActive) {
      return NextResponse.json({ error: 'این لینک غیرفعال شده است' }, { status: 403 });
    }

    // چک کردن انقضا
    if (achievement.expiresAt && new Date() > achievement.expiresAt) {
      return NextResponse.json({ error: 'این لینک منقضی شده است' }, { status: 403 });
    }

    // چک کردن حداکثر تعداد بازدید
    if (achievement.maxViews && achievement.views >= achievement.maxViews) {
      return NextResponse.json({ error: 'حداکثر تعداد بازدید استفاده شده است' }, { status: 403 });
    }

    // افزایش تعداد بازدید
    await db.sharedAchievement.update({
      where: { id: achievement.id },
      data: { views: achievement.views + 1 },
    });

    // برگرداندن داده‌ها
    return NextResponse.json({
      id: achievement.id,
      shareToken: achievement.shareToken,
      achievementType: achievement.achievementType,
      data: JSON.parse(achievement.data),
      title: achievement.title,
      description: achievement.description,
      user: achievement.user,
      createdAt: achievement.createdAt,
      views: achievement.views + 1,
    });
  } catch (error: any) {
    console.error('Error fetching shared achievement:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دستاورد' },
      { status: 500 }
    );
  }
}
