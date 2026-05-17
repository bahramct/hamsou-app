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

// دریافت آمار کاربر
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

    // دریافت کل تعهدات
    const totalCommitments = await db.commitment.count({
      where: { userId: decoded.userId },
    });

    // دریافت تعهدات انجام شده
    const completedCommitments = await db.reflection.count({
      where: {
        commitment: {
          userId: decoded.userId,
        },
        completed: true,
      },
    });

    // محاسبه Streak (روزهای متوالی)
    const commitments = await db.commitment.findMany({
      where: { userId: decoded.userId },
      orderBy: { date: 'desc' },
      select: { date: true, reflection: true },
      take: 365, // حداکثر یک سال
    });

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const commitment of commitments) {
      const commitmentDate = new Date(commitment.date);
      commitmentDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - commitmentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // اگر روز متوالی است
      if (diffDays === streak) {
        // اگر بازتاب انجام شده، streak را افزایش می‌دهیم
        if (commitment.reflection && commitment.reflection.completed) {
          streak++;
          currentDate = commitmentDate;
        } else {
          // اگر بازتاب انجام نشده، streak را قطع می‌کنیم
          break;
        }
      } else if (diffDays > streak) {
        // روز متوالی نیست
        break;
      }
    }

    // دریافت برنامه‌های فعال
    const activePlans = await db.plan.count({
      where: {
        userId: decoded.userId,
        status: 'active',
      },
    });

    // دریافت برنامه‌های تکمیل شده
    const completedPlans = await db.plan.count({
      where: {
        userId: decoded.userId,
        status: 'completed',
      },
    });

    return NextResponse.json({
      totalCommitments,
      completedCommitments,
      streak,
      activePlans,
      completedPlans,
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آمار' },
      { status: 500 }
    );
  }
}
