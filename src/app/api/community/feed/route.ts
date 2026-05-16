import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db, getFreshDb } from '@/lib/db';
import { z } from 'zod';

// GET /api/community/feed - دریافت فید جامعه
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // achievement, reflection, update, challenge
    const followingOnly = searchParams.get('following') === 'true';

    const skip = (page - 1) * limit;

    // فیلترها
    const where: any = {
      visibility: 'public',
    };

    if (type) {
      where.postType = type;
    }

    if (followingOnly) {
      const following = await db.follow.findMany({
        where: { followerId: user.userId },
        select: { followingId: true },
      });

      // اگر کاربر کسی را دنبال نکرده باشد، آرایه خالی برگردان
      if (following.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      where.userId = { in: following.map(f => f.followingId) };
    }

    // دریافت پست‌ها
    const freshDb = getFreshDb();
    const posts = await freshDb.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        likes: {
          select: { userId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // دریافت تعداد لایک‌ها و کامنت‌ها برای هر پست
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const [likesCount, commentsCount] = await Promise.all([
          db.like.count({ where: { postId: post.id } }),
          db.comment.count({ where: { postId: post.id } }),
        ]);

        return {
          ...post,
          isLiked: post.likes.some(like => like.userId === user.userId),
          _count: {
            likes: likesCount,
            comments: commentsCount,
          },
          likes: undefined, // حذف آرایه لایک‌ها
        };
      })
    );

    // دریافت تعداد کل
    const total = await freshDb.post.count({ where });

    return NextResponse.json({
      success: true,
      data: postsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching community feed:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت فید جامعه' },
      { status: 500 }
    );
  }
}
