import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/community/users - دریافت لیست کاربران
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    const users = await db.user.findMany({
      where: {
        NOT: {
          id: user.userId, // خود کاربر رو نشون نده
        },
        OR: search
          ? [
              { name: { contains: search } },
              { bio: { contains: search } },
            ]
          : undefined,
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // بررسی وضعیت فالووینگ برای هر کاربر
    const usersWithFollowStatus = await Promise.all(
      users.map(async (u) => {
        const isFollowing = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: user.userId,
              followingId: u.id,
            },
          },
        });

        return {
          ...u,
          isFollowing: !!isFollowing,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithFollowStatus,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست کاربران' },
      { status: 500 }
    );
  }
}
