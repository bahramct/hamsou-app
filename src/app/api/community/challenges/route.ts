import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, getFreshDb } from '@/lib/db';
import { z } from 'zod';

// GET /api/community/challenges - دریافت لیست چالش‌ها
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // active, completed, cancelled
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    // فیلترها
    const where: any = {};

    if (status) {
      where.status = status;
    } else {
      // به طور پیش‌فرض فقط چالش‌های فعال را نشان می‌دهیم
      where.status = 'active';
    }

    if (category) {
      where.category = category;
    }

    // دریافت چالش‌ها
    const freshDb = getFreshDb();
    const challenges = await freshDb.challenge.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // بررسی شرکت‌کردن کاربر در هر چالش
    const challengesWithUserStatus = await Promise.all(
      challenges.map(async (challenge) => {
        const participant = await db.challengeParticipant.findUnique({
          where: {
            challengeId_userId: {
              challengeId: challenge.id,
              userId: user.userId,
            },
          },
        });

        return {
          ...challenge,
          isJoined: !!participant,
          userProgress: participant?.currentValue || 0,
          isCompleted: participant?.isCompleted || false,
        };
      })
    );

    // دریافت تعداد کل
    const total = await db.challenge.count({ where });

    return NextResponse.json({
      success: true,
      data: challengesWithUserStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت چالش‌ها' },
      { status: 500 }
    );
  }
}

// POST /api/community/challenges - ایجاد چالش جدید
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const body = await request.json();

    // اعتبارسنجی
    const createChallengeSchema = z.object({
      title: z.string().min(1).max(100),
      description: z.string().optional(),
      type: z.enum(['daily_commitment', 'weekly_streak', 'monthly_goal']),
      category: z.string().default('general'),
      startDate: z.string(), // ISO date string
      endDate: z.string(), // ISO date string
      targetValue: z.number().int().positive().optional(),
      participantLimit: z.number().int().positive().optional(),
    });

    const validatedData = createChallengeSchema.parse(body);

    // ایجاد چالش
    const freshDb = getFreshDb();
    const challenge = await freshDb.challenge.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        creatorId: user.userId,
        type: validatedData.type,
        category: validatedData.category,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        targetValue: validatedData.targetValue,
        participantLimit: validatedData.participantLimit,
        participantCount: 1, // ایجاد‌کننده به صورت خودکار عضو می‌شود
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    // ایجاد‌کننده به صورت خودکار به چالش اضافه می‌شود
    await freshDb.challengeParticipant.create({
      data: {
        challengeId: challenge.id,
        userId: user.userId,
      },
    });

    const responseChallenge = {
      ...challenge,
      isJoined: true, // ایجاد‌کننده به صورت خودکار عضو شده است
      userProgress: 0,
      isCompleted: false,
    };

    return NextResponse.json({
      success: true,
      data: responseChallenge,
    });
  } catch (error: any) {
    console.error('Error creating challenge:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'داده‌های نامعتبر', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد چالش' },
      { status: 500 }
    );
  }
}
