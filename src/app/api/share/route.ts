import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// تأیید توکن
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

// ایجاد لینک اشتراک‌گذاری
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
    const { achievementType, data, title, description, expiresAt, maxViews } = body;

    // Validation
    if (!achievementType || !['commitment', 'streak', 'plan_completed'].includes(achievementType)) {
      return NextResponse.json(
        { error: 'نوع دستاورد نامعتبر است' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'داده‌های دستاورد الزامی است' },
        { status: 400 }
      );
    }

    // تولید توکن یکتا
    const shareToken = uuidv4();

    // ایجاد اشتراک‌گذاری
    const sharedAchievement = await db.sharedAchievement.create({
      data: {
        userId: decoded.userId,
        shareToken,
        achievementType,
        data: JSON.stringify(data),
        title: title || null,
        description: description || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxViews: maxViews || null,
      },
    });

    // ایجاد URL اشتراک‌گذاری
    const shareUrl = `/share/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken: sharedAchievement.shareToken,
      shareUrl,
    });
  } catch (error: any) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'خطا در ایجاد لینک اشتراک‌گذاری' },
      { status: 500 }
    );
  }
}
