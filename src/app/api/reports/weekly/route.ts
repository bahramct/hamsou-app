import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// تأیید توکن
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

// دریافت گزارش هفتگی
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // محاسبه هفته جاری اگر تاریخ مشخص نشده باشد
    const now = new Date();
    let weekStart: Date;
    let weekEnd: Date;

    if (startDate && endDate) {
      weekStart = new Date(startDate);
      weekEnd = new Date(endDate);
    } else {
      // شنبه هفته جاری (در ایران هفته از شنبه شروع می‌شود)
      const dayOfWeek = now.getDay();
      const diff = (dayOfWeek + 1) % 7; // تبدیل به فرمت ایران (شنبه = 0)

      weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);
      weekStart.setHours(0, 0, 0, 0);

      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
    }

    // دریافت گزارش موجود
    let report = await db.weeklyReport.findFirst({
      where: {
        userId: decoded.userId,
        weekStart: {
          gte: new Date(weekStart.setHours(0, 0, 0, 0)),
          lt: new Date(weekStart.setHours(23, 59, 59, 999)),
        },
      },
    });

    // اگر گزارش وجود ندارد، آن را ایجاد می‌کنیم
    if (!report) {
      // دریافت تعهدات هفته
      const commitments = await db.commitment.findMany({
        where: {
          userId: decoded.userId,
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          reflection: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      // محاسبه آمار پایه
      const totalCommitments = commitments.length;
      const completedCount = commitments.filter(c => c.reflection?.completed).length;
      const notCompletedCount = totalCommitments - completedCount;
      const consistencyScore = totalCommitments > 0 ? completedCount / totalCommitments : 0;

      // جمع‌آوری دلایل عدم انجام
      const reasons = commitments
        .filter(c => c.reflection && !c.reflection.completed)
        .map(c => c.reflection!.reason)
        .filter((r): r is string => r !== null);

      // ایجاد گزارش اولیه (بدون AI)
      report = await db.weeklyReport.create({
        data: {
          userId: decoded.userId,
          weekStart: new Date(weekStart.setHours(0, 0, 0, 0)),
          weekEnd: new Date(weekEnd.setHours(23, 59, 59, 999)),
          consistencyScore,
          completionPattern: JSON.stringify({
            totalCommitments,
            completedCount,
            notCompletedCount,
            completionRate: consistencyScore,
            mostCommonReason: reasons.length > 0
              ? reasons.reduce((acc, reason) => {
                acc[reason] = (acc[reason] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
              : {},
          }),
          behavioralFriction: JSON.stringify({
            mainBarriers: reasons.length > 0 ? [...new Set(reasons)] : [],
            frictionPoints: [],
            recurringThemes: [],
          }),
          emotionalTone: JSON.stringify({
            dominantTone: 'neutral',
            toneProgression: [],
            emotionalTriggers: [],
          }),
          weeklySummary: null, // بعداً با AI پر می‌شود
          behavioralInsight: null, // بعداً با AI پر می‌شود
          suggestedDirection: null, // بعداً با AI پر می‌شود
          reportContent: JSON.stringify({
            hasData: totalCommitments > 0,
            needsAI: true,
          }),
        },
      });
    }

    // برگرداندن گزارش
    const response = {
      id: report.id,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      consistencyScore: report.consistencyScore,
      completionPattern: report.completionPattern ? JSON.parse(report.completionPattern) : null,
      behavioralFriction: report.behavioralFriction ? JSON.parse(report.behavioralFriction) : null,
      emotionalTone: report.emotionalTone ? JSON.parse(report.emotionalTone) : null,
      weeklySummary: report.weeklySummary,
      behavioralInsight: report.behavioralInsight,
      suggestedDirection: report.suggestedDirection,
      needsAI: !report.weeklySummary, // اگر summary وجود ندارد، یعنی نیاز به AI دارد
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching weekly report:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت گزارش هفتگی' },
      { status: 500 }
    );
  }
}
