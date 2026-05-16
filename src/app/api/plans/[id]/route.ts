import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - دریافت جزئیات یک برنامه
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plan = await db.plan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: 'برنامه یافت نشد' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در دریافت برنامه' },
      { status: 500 }
    );
  }
}

// PATCH - ویرایش برنامه
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // بررسی وجود برنامه
    const existingPlan = await db.plan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'برنامه یافت نشد' }, { status: 404 });
    }

    // آماده‌سازی داده‌های آپدیت
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.targetDays !== undefined) updateData.targetDays = body.targetDays;
    if (body.currentDays !== undefined) updateData.currentDays = body.currentDays;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;

    // ویرایش برنامه
    const plan = await db.plan.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در ویرایش برنامه' },
      { status: 500 }
    );
  }
}

// DELETE - حذف برنامه
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // بررسی وجود برنامه
    const existingPlan = await db.plan.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingPlan) {
      return NextResponse.json({ error: 'برنامه یافت نشد' }, { status: 404 });
    }

    // حذف برنامه
    await db.plan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'برنامه با موفقیت حذف شد' });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: error.message || 'خطا در حذف برنامه' },
      { status: 500 }
    );
  }
}
