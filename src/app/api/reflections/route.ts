import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createPlanCompletedNotification, createPlanProgressNotification } from '@/lib/notifications';
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

// ثبت بازتاب جدید
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { commitmentId, completed, reason } = body;

    // اعتبارسنجی
    if (!commitmentId) {
      return NextResponse.json(
        { error: 'شناسه تعهد الزامی است' },
        { status: 400 }
      );
    }

    if (typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'وضعیت انجام تعهد باید مشخص شود' },
        { status: 400 }
      );
    }

    // اگر انجام نشده، دلیل باید وارد شود
    if (!completed && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        { error: 'دلیل عدم انجام تعهد الزامی است' },
        { status: 400 }
      );
    }

    if (reason && reason.length > 180) {
      return NextResponse.json(
        { error: 'دلیل نباید بیشتر از 180 کاراکتر باشد' },
        { status: 400 }
      );
    }

    // بررسی وجود تعهد و متعلق بودن به کاربر
    const commitment = await db.commitment.findFirst({
      where: {
        id: commitmentId,
        userId: decoded.userId,
      },
      include: {
        plan: true,
      },
    });

    if (!commitment) {
      return NextResponse.json(
        { error: 'تعهد یافت نشد' },
        { status: 404 }
      );
    }

    // چک کردن اینکه قبلاً reflection ثبت شده است یا نه
    const existingReflection = await db.reflection.findUnique({
      where: { commitmentId },
    });

    if (existingReflection) {
      return NextResponse.json(
        { error: 'برای این تعهد قبلاً بازتاب ثبت شده است' },
        { status: 400 }
      );
    }

    // ایجاد reflection
    const reflection = await db.reflection.create({
      data: {
        commitmentId,
        completed,
        reason: !completed ? reason?.trim() : null,
      },
      include: {
        commitment: {
          include: {
            plan: true,
          },
        },
      },
    });

    // اگر تعهد انجام شده و به برنامه‌ای متصل است، پیشرفت برنامه را افزایش دهید
    let planUpdated = null;
    if (completed && commitment.planId && commitment.plan) {
      const updatedPlan = await db.plan.update({
        where: { id: commitment.planId },
        data: {
          currentDays: commitment.plan.currentDays + 1,
          // اگر به هدف رسید، وضعیت را به completed تغییر دهید
          ...(commitment.plan.targetDays &&
            (commitment.plan.currentDays + 1) >= commitment.plan.targetDays
            ? { status: 'completed' }
            : {}),
        },
      });
      planUpdated = updatedPlan;

      // ایجاد نوتیفیکیشن
      if (updatedPlan.status === 'completed') {
        await createPlanCompletedNotification(decoded.userId, commitment.plan.title);
      } else if (commitment.plan.targetDays) {
        // اگر پیشرفت به درصد خاصی رسید، نوتیفیکیشن پیشرفت ایجاد کنید
        const percentage = (updatedPlan.currentDays / commitment.plan.targetDays) * 100;
        const milestones = [25, 50, 75];
        if (milestones.some(m => percentage >= m && percentage - (1 / commitment.plan.targetDays * 100) < m)) {
          await createPlanProgressNotification(
            decoded.userId,
            commitment.plan.title,
            updatedPlan.currentDays,
            commitment.plan.targetDays
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      reflection,
      planUpdated,
    });
  } catch (error: any) {
    console.error('Error creating reflection:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت بازتاب' },
      { status: 500 }
    );
  }
}
