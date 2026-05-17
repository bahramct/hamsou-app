import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

/**
 * DEV ONLY API
 * تغییر پلن کاربر برای تست در محیط توسعه
 */

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// تأیید توکن
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Environment check - only work in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'This endpoint is only available in development mode',
      },
      { status: 404 }
    );
  }

  // Additional safety check - disable if explicitly disabled
  if (process.env.DISABLE_DEV_TOOLS === 'true') {
    return NextResponse.json(
      {
        error: 'Dev tools are disabled',
      },
      { status: 404 }
    );
  }

  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { plan } = body;

    // Validate plan
    const validPlans = ['FREE', 'PLUS', 'PRO'];
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json(
        {
          error: 'پلن نامعتبر است',
          validPlans,
        },
        { status: 400 }
      );
    }

    // Update user's subscription plan in database
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: { subscriptionPlan: plan },
      select: {
        id: true,
        phone: true,
        subscriptionPlan: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `پلن با موفقیت به ${plan === 'FREE' ? 'رایگان' : plan === 'PLUS' ? 'پلاس' : 'پرو'} تغییر کرد`,
    });
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      {
        error: 'خطا در تغییر پلن',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
