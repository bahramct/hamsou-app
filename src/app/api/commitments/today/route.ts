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

// دریافت تعهد امروز
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

    // امروز را بر اساس timezone کاربر محاسبه می‌کنیم
    // فعلاً از UTC استفاده می‌کنیم
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // دریافت تعهد امروز
    const commitment = await db.commitment.findFirst({
      where: {
        userId: decoded.userId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        reflection: true,
        plan: true,
      },
    });

    if (!commitment) {
      return NextResponse.json(null);
    }

    return NextResponse.json(commitment);
  } catch (error: any) {
    console.error('Error fetching today commitment:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت تعهد امروز' },
      { status: 500 }
    );
  }
}
