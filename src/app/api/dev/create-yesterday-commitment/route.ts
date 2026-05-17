import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

/**
 * DEV ONLY API
 * Create or delete a commitment for yesterday without reflection
 * This is for testing the yesterday reflection feature
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

export async function DELETE(request: NextRequest) {
  // Environment check - only work in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'This endpoint is only available in development mode',
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

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Find and delete the commitment for yesterday
    const existingCommitment = await db.commitment.findFirst({
      where: {
        userId: decoded.userId,
        date: yesterday,
      },
    });

    if (!existingCommitment) {
      return NextResponse.json({
        success: false,
        message: 'تعهدی برای دیروز پیدا نشد',
      });
    }

    // Delete the commitment
    await db.commitment.delete({
      where: { id: existingCommitment.id },
    });

    return NextResponse.json({
      success: true,
      message: 'تعهد دیروز با موفقیت حذف شد',
    });
  } catch (error: any) {
    console.error('Error deleting yesterday commitment:', error);
    return NextResponse.json(
      {
        error: 'خطا در حذف تعهد دیروز',
        details: error.message,
      },
      { status: 500 }
    );
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

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Check if a commitment already exists for yesterday
    const existingCommitment = await db.commitment.findFirst({
      where: {
        userId: decoded.userId,
        date: yesterday,
      },
    });

    if (existingCommitment) {
      return NextResponse.json({
        success: false,
        message: 'برای دیروز قبلاً تعهد ثبت شده است',
        commitment: existingCommitment,
      });
    }

    // Create commitment for yesterday
    const commitment = await db.commitment.create({
      data: {
        userId: decoded.userId,
        text: 'دیروز قول داده بودم که روزم رو خوب شروع کنم و با انرژی کامل به کارم برسم.',
        date: yesterday,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تعهد دیروز با موفقیت ایجاد شد (بدون بازتاب)',
      commitment,
    });
  } catch (error: any) {
    console.error('Error creating yesterday commitment:', error);
    return NextResponse.json(
      {
        error: 'خطا در ایجاد تعهد دیروز',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
