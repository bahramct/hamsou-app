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

// دریافت تاریخچه تعهدات
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
    const limit = parseInt(searchParams.get('limit') || '30');

    // دریافت تاریخچه تعهدات
    const commitments = await db.commitment.findMany({
      where: {
        userId: decoded.userId,
      },
      include: {
        reflection: true,
        plan: true,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(commitments);
  } catch (error: any) {
    console.error('Error fetching commitments:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تاریخچه تعهدات' },
      { status: 500 }
    );
  }
}

// ثبت تعهد جدید
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
    const { text, planId } = body;

    // اعتبارسنجی
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'متن تعهد الزامی است' },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'متن تعهد نمی‌تواند خالی باشد' },
        { status: 400 }
      );
    }

    if (text.length > 180) {
      return NextResponse.json(
        { error: 'تعهد نباید بیشتر از 180 کاراکتر باشد' },
        { status: 400 }
      );
    }

    // اگر planId ارسال شده، بررسی کنم که برنامه متعلق به کاربر است
    if (planId) {
      const plan = await db.plan.findFirst({
        where: {
          id: planId,
          userId: decoded.userId,
        },
      });

      if (!plan) {
        return NextResponse.json(
          { error: 'برنامه یافت نشد' },
          { status: 404 }
        );
      }
    }

    // چک کردن اینکه آیا کاربر امروز تعهد ثبت کرده است یا نه
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const existingCommitment = await db.commitment.findFirst({
      where: {
        userId: decoded.userId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    if (existingCommitment) {
      return NextResponse.json(
        { error: 'شما امروز قبلاً تعهد ثبت کرده‌اید' },
        { status: 400 }
      );
    }

    // ایجاد تعهد جدید
    const commitment = await db.commitment.create({
      data: {
        userId: decoded.userId,
        text: text.trim(),
        date: now,
        planId: planId || null,
      },
    });

    return NextResponse.json({
      success: true,
      commitment,
    });
  } catch (error: any) {
    console.error('Error creating commitment:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت تعهد' },
      { status: 500 }
    );
  }
}
