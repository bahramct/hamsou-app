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

    // Get commitments with reflections
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

    // Analysis by completion status
    let totalCommitments = commitments.length;
    let completedCommitments = 0;
    let notCompletedCommitments = 0;
    let noReflection = 0;

    commitments.forEach((c) => {
      if (c.reflection) {
        if (c.reflection.completed) {
          completedCommitments++;
        } else {
          notCompletedCommitments++;
        }
      } else {
        noReflection++;
      }
    });

    // Weekly trend
    const weekMap = new Map<string, { completed: number; total: number; notCompleted: number; noReflection: number }>();

    commitments.forEach((c) => {
      const date = new Date(c.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { completed: 0, total: 0, notCompleted: 0, noReflection: 0 });
      }
      const data = weekMap.get(weekKey)!;
      data.total++;

      if (c.reflection) {
        if (c.reflection.completed) {
          data.completed++;
        } else {
          data.notCompleted++;
        }
      } else {
        data.noReflection++;
      }
    });

    const weeklyTrend = Array.from(weekMap.entries())
      .map(([week, data]) => ({
        week,
        completed: data.completed,
        notCompleted: data.notCompleted,
        noReflection: data.noReflection,
        total: data.total,
      }))
      .sort((a, b) => b.week.localeCompare(a.week));

    return NextResponse.json({
      totalCommitments,
      completedCommitments,
      notCompletedCommitments,
      noReflection,
      completionRate: totalCommitments > 0 ? (completedCommitments / totalCommitments) * 100 : 0,
      weeklyTrend,
    });
  } catch (error) {
    console.error('Error fetching commitments analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
