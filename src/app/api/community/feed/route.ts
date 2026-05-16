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

    // لاگ برای دیباگ
    console.log('Feed API Response:', JSON.stringify({
      success: true,
      data: postsWithCounts.map(p => ({
        id: p.id,
        isLiked: p.isLiked,
        _count: p._count,
      })),
    }, null, 2));

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
