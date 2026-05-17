import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

/**
 * DEV ONLY API
 * This endpoint is for development testing purposes only
 * It will not work in production
 */

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// تأیید توکن
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

// متن‌های نمونه برای تعهدات
const SAMPLE_COMMITMENTS = [
  'امروز می‌خواهم تمرکز بیشتری روی کارم داشته باشم',
  'می‌خواهم حداقل 30 دقیقه مطالعه کنم',
  'امروز ورزش خواهم کرد',
  'می‌خواهم با خانواده وقت بیشتری بگذرانم',
  'امروز روی پروژه شخصی‌ام کار خواهم کرد',
  'می‌خواهم خواب منظم‌تری داشته باشم',
  'امروز به خودم زمان استراحت خواهم داد',
  'می‌خواهم یادداشت‌های روزانه‌ام را بنویسم',
  'امروز آب کافی می‌خواهم بنوشم',
  'می‌خواهم از شبکه‌های اجتماعی کمتر استفاده کنم',
];

// دلایل نمونه برای reflection
const SAMPLE_REASONS = {
  completed: [
    'با تمرکز کامل انجام شد',
    'احساس خوبی داشتم',
    'طبق برنامه پیش رفتم',
    'انرژی بالایی داشتم',
    'چالش‌ها را مدیریت کردم',
    'زمانی را مشخص کرده بودم',
    'انگیزه کافی داشتم',
    'حوصله و رغبت داشتم',
  ],
  notCompleted: [
    'حواسم پرت شد',
    'انرژی نداشتم',
    'فراموش کردم',
    'کارهای دیگری پیش آمد',
    'وسوسه شدم',
    'خسته بودم',
    'فرصت کافی نداشتم',
    'اولویت‌ها تغییر کرد',
  ],
};

/**
 * Get the start of the week (Saturday in Persian calendar)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday
  const diff = (day + 1) % 7; // 0 = Saturday, 1 = Sunday, ..., 6 = Friday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generate random test data for a user
 * Generates commitments and reflections aligned to complete weeks
 */
export async function POST(request: NextRequest) {
  // Environment check - only work in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'This endpoint is only available in development mode',
        message: 'این API فقط در محیط توسعه قابل استفاده است',
      },
      { status: 404 }
    );
  }

  // Additional safety check - disable if explicitly disabled
  if (process.env.DISABLE_DEV_TOOLS === 'true') {
    return NextResponse.json(
      {
        error: 'Dev tools are disabled',
      },
      { status: 404 }
    );
  }

  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const days = body.days || 14; // Default 14 days
    const clearBefore = body.clearBefore !== false; // Default: clear existing data

    if (days < 7 || days > 365) {
      return NextResponse.json(
        { error: 'تعداد روز باید حداقل 7 روز و حداکثر 365 روز باشد' },
        { status: 400 }
      );
    }

    // Always delete existing data in development mode
    const existingCommitments = await db.commitment.count({
      where: { userId: decoded.userId },
    });

    const existingReflections = await db.reflection.count({
      where: {
        commitment: { userId: decoded.userId },
      },
    });

    if (existingCommitments > 0 && clearBefore) {
      // Delete reflections first (due to foreign key)
      await db.reflection.deleteMany({
        where: {
          commitment: { userId: decoded.userId },
        },
      });

      // Delete commitments
      await db.commitment.deleteMany({
        where: { userId: decoded.userId },
      });
    }

    // Calculate week boundaries for clean data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from the last Saturday that makes sense for the requested days
    // We want complete weeks, so we round up to the nearest 7
    const completeWeeks = Math.ceil(days / 7);
    const totalDaysToGenerate = completeWeeks * 7;

    // Calculate the start date (going back from today, but we don't include today)
    // We start from yesterday and go back
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 1); // Start from yesterday

    // Align to Saturday (start of week in Persian calendar)
    const weekStart = getWeekStart(startDate);

    // Generate commitments and reflections
    const generatedData = [];
    let weekData: any[] = [];
    let currentWeekStart: Date | null = null;

    for (let i = 0; i < totalDaysToGenerate; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);

      // Track week data
      const thisWeekStart = getWeekStart(date);
      if (currentWeekStart?.getTime() !== thisWeekStart.getTime()) {
        if (weekData.length > 0) {
          generatedData.push({
            type: 'week',
            weekStart: currentWeekStart,
            weekEnd: new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000),
            days: weekData,
          });
        }
        currentWeekStart = thisWeekStart;
        weekData = [];
      }

      // Random completion rate (around 70% completion)
      const isCompleted = Math.random() < 0.7;

      // Pick random commitment text
      const commitmentText =
        SAMPLE_COMMITMENTS[Math.floor(Math.random() * SAMPLE_COMMITMENTS.length)];

      // Create commitment
      const commitment = await db.commitment.create({
        data: {
          userId: decoded.userId,
          text: commitmentText,
          date: date,
        },
      });

      // Create reflection for all days (we're generating historical data)
      const reason = isCompleted
        ? SAMPLE_REASONS.completed[Math.floor(Math.random() * SAMPLE_REASONS.completed.length)]
        : SAMPLE_REASONS.notCompleted[Math.floor(Math.random() * SAMPLE_REASONS.notCompleted.length)];

      const reflection = await db.reflection.create({
        data: {
          commitmentId: commitment.id,
          completed: isCompleted,
          reason: reason,
          reflectedAt: new Date(date.getTime() + 24 * 60 * 60 * 1000), // Next day
        },
      });

      const dayData = {
        date: date.toISOString().split('T')[0],
        commitment: commitmentText,
        completed: reflection.completed,
        reason: reflection.reason,
      };

      weekData.push(dayData);
    }

    // Add the last week
    if (weekData.length > 0) {
      generatedData.push({
        type: 'week',
        weekStart: currentWeekStart,
        weekEnd: new Date(new Date(currentWeekStart).getTime() + 6 * 24 * 60 * 60 * 1000),
        days: weekData,
      });
    }

    // Calculate overall completion rate
    const allDays = generatedData.flatMap((w) => w.days);
    const completedCount = allDays.filter((d) => d.completed === true).length;
    const completionRate = Math.round((completedCount / allDays.length) * 100);

    return NextResponse.json({
      success: true,
      message: `${totalDaysToGenerate} روز داده تستی (${generatedData.length} هفته کامل) با موفقیت تولید شد`,
      data: {
        totalDays: totalDaysToGenerate,
        totalWeeks: generatedData.length,
        generatedCommitments: totalDaysToGenerate,
        generatedReflections: totalDaysToGenerate, // All historical days have reflections
        completionRate: `${completionRate}%`,
        clearedOldData: {
          commitments: existingCommitments,
          reflections: existingReflections,
        },
        weeks: generatedData.map((w) => ({
          weekStart: w.weekStart,
          weekEnd: w.weekEnd,
          daysCount: w.days.length,
          completedCount: w.days.filter((d) => d.completed).length,
          completionRate: `${Math.round((w.days.filter((d) => d.completed).length / w.days.length) * 100)}%`,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error generating test data:', error);
    return NextResponse.json(
      {
        error: 'خطا در تولید داده‌های تستی',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - check if test data exists
 */
export async function GET(request: NextRequest) {
  // Environment check
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'This endpoint is only available in development mode',
      },
      { status: 404 }
    );
  }

  // Additional safety check - disable if explicitly disabled
  if (process.env.DISABLE_DEV_TOOLS === 'true') {
    return NextResponse.json(
      {
        error: 'Dev tools are disabled',
      },
      { status: 404 }
    );
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    // Check existing data
    const commitmentsCount = await db.commitment.count({
      where: { userId: decoded.userId },
    });

    const reflectionsCount = await db.reflection.count({
      where: {
        commitment: { userId: decoded.userId },
      },
    });

    // Get date range
    const oldestCommitment = await db.commitment.findFirst({
      where: { userId: decoded.userId },
      orderBy: { date: 'asc' },
      select: { date: true },
    });

    const newestCommitment = await db.commitment.findFirst({
      where: { userId: decoded.userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    // Calculate completion rate
    let completionRate = 0;
    if (reflectionsCount > 0) {
      const completedReflections = await db.reflection.count({
        where: {
          commitment: { userId: decoded.userId },
          completed: true,
        },
      });
      completionRate = Math.round((completedReflections / reflectionsCount) * 100);
    }

    return NextResponse.json({
      exists: commitmentsCount > 0,
      commitmentsCount,
      reflectionsCount,
      completionRate: `${completionRate}%`,
      dateRange: oldestCommitment && newestCommitment
        ? {
            from: oldestCommitment.date,
            to: newestCommitment.date,
            days: Math.floor((newestCommitment.date.getTime() - oldestCommitment.date.getTime()) / (1000 * 60 * 60 * 24)) + 1,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error checking test data:', error);
    return NextResponse.json(
      { error: 'خطا در بررسی داده‌های تستی' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint - remove all test data for a user
 */
export async function DELETE(request: NextRequest) {
  // Environment check
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'This endpoint is only available in development mode',
      },
      { status: 404 }
    );
  }

  // Additional safety check - disable if explicitly disabled
  if (process.env.DISABLE_DEV_TOOLS === 'true') {
    return NextResponse.json(
      {
        error: 'Dev tools are disabled',
      },
      { status: 404 }
    );
  }

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    // Count before delete
    const commitmentsCount = await db.commitment.count({
      where: { userId: decoded.userId },
    });

    const reflectionsCount = await db.reflection.count({
      where: {
        commitment: { userId: decoded.userId },
      },
    });

    // Delete reflections first (due to foreign key)
    await db.reflection.deleteMany({
      where: {
        commitment: { userId: decoded.userId },
      },
    });

    // Delete commitments
    await db.commitment.deleteMany({
      where: { userId: decoded.userId },
    });

    return NextResponse.json({
      success: true,
      message: 'همه داده‌های تستی حذف شدند',
      deleted: {
        commitments: commitmentsCount,
        reflections: reflectionsCount,
      },
    });
  } catch (error: any) {
    console.error('Error deleting test data:', error);
    return NextResponse.json(
      { error: 'خطا در حذف داده‌های تستی' },
      { status: 500 }
    );
  }
}
