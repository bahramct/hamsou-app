import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dev/check-leaderboard-test-data - بررسی وجود داده‌های تستی جامعه
export async function GET(request: NextRequest) {
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
