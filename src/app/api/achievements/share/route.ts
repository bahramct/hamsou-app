import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { randomBytes } from 'crypto';

// Helper function to generate unique share token
function generateShareToken(): string {
  return randomBytes(16).toString('hex');
}

// POST /api/achievements/share
// Create a shareable achievement link
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      achievementType,
      data,
      title,
      description,
      expiresDays = 30,
    } = body;

    // Validate required fields
    if (!achievementType || !data) {
      return NextResponse.json(
        { error: 'نوع دستاورد و داده‌های آن الزامی است' },
        { status: 400 }
      );
    }

    // Validate achievement type
    const validTypes = ['commitment', 'streak', 'plan_completed'];
    if (!validTypes.includes(achievementType)) {
      return NextResponse.json(
        { error: 'نوع دستاورد نامعتبر است' },
        { status: 400 }
      );
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresDays);

    // Create shared achievement
    const sharedAchievement = await db.sharedAchievement.create({
      data: {
        userId: session.user.id,
        shareToken: generateShareToken(),
        achievementType,
        data: JSON.stringify(data),
        title,
        description,
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      shareToken: sharedAchievement.shareToken,
      shareUrl: `/share/achievement/${sharedAchievement.shareToken}`,
      imageUrl: `/api/achievements/generate-image?token=${sharedAchievement.shareToken}`,
      expiresAt: sharedAchievement.expiresAt,
    });
  } catch (error) {
    console.error('Error creating shared achievement:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد لینک اشتراک‌گذاری' },
      { status: 500 }
    );
  }
}

// GET /api/achievements/share
// Get user's shared achievements list
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'لطفاً وارد شوید' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const achievementType = searchParams.get('type');

    const where: any = {
      userId: session.user.id,
      isActive: true,
    };

    if (achievementType) {
      where.achievementType = achievementType;
    }

    const sharedAchievements = await db.sharedAchievement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      achievements: sharedAchievements.map((a) => ({
        id: a.id,
        shareToken: a.shareToken,
        achievementType: a.achievementType,
        title: a.title,
        description: a.description,
        data: JSON.parse(a.data),
        shareUrl: `/share/achievement/${a.shareToken}`,
        imageUrl: `/api/achievements/generate-image?token=${a.shareToken}`,
        expiresAt: a.expiresAt,
        views: a.views,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching shared achievements:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت دستاوردهای اشتراک‌گذاری شده' },
      { status: 500 }
    );
  }
}
