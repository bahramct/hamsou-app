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

    // Get all plans
    const allPlans = await db.plan.findMany({
      where: {
        userId: user.userId,
      },
    });

    // Get plans in range
    const plansInRange = await db.plan.findMany({
      where: {
        userId: user.userId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
    });

    const activePlans = allPlans.filter((p) => p.status === 'active').length;
    const completedPlans = allPlans.filter((p) => p.status === 'completed').length;

    // Average progress of active plans
    const activePlansData = allPlans.filter((p) => p.status === 'active');
    const averageProgress =
      activePlansData.length > 0
        ? activePlansData.reduce((sum, p) => sum + p.progress, 0) / activePlansData.length
        : 0;

    // By status
    const statusMap = new Map<string, number>();
    allPlans.forEach((p) => {
      const status = p.status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    return NextResponse.json({
      activePlans,
      completedPlans,
      averageProgress,
      byStatus,
    });
  } catch (error) {
    console.error('Error fetching plans analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
