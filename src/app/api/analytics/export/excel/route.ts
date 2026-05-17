import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { toPersianNumber } from '@/lib/utils/persian';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      console.error('Excel Export: User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Excel Export: User authenticated', { userId: user.userId, phone: user.phone });

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    // بررسی پلن کاربر
    const userData = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        subscriptionPlan: true,
      },
    });

    console.log('Excel Export: User data', userData);

    if (!userData) {
      console.error('Excel Export: User not found in database', user.userId);
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // بررسی پلن کاربر
    const userPlan = (userData.subscriptionPlan || 'free').toLowerCase();
    if (userPlan !== 'pro' && userPlan !== 'plus') {
      console.error('Excel Export: User plan not eligible', userPlan);
      return NextResponse.json({ error: 'این قابلیت فقط برای پلن‌های پرو و پلاس فعال است' }, { status: 403 });
    }

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
        startDate = new Date(0);
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    // دریافت تعهدات
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
        plan: true,
      },
      orderBy: {
        date: 'desc',
      },
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
      orderBy: {
        reflectedAt: 'desc',
      },
    });

    // دریافت برنامه‌ها
    const plans = await db.plan.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // ساخت داده‌های Excel
    const excelData = {
      title: 'گزارش تحلیلی همسو - داده‌های خام',
      date: new Date().toLocaleDateString('fa-IR'),
      sheets: {
        commitments: {
          name: 'تعهدات',
          headers: ['تاریخ', 'متن تعهد', 'وضعیت', 'برنامه', 'نوع برنامه'],
          data: commitments.map((c) => [
            c.date,
            c.text,
            c.reflection?.completed ? 'انجام شده' : c.reflection ? 'انجام نشده' : 'بدون بازتاب',
            c.plan?.title || '-',
            c.plan?.type || '-',
          ]),
        },
        reflections: {
          name: 'بازتاب‌ها',
          headers: ['تاریخ', 'وضعیت', 'دلیل عدم انجام', 'متن تعهد'],
          data: reflections.map((r) => [
            new Date(r.reflectedAt).toLocaleDateString('fa-IR'),
            r.completed ? 'انجام شده' : 'انجام نشده',
            r.reason || '-',
            r.commitment?.text || '-',
          ]),
        },
        plans: {
          name: 'برنامه‌ها',
          headers: ['عنوان', 'نوع', 'دسته‌بندی', 'وضعیت', 'تاریخ شروع', 'تاریخ پایان', 'روزهای هدف', 'روزهای فعلی', 'پیشرفت'],
          data: plans.map((p) => [
            p.title,
            p.type,
            p.category,
            p.status === 'active' ? 'فعال' : p.status === 'completed' ? 'تکمیل شده' : 'متوقف',
            new Date(p.startDate).toLocaleDateString('fa-IR'),
            new Date(p.endDate).toLocaleDateString('fa-IR'),
            toPersianNumber(p.targetDays),
            toPersianNumber(p.currentDays),
            toPersianNumber(Math.round((p.currentDays / p.targetDays) * 100)) + '%',
          ]),
        },
      },
    };

    return NextResponse.json(excelData);
  } catch (error) {
    console.error('Error generating Excel export data:', error);
    return NextResponse.json(
      { error: 'خطا در تولید داده‌های اکسل' },
      { status: 500 }
    );
  }
}
