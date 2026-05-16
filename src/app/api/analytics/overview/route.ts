import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get all commitments in range
    const commitments = await db.commitment.findMany({
      where: {
        userId: user.userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        reflection: true,
      },
    });

    const totalCommitments = commitments.length;
    const completedCommitments = commitments.filter(
      (c) => c.reflection?.completed
    ).length;
    const completionRate =
      totalCommitments > 0 ? (completedCommitments / totalCommitments) * 100 : 0;

    // Get reflections count
    const totalReflections = await db.reflection.count({
      where: {
        commitment: {
          userId: user.userId,
          date: {
            gte: startDate,
            lte: now,
          },
        },
      },
    });

    // Get plans stats
    const totalPlans = await db.plan.count({
      where: {
        userId: user.userId,
      },
    });

    const completedPlans = await db.plan.count({
      where: {
        userId: user.userId,
        status: 'completed',
      },
    });

    // Calculate streak (consecutive days with commitments)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all commitment dates
    const commitmentDates = await db.commitment.findMany({
      where: {
        userId: user.userId,
      },
      select: {
        date: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (commitmentDates.length > 0) {
      const dates = commitmentDates.map((c) => {
        const d = new Date(c.date);
        d.setHours(0, 0, 0, 0);
        return d;
      });

      // Check if there's a commitment today or yesterday
      const lastDate = dates[0];
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        // Streak is active
        currentStreak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const currentDate = dates[i];
          const nextDate = dates[i + 1];
          const diff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Get user data including subscription plan
    const userData = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        subscriptionPlan: true,
      },
    });

    return NextResponse.json({
      totalCommitments,
      completedCommitments,
      completionRate,
      totalReflections,
      totalPlans,
      completedPlans,
      currentStreak,
      subscriptionPlan: (userData?.subscriptionPlan || 'free').toLowerCase(),
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
