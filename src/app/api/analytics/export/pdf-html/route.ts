/**
 * PDF Export API - Using html2pdf.js for better Persian support
 * Generates HTML report and converts to PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/analytics/export/pdf-html
 * Generates a Persian PDF report using html2pdf.js
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[HTML-PDF] Request received');

    // Step 1: Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      console.error('[HTML-PDF] User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[HTML-PDF] User authenticated:', user.userId);

    // Step 2: Parse request parameters
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    // Step 3: Calculate date range
    const { startDate, endDate } = getDateRange(range);

    // Step 4: Collect data from database
    const [userData, stats, trends] = await Promise.all([
      getUserData(user.userId),
      getSummaryStats(user.userId, startDate, endDate),
      getWeeklyTrends(user.userId, startDate, endDate),
    ]);

    console.log('[HTML-PDF] Data collected');

    // Step 5: Generate HTML content
    const htmlContent = generateHTMLReport({
      userData,
      stats,
      trends,
      range,
    });

    console.log('[HTML-PDF] HTML generated');

    // Step 6: Return HTML as response (client will convert to PDF)
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="hamsou-report-${Date.now()}.html"`,
      },
    });
  } catch (error) {
    console.error('[HTML-PDF] Error generating PDF export:', error);
    console.error('[HTML-PDF] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'خطا در تولید گزارش PDF' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDateRange(range: string): { startDate: Date; endDate: Date } {
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

  return { startDate, endDate };
}

async function getUserData(userId: string): Promise<any> {
  const userData = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      phone: true,
      subscriptionPlan: true,
    },
  });

  if (!userData) {
    throw new Error('کاربر یافت نشد');
  }

  return userData;
}

async function getSummaryStats(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any> {
  const [commitments, totalReflections, totalPlans, completedPlans, streakData] = await Promise.all([
    db.commitment.findMany({
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      include: { reflection: true },
    }),
    db.reflection.count({
      where: {
        commitment: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      },
    }),
    db.plan.count({ where: { userId } }),
    db.plan.count({
      where: { userId, status: 'completed' },
    }),
    db.commitment.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    }),
  ]);

  const totalCommitments = commitments.length;
  const completedCommitments = commitments.filter((c) => c.reflection?.completed).length;
  const completionRate = totalCommitments > 0 ? (completedCommitments / totalCommitments) * 100 : 0;
  const currentStreak = calculateStreak(streakData);

  return {
    totalCommitments,
    completedCommitments,
    completionRate,
    totalReflections,
    totalPlans,
    completedPlans,
    currentStreak,
  };
}

async function getWeeklyTrends(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  const weeklyData = await db.$queryRaw<Array<{ week: string; total: bigint; completed: bigint }>>`
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
  `;

  return Array.isArray(weeklyData)
    ? weeklyData
        .map((row: any) => ({
          week: row.week,
          total: Number(row.total),
          completed: Number(row.completed),
          rate: Number(row.total) > 0 ? Math.round((Number(row.completed) / Number(row.total)) * 100) : 0,
        }))
        .reverse()
    : [];
}

function calculateStreak(commitmentDates: Array<{ date: Date }>): number {
  if (commitmentDates.length === 0) return 0;

  const dates = commitmentDates.map((c) => {
    const d = new Date(c.date);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = dates[0];
  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff > 1) return 0;

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const diff = Math.floor((dates[i].getTime() - dates[i + 1].getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function generateHTMLReport(params: {
  userData: any;
  stats: any;
  trends: any[];
  range: string;
}): string {
  const { userData, stats, trends, range } = params;
  const rangeLabel: Record<string, string> = {
    '7d': '۷ روز اخیر',
    '30d': '۳۰ روز اخیر',
    '90d': '۹۰ روز اخیر',
    'all': 'همه زمان',
  };

  const persianDate = new Date().toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>گزارش تحلیلی همسو</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Vazirmatn', Tahoma, Arial, sans-serif;
      direction: rtl;
      padding: 40px;
      background: #fff;
      color: #333;
    }

    .header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      text-align: center;
    }

    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 16px;
      opacity: 0.9;
    }

    .user-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .user-info-item {
      padding: 10px;
    }

    .user-info-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 5px;
    }

    .user-info-value {
      font-size: 16px;
      font-weight: 600;
    }

    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 15px;
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      color: #64748b;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    th, td {
      padding: 12px 15px;
      text-align: center;
      border: 1px solid #e2e8f0;
    }

    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #1e293b;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .footer {
      text-align: center;
      padding: 20px;
      margin-top: 40px;
      color: #94a3b8;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
    }

    .page-break {
      page-break-before: always;
    }

    @media print {
      body {
        padding: 20px;
      }

      .header {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>گزارش تحلیلی همسو</h1>
    <p>گزارش پیشرفت شما در ${rangeLabel[range]}</p>
  </div>

  <div class="user-info">
    <div class="user-info-item">
      <div class="user-info-label">کاربر</div>
      <div class="user-info-value">${userData.name || 'نامشخص'}</div>
    </div>
    <div class="user-info-item">
      <div class="user-info-label">تاریخ گزارش</div>
      <div class="user-info-value">${persianDate}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">خلاصه آمار</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.totalCommitments}</div>
        <div class="stat-label">کل تعهدات</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.completedCommitments}</div>
        <div class="stat-label">تکمیل شده</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round(stats.completionRate)}%</div>
        <div class="stat-label">نرخ تکمیل</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.currentStreak}</div>
        <div class="stat-label">روزهای متوالی</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalReflections}</div>
        <div class="stat-label">کل بازتاب‌ها</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.completedPlans}/${stats.totalPlans}</div>
        <div class="stat-label">برنامه‌های تکمیل</div>
      </div>
    </div>
  </div>

  ${trends.length > 0 ? `
  <div class="section">
    <h2 class="section-title">روند هفتگی</h2>
    <table>
      <thead>
        <tr>
          <th>هفته</th>
          <th>کل</th>
          <th>تکمیل</th>
          <th>درصد</th>
        </tr>
      </thead>
      <tbody>
        ${trends.map(trend => `
          <tr>
            <td>${trend.week}</td>
            <td>${trend.total}</td>
            <td>${trend.completed}</td>
            <td>${trend.rate}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>تولید شده توسط همسو - پلتفرم رشد شخصی شما</p>
  </div>
</body>
</html>
  `;
}
