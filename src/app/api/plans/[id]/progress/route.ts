import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - افزایش پیشرفت برنامه
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { increment = 1 } = body;

    // بررسی وجود برنامه
    const plan = await db.plan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'برنامه یافت نشد' }, { status: 404 });
    }

    // افزایش currentDays
    const updatedPlan = await db.plan.update({
      where: { id: params.id },
      data: {
        currentDays: plan.currentDays + increment,
      },
    });

    // بررسی تکمیل برنامه
    let message = 'پیشرفت با موفقیت ثبت شد';
    if (updatedPlan.targetDays && updatedPlan.currentDays >= updatedPlan.targetDays) {
      // برنامه کامل شده
      await db.plan.update({
        where: { id: params.id },
        data: { status: 'completed' },
      });
      message = 'تبریک! برنامه شما با موفقیت تکمیل شد! 🎉';
    }

    return NextResponse.json({
      plan: updatedPlan,
      message,
      progressPercentage: updatedPlan.targetDays
        ? Math.round((updatedPlan.currentDays / updatedPlan.targetDays) * 100)
        : null,
    });
  } catch (error: any) {
    console.error('Error updating plan progress:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در به‌روزرسانی پیشرفت' },
      { status: 500 }
    );
  }
}
