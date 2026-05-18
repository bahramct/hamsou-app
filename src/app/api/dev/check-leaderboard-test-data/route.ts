import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dev/check-leaderboard-test-data - بررسی وجود داده‌های تستی جامعه
export async function GET(request: NextRequest) {
  // Environment check - only work in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 404 }
    );
  }

  // Additional safety check - disable if explicitly disabled
  if (process.env.DISABLE_DEV_TOOLS === 'true') {
    return NextResponse.json(
      { error: 'Dev tools are disabled' },
      { status: 404 }
    );
  }

  try {
    // پیدا کردن کاربران تستی (با شماره تلفن‌های تستی)
    const testUsersCount = await db.user.count({
      where: {
        phone: {
          startsWith: '98900000000', // شماره‌های تستی
        },
      },
    });

    return NextResponse.json({
      hasTestData: testUsersCount > 0,
      testUsersCount,
    });
  } catch (error: any) {
    console.error('Error checking leaderboard test data:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در بررسی داده‌های تستی' },
      { status: 500 }
    );
  }
}
