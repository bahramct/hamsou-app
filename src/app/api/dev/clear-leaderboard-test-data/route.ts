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

    console.log('Found test users:', testUsers.length);

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
          challenges: 0,
          challengeParticipants: 0,
        },
      });
    }

    const testUserIds = testUsers.map((u) => u.id);
    console.log('Test user IDs:', testUserIds);

    // شمارش و حذف شرکت‌کنندگان چالش‌های کاربران تستی
    const challengeParticipantsAsUser = await db.challengeParticipant.findMany({
      where: {
        userId: { in: testUserIds },
      },
    });
    const challengeParticipantsAsUserCount = challengeParticipantsAsUser.length;
    console.log('Deleting challenge participants (as user):', challengeParticipantsAsUserCount);

    for (const cp of challengeParticipantsAsUser) {
      await freshDb.challengeParticipant.delete({
        where: { id: cp.id },
      });
    }

    // شمارش و حذف چالش‌های کاربران تستی
    const challenges = await db.challenge.findMany({
      where: {
        userId: { in: testUserIds },
      },
    });
    const challengesCount = challenges.length;
    console.log('Deleting challenges:', challengesCount);

    // حذف شرکت‌کنندگان چالش‌های تستی
    for (const challenge of challenges) {
      const participants = await db.challengeParticipant.findMany({
        where: { challengeId: challenge.id },
      });
      console.log(`Challenge ${challenge.id} has ${participants.length} participants`);

      for (const p of participants) {
        await freshDb.challengeParticipant.delete({
          where: { id: p.id },
        });
      }
    }

    // حذف خود چالش‌ها
    for (const challenge of challenges) {
      await freshDb.challenge.delete({
        where: { id: challenge.id },
      });
    }

    // شمارش و حذف کامنت‌های کاربران تستی
    const comments = await db.comment.findMany({
      where: {
        userId: { in: testUserIds },
      },
    });
    const commentsCount = comments.length;
    console.log('Deleting comments:', commentsCount);

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
    console.log('Deleting likes:', likesCount);

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
    console.log('Deleting posts:', postsCount);

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
    console.log('Deleting follows:', followsCount);
    console.log('Follow details:', followsAsFollower.map(f => ({ followerId: f.followerId, followingId: f.followingId })));

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
    console.log('Deleting users:', usersCount);

    for (const user of testUsers) {
      await freshDb.user.delete({
        where: { id: user.id },
      });
    }

    console.log('Deletion completed successfully');

    return NextResponse.json({
      success: true,
      message: `${usersCount} کاربر تستی، ${postsCount} پست، ${likesCount} لایک، ${commentsCount} کامنت، ${followsCount} فالووینگ و ${challengesCount} چالش حذف شد`,
      deleted: {
        users: usersCount,
        posts: postsCount,
        likes: likesCount,
        comments: commentsCount,
        follows: followsCount,
        challenges: challengesCount,
        challengeParticipants: challengeParticipantsAsUserCount,
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
