/**
 * POST /api/analytics/share
 * Create a shareable link for an analytics report
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

interface ShareRequest {
  range: string;
  template?: string;
  title?: string;
  description?: string;
  expiresInDays?: number;
  password?: string;
  maxViews?: number;
}

export async function POST(request: NextRequest) {
  // Create fresh Prisma Client for this request
  const prisma = new PrismaClient();

  try {
    console.log('[Share API] POST request received');

    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      console.error('[Share API] User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Share API] User authenticated:', user.userId);

    const body: ShareRequest = await request.json();
    const { range, template, title, description, expiresInDays, password, maxViews } = body;

    console.log('[Share API] Request body:', { range, template, title, expiresInDays, maxViews });

    // Validate required fields
    if (!range) {
      console.error('[Share API] Missing required field: range');
      return NextResponse.json({ error: 'range is required' }, { status: 400 });
    }

    // Calculate expiration date
    let expiresAt: Date | undefined;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Generate unique share token
    const shareToken = randomUUID();
    console.log('[Share API] Generated share token:', shareToken);

    // Get report data
    console.log('[Share API] Fetching report data...');
    const reportData = await getReportData(prisma, user.userId, range);
    console.log('[Share API] Report data fetched successfully');

    // Create shared report
    console.log('[Share API] Creating shared report in database...');
    console.log('[Share API] prisma.sharedReport type:', typeof prisma.sharedReport);
    console.log('[Share API] prisma.sharedReport.create type:', typeof prisma.sharedReport?.create);

    const sharedReport = await prisma.sharedReport.create({
      data: {
        userId: user.userId,
        shareToken,
        title: title || `گزارش تحلیلی ${range}`,
        description: description || 'گزارش پیشرفت و تحلیل داده‌ها',
        reportType: 'analytics',
        data: JSON.stringify({
          ...reportData,
          range,
          template: template || 'default',
        }),
        expiresAt,
        password,
        maxViews,
        isActive: true,
      },
    });

    console.log('[Share API] Shared report created:', sharedReport.id);

    // Generate share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`;
    console.log('[Share API] Share URL generated:', shareUrl);

    return NextResponse.json({
      success: true,
      shareUrl,
      shareToken: sharedReport.shareToken,
      expiresAt: sharedReport.expiresAt,
      maxViews: sharedReport.maxViews,
    });
  } catch (error) {
    console.error('[Share API] Error creating share link:', error);
    console.error('[Share API] Error stack:', (error as Error).stack);
    return NextResponse.json({ error: 'خطا در ایجاد لینک اشتراک‌گذاری' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getReportData(prisma: PrismaClient, userId: string, range: string) {
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'all':
      startDate.setTime(0);
      break;
    case '30d':
    default:
      startDate.setDate(endDate.getDate() - 30);
      break;
  }

  // Get report data
  const [commitments, totalReflections, totalPlans, completedPlans, weeklyData, userData] =
    await Promise.all([
      prisma.commitment.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        include: { reflection: true },
      }),
      prisma.reflection.count({
        where: {
          commitment: {
            userId,
            date: { gte: startDate, lte: endDate },
          },
        },
      }),
      prisma.plan.count({ where: { userId } }),
      prisma.plan.count({
        where: { userId, status: 'completed' },
      }),
      prisma.$queryRaw<
        Array<{ week: string; total: bigint; completed: bigint }>
      >`
        SELECT
          strftime('%Y-%W', c.date) as week,
          COUNT(*) as total,
          SUM(CASE WHEN r.completed = 1 THEN 1 ELSE 0 END) as completed
        FROM commitments c
        LEFT JOIN reflections r ON c.id = r.commitmentId
        WHERE c.userId = ${userId}
          AND c.date >= ${startDate.toISOString()}
          AND c.date <= ${endDate.toISOString()}
        GROUP BY strftime('%Y-%W', c.date)
        ORDER BY week DESC
        LIMIT 8
      `,
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, phone: true },
      }),
    ]);

  const totalCommitments = commitments.length;
  const completedCommitments = commitments.filter((c) => c.reflection?.completed).length;
  const completionRate = totalCommitments > 0 ? (completedCommitments / totalCommitments) * 100 : 0;

  // Calculate streak
  const streakData = await prisma.commitment.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'desc' },
  });

  let currentStreak = 0;
  if (streakData.length > 0) {
    const dates = streakData.map((c) => {
      const d = new Date(c.date);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = dates[0];
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) {
      currentStreak = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const diff = Math.floor((dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
  }

  return {
    summary: {
      totalCommitments,
      completedCommitments,
      completionRate: Math.round(completionRate),
      totalReflections,
      totalPlans,
      completedPlans,
      currentStreak,
    },
    weeklyTrends: Array.isArray(weeklyData)
      ? weeklyData
          .map((row) => ({
            week: row.week,
            total: Number(row.total),
            completed: Number(row.completed),
            rate:
              Number(row.total) > 0
                ? Math.round((Number(row.completed) / Number(row.total)) * 100)
                : 0,
          }))
          .reverse()
      : [],
    user: userData || { name: 'نامشخص', phone: '' },
  };
}
