import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    // محاسبه بازه زمانی
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // دریافت تعهدات در بازه زمانی
    const commitments = await db.commitment.findMany({
      where: {
        userId: user.userId,
        date: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: { date: 'asc' },
    });

    // دریافت بازتاب‌ها
    const reflections = await db.reflection.findMany({
      where: {
        commitment: {
          userId: user.userId,
          date: {
            gte: startDate,
            lte: now,
          },
        },
      },
      include: {
        commitment: true,
      },
    });

    // گروه‌بندی بر اساس تاریخ
    const dateMap = new Map<string, { total: number; completed: number }>();

    commitments.forEach((commitment) => {
      if (!dateMap.has(commitment.date)) {
        dateMap.set(commitment.date, { total: 0, completed: 0 });
      }
      const data = dateMap.get(commitment.date)!;
      data.total++;

      // پیدا کردن بازتاب مربوطه
      const reflection = reflections.find((r) => r.commitmentId === commitment.id);
      if (reflection && reflection.completed) {
        data.completed++;
      }
    });

    // تبدیل به آرایه و محاسبه نرخ تکمیل
    const trendData = Array.from(dateMap.entries())
      .map(([date, stats]) => ({
        date,
        total: stats.total,
        completed: stats.completed,
        completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // فرمت کردن تاریخ‌ها به فارسی
    const formattedTrendData = trendData.map((item) => {
      const date = new Date(item.date);
      const day = date.toLocaleDateString('fa-IR', { day: '2-digit' });
      const month = date.toLocaleDateString('fa-IR', { month: '2-digit' });
      return {
        ...item,
        date: `${month}/${day}`,
      };
    });

    return NextResponse.json(formattedTrendData);
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({ error: 'خطا در دریافت روند داده‌ها' }, { status: 500 });
  }
}
