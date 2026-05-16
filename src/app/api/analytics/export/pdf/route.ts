/**
 * PDF Export API - Analytics Report Generation (Persian Support)
 * Generates comprehensive PDF reports with charts and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { AnalyticsReportTemplate } from '@/lib/pdf-templates';
import { ReportTemplate } from '@/lib/pdf-template-types';
import { toPersianNumber, getPersianDate } from '@/lib/pdf-helpers';

// Helper function to calculate date range
function getDateRange(range: string) {
  const now = new Date();
  const startDate = new Date();

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
      return { startDate: new Date(0), now };
    default:
      startDate.setDate(now.getDate() - 30);
  }

  return { startDate, now };
}

// Helper function to calculate weekly trends
async function getWeeklyTrends(userId: string, startDate: Date, endDate: Date) {
  const commitments = await db.commitment.findMany({
    where: {
      userId,
      targetDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Group by week
  const weekMap: Record<string, { total: number; completed: number }> = {};

  commitments.forEach((commitment) => {
    const date = new Date(commitment.targetDate);
    const weekNumber = Math.ceil((date.getDate()) / 7);
    const monthYear = `${date.getFullYear()}-W${weekNumber}`;

    if (!weekMap[monthYear]) {
      weekMap[monthYear] = { total: 0, completed: 0 };
    }
    weekMap[monthYear].total++;
    if (commitment.status === 'completed') {
      weekMap[monthYear].completed++;
    }
  });

  // Convert to array
  return Object.entries(weekMap).map(([week, stats]) => ({
    week: `هفته ${toPersianNumber(parseInt(week.split('W')[1]))}`,
    total: stats.total,
    completed: stats.completed,
    rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
  }));
}

// Helper function to get category statistics
async function getCategoryStats(userId: string, startDate: Date, endDate: Date) {
  const commitments = await db.commitment.findMany({
    where: {
      userId,
      targetDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const categoryMap: Record<string, { total: number; completed: number }> = {};

  commitments.forEach((commitment) => {
    const category = commitment.category || 'دسته‌بندی نشده';
    if (!categoryMap[category]) {
      categoryMap[category] = { total: 0, completed: 0 };
    }
    categoryMap[category].total++;
    if (commitment.status === 'completed') {
      categoryMap[category].completed++;
    }
  });

  return categoryMap;
}

export async function GET(request: NextRequest) {
  try {
    console.log('[PDF Export] Request received');

    // Verify authentication
    const user = await verifyToken(request);
    if (!user || !user.userId) {
      console.error('[PDF Export] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const userData = await db.user.findUnique({
      where: { id: user.userId },
      select: { 
        id: true,
        name: true, 
        phone: true,
        subscriptionPlan: true 
      },
    });

    if (!userData) {
      console.error('[PDF Export] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check subscription plan
    const userPlan = (userData.subscriptionPlan || 'free').toLowerCase();
    if (userPlan !== 'pro' && userPlan !== 'plus') {
      console.error('[PDF Export] Insufficient plan:', userPlan);
      return NextResponse.json(
        { error: 'Plan required for PDF export' },
        { status: 403 }
      );
    }

    // Get range parameter
    const range = request.nextUrl.searchParams.get('range') || '30d';
    const template = (request.nextUrl.searchParams.get('template') || 'default') as ReportTemplate;

    console.log('[PDF Export] Generating report for range:', range, 'template:', template);

    // Calculate date range
    const { startDate, now } = getDateRange(range);

    // Get statistics
    const commitments = await db.commitment.findMany({
      where: {
        userId: user.userId,
        targetDate: {
          gte: startDate,
          lte: now,
        },
      },
    });

    const totalCommitments = commitments.length;
    const completedCommitments = commitments.filter((c) => c.status === 'completed').length;
    const completionRate = totalCommitments > 0 ? (completedCommitments / totalCommitments) * 100 : 0;

    // Get reflections count
    const totalReflections = await db.reflection.count({
      where: {
        userId: user.userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
    });

    // Get plans
    const allPlans = await db.plan.findMany({
      where: {
        userId: user.userId,
      },
    });

    const totalPlans = allPlans.length;
    const completedPlans = allPlans.filter((p) => p.status === 'completed').length;

    // Calculate current streak
    let currentStreak = 0;
    const commitmentDates = commitments
      .map((c) => {
        const d = new Date(c.targetDate);
        d.setHours(0, 0, 0, 0);
        return d;
      })
      .sort((a, b) => b.getTime() - a.getTime());

    if (commitmentDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastDate = commitmentDates[0];
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        currentStreak = 1;
        for (let i = 0; i < commitmentDates.length - 1; i++) {
          const diff = Math.floor(
            (commitmentDates[i].getTime() - commitmentDates[i + 1].getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (diff === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Get weekly trends
    const trends = await getWeeklyTrends(user.userId, startDate, now);

    console.log('[PDF Export] Generated statistics:', {
      totalCommitments,
      completedCommitments,
      completionRate,
      totalReflections,
      totalPlans,
      completedPlans,
      currentStreak,
    });

    // Create PDF
    const reportTemplate = new AnalyticsReportTemplate(template);
    const pdfBuffer = reportTemplate.generateReport({
      userData: {
        name: userData.name || 'کاربر',
        phone: userData.phone || '-',
        subscriptionPlan: userPlan,
      },
      stats: {
        totalCommitments,
        completedCommitments,
        completionRate,
        totalReflections,
        totalPlans,
        completedPlans,
        currentStreak,
      },
      trends: trends.slice(0, 8), // Last 8 weeks
      range,
    });

    console.log('[PDF Export] PDF generated successfully');

    // Generate filename
    const dateStr = getPersianDate().replace(/\//g, '-');
    const filename = `hamsou-report-${dateStr}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[PDF Export] Error:', error);
    return NextResponse.json(
      {
        error: 'خطا در تولید PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
