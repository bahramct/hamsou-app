import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

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
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get reflections with their commitments to get the date
    const reflections = await db.reflection.findMany({
      where: {
        commitment: {
          userId: user.userId,
        },
        reflectedAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        commitment: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        reflectedAt: 'desc',
      },
    });

    // Calculate completion rate
    const totalReflections = reflections.length;
    const completedReflections = reflections.filter((r) => r.completed).length;
    const completionRate = totalReflections > 0
      ? (completedReflections / totalReflections) * 100
      : 0;

    // Daily completion trends
    const dailyTrends = reflections.map((r) => ({
      date: new Date(r.commitment.date).toLocaleDateString('fa-IR'),
      completed: r.completed,
    }));

    // Most common reason for not completing
    const notCompletedReasons = reflections
      .filter((r) => !r.completed && r.reason)
      .map((r) => r.reason as string);

    const reasonCounts: Record<string, number> = {};
    notCompletedReasons.forEach((reason) => {
      const key = reason || 'بدون دلیل';
      reasonCounts[key] = (reasonCounts[key] || 0) + 1;
    });

    let mostCommonReason = null;
    let maxReasonCount = 0;
    Object.entries(reasonCounts).forEach(([reason, count]) => {
      if (count > maxReasonCount) {
        maxReasonCount = count;
        mostCommonReason = reason;
      }
    });

    return NextResponse.json({
      totalReflections,
      completedReflections,
      completionRate,
      dailyTrends: dailyTrends.slice(0, 30), // Last 30 reflections
      mostCommonReason,
    });
  } catch (error) {
    console.error('Error fetching reflections analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
