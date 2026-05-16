import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const userData = await db.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStart: true,
        subscriptionEnd: true,
        createdAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات کاربر' },
      { status: 500 }
    );
  }
}
