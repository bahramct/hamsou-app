import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - دریافت لیست برنامه‌ها
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // دریافت پارامترهای query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, paused, completed, archived
    const type = searchParams.get('type'); // daily, weekly, monthly, custom

    // ساخت query بر اساس فیلترها
    const where: any = { userId: user.id };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // دریافت برنامه‌ها
    const plans = await db.plan.findMany({
      where,
      orderBy: [
        { priority: 'desc' }, // اولویت بالا اول
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت برنامه‌ها' },
      { status: 500 }
    );
  }
}

// POST - ایجاد برنامه جدید
export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // اعتبارسنجی
    const { title, description, type, category, startDate, endDate, targetDays, priority } = body;

    if (!title || !type || !startDate) {
      return NextResponse.json(
        { error: 'عنوان، نوع و تاریخ شروع الزامی است' },
        { status: 400 }
      );
    }

    // ایجاد برنامه جدید
    const plan = await db.plan.create({
      data: {
        userId: user.id,
        title,
        description,
        type,
        category: category || 'personal',
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        targetDays,
        priority: priority || 'medium',
        status: 'active',
        currentDays: 0,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ایجاد برنامه' },
      { status: 500 }
    );
  }
}
