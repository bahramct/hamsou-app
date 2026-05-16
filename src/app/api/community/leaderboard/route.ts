import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/community/leaderboard - دریافت لیدربورد
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'weekly'; // weekly, monthly, all_time
    const limit = parseInt(searchParams.get('limit') || '50');

    // محاسبه تاریخ شروع
    let startDate: Date | null = null;
    const now = new Date();

    if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7); // 7 روز قبل
    } else if (period === 'monthly') {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1); // 1 ماه قبل
    }

    // محاسبه آمار کاربران
    const users = await db.user.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
    });

    // محاسبه نمره هر کاربر بر اساس معیارهای مختلف
    const userScores = await Promise.all(
      users.map(async (user) => {
        // تعداد پست‌ها در بازه زمانی
        let postsInPeriod = 0;
        if (startDate) {
          postsInPeriod = await db.post.count({
            where: {
              userId: user.id,
              createdAt: { gte: startDate },
            },
          });
        } else {
          postsInPeriod = user._count.posts;
        }

        // تعداد لایک‌های دریافتی
        const userPostIds = await db.post.findMany({
          where: { userId: user.id },
          select: { id: true },
        });
        const postIds = userPostIds.map(p => p.id);

        let likesInPeriod = 0;
        if (postIds.length > 0) {
          if (startDate) {
            likesInPeriod = await db.like.count({
              where: {
                postId: { in: postIds },
                createdAt: { gte: startDate },
              },
            });
          } else {
            likesInPeriod = await db.like.count({
              where: { postId: { in: postIds } },
            });
          }
        }

        // تعداد کامنت‌های دریافتی
        let commentsInPeriod = 0;
        if (postIds.length > 0) {
          if (startDate) {
            commentsInPeriod = await db.comment.count({
              where: {
                postId: { in: postIds },
                createdAt: { gte: startDate },
              },
            });
          } else {
            commentsInPeriod = await db.comment.count({
              where: { postId: { in: postIds } },
            });
          }
        }

        // محاسبه نمره کلی
        const score = postsInPeriod * 10 + likesInPeriod * 2 + commentsInPeriod * 3 + user._count.followers * 1;

        return {
          id: user.id,
          name: user.name,
          profileImage: user.profileImage,
          followersCount: user._count.followers,
          postsCount: postsInPeriod,
          likesReceived: likesInPeriod,
          commentsReceived: commentsInPeriod,
          score,
          rank: 0, // بعداً محاسبه می‌شود
        };
      })
    );

    // مرتب‌سازی بر اساس نمره و محاسبه رتبه
    userScores.sort((a, b) => b.score - a.score);

    // افزودن رتبه
    userScores.forEach((user, index) => {
      user.rank = index + 1;
    });

    // پیدا کردن رتبه کاربر جاری
    const currentUserRank = userScores.find(u => u.id === user.id)?.rank || null;

    // محدود کردن نتایج
    const leaderboard = userScores.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: leaderboard,
      currentUserRank,
      period,
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیدربورد' },
      { status: 500 }
    );
  }
}
