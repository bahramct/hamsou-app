import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function cleanupOldTestUsers() {
  console.log('Cleaning up old test users...\n');

  // Define old test user phone numbers
  const oldTestPhoneNumbers = [
    '09987654321',
    '09123456789',
  ];

  // Find old test users
  const oldTestUsers = await db.user.findMany({
    where: {
      phone: {
        in: oldTestPhoneNumbers,
      },
    },
  });

  if (oldTestUsers.length === 0) {
    console.log('No old test users found.');
    return;
  }

  console.log(`Found ${oldTestUsers.length} old test users:`);
  oldTestUsers.forEach(u => {
    console.log(`  ${u.name || 'No Name'} | ${u.phone} | ${u.id}`);
  });

  const oldTestUserIds = oldTestUsers.map((u) => u.id);

  // Delete likes by old test users
  console.log('\nDeleting likes...');
  const likes = await db.like.findMany({
    where: { userId: { in: oldTestUserIds } },
  });
  console.log(`Found ${likes.length} likes to delete`);

  for (const like of likes) {
    await db.like.delete({ where: { id: like.id } });
  }

  // Delete comments by old test users
  console.log('\nDeleting comments...');
  const comments = await db.comment.findMany({
    where: { userId: { in: oldTestUserIds } },
  });
  console.log(`Found ${comments.length} comments to delete`);

  for (const comment of comments) {
    await db.comment.delete({ where: { id: comment.id } });
  }

  // Delete challenge participants for old test users
  console.log('\nDeleting challenge participants...');
  const participants = await db.challengeParticipant.findMany({
    where: { userId: { in: oldTestUserIds } },
  });
  console.log(`Found ${participants.length} challenge participants to delete`);

  for (const participant of participants) {
    await db.challengeParticipant.delete({ where: { id: participant.id } });
  }

  // Delete challenges created by old test users
  console.log('\nDeleting challenges...');
  const challenges = await db.challenge.findMany({
    where: { creatorId: { in: oldTestUserIds } },
  });
  console.log(`Found ${challenges.length} challenges to delete`);

  for (const challenge of challenges) {
    // Delete all participants of this challenge
    const allParticipants = await db.challengeParticipant.findMany({
      where: { challengeId: challenge.id },
    });
    for (const p of allParticipants) {
      await db.challengeParticipant.delete({ where: { id: p.id } });
    }
    // Delete the challenge
    await db.challenge.delete({ where: { id: challenge.id } });
  }

  // Delete posts by old test users
  console.log('\nDeleting posts...');
  const posts = await db.post.findMany({
    where: { userId: { in: oldTestUserIds } },
  });
  console.log(`Found ${posts.length} posts to delete`);

  for (const post of posts) {
    await db.post.delete({ where: { id: post.id } });
  }

  // Delete follows involving old test users
  console.log('\nDeleting follows...');
  const follows = await db.follow.findMany({
    where: {
      OR: [
        { followerId: { in: oldTestUserIds } },
        { followingId: { in: oldTestUserIds } },
      ],
    },
  });
  console.log(`Found ${follows.length} follows to delete`);

  for (const follow of follows) {
    await db.follow.delete({
      where: {
        followerId_followingId: {
          followerId: follow.followerId,
          followingId: follow.followingId,
        },
      },
    });
  }

  // Delete the old test users themselves
  console.log('\nDeleting old test users...');
  for (const user of oldTestUsers) {
    await db.user.delete({ where: { id: user.id } });
    console.log(`Deleted user: ${user.name || 'No Name'} (${user.phone})`);
  }

  console.log('\n✅ Cleanup completed successfully!');
  console.log(`Deleted: ${oldTestUsers.length} users, ${posts.length} posts, ${likes.length} likes, ${comments.length} comments, ${follows.length} follows, ${challenges.length} challenges`);

  await db.$disconnect();
}

cleanupOldTestUsers().catch(console.error);
