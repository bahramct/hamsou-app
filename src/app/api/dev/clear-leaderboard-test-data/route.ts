import { NextRequest, NextResponse } from 'next/server';
import { db, getFreshDb } from '@/lib/db';

// DELETE /api/dev/clear-leaderboard-test-data - حذف داده‌های تستی جامعه
export async function DELETE(request: NextRequest) {
  try {
    const freshDb = getFreshDb();

    // پیدا کردن کاربران تستی (با شماره تلفن‌های تستی)
    const testUsers = await db.user.findMany({
      where: {
        phone: {
          startsWith: '98900000000', // شماره‌های تستی
        },
      },
    });

    if (testUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'داده تستی برای پاک کردن وجود ندارد',
        deleted: {
          users: 0,
          posts: 0,
          likes: 0,
          comments: 0,
          follows: 0,
        },
      });
    }

    const testUserIds = testUsers.map((u) => u.id);

    // شمارش و حذف کامنت‌های کاربران تستی
    const comments = await db.comment.findMany({
      where: {
        userId: { in: testUserIds },
      },
    });
    const commentsCount = comments.length;
    for (const comment of comments) {
      await freshDb.comment.delete({
        where: { id: comment.id },
      });
    }

    // شمارش و حذف لایک‌های کاربران تستی
    const likes = await db.like.findMany({
      where: {
        userId: { in: testUserIds },
      },
    });
    const likesCount = likes.length;
    for (const like of likes) {
      await freshDb.like.delete({
        where: { id: like.id },
      });
    }

    // شمارش و حذف پست‌های کاربران تستی
    const posts = await db.post.findMany({
      where: {
        userId: { in: testUserIds },
      },
    });
    const postsCount = posts.length;
    for (const post of posts) {
      await freshDb.post.delete({
        where: { id: post.id },
      });
    }

    // شمارش و حذف فالووینگ‌های مرتبط با کاربران تستی
    const followsAsFollower = await db.follow.findMany({
      where: {
        OR: [
          { followerId: { in: testUserIds } },
          { followingId: { in: testUserIds } },
        ],
      },
    });
    const followsCount = followsAsFollower.length;
    for (const follow of followsAsFollower) {
      await freshDb.follow.delete({
        where: {
          followerId_followingId: {
            followerId: follow.followerId,
            followingId: follow.followingId,
          },
        },
      });
    }

    // حذف کاربران تستی
    const usersCount = testUsers.length;
    for (const user of testUsers) {
      await freshDb.user.delete({
        where: { id: user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${usersCount} کاربر تستی، ${postsCount} پست، ${likesCount} لایک، ${commentsCount} کامنت و ${followsCount} فالووینگ حذف شد`,
      deleted: {
        users: usersCount,
        posts: postsCount,
        likes: likesCount,
        comments: commentsCount,
        follows: followsCount,
      },
    });
  } catch (error: any) {
    console.error('Error clearing leaderboard test data:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در حذف داده‌های تستی' },
      { status: 500 }
    );
  }
}
