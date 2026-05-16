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

// دریافت بازتاب در انتظار (آخرین تعهدی که reflection ندارد)
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

    // دیروز را محاسبه می‌کنیم
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    // پیدا کردن آخرین تعهدی که reflection ندارد
    const pendingCommitment = await db.commitment.findFirst({
      where: {
        userId: decoded.userId,
        date: {
          gte: startOfYesterday,
          lt: endOfYesterday,
        },
        reflection: null,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (!pendingCommitment) {
      return NextResponse.json(null);
    }

    return NextResponse.json(pendingCommitment);
  } catch (error: any) {
    console.error('Error fetching pending reflection:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت بازتاب در انتظار' },
      { status: 500 }
    );
  }
}
