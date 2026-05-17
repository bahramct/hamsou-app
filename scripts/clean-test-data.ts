import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  try {
    console.log('Finding test users...');
    const testUsers = await prisma.user.findMany({
      where: {
        phone: {
          startsWith: '98900000000',
        },
      },
    });

    if (testUsers.length === 0) {
      console.log('No test users found.');
      return;
    }

    console.log(`Found ${testUsers.length} test users`);

    const testUserIds = testUsers.map((u) => u.id);

    // Delete comments from test users
    console.log('Deleting comments...');
    await prisma.comment.deleteMany({
      where: {
        userId: { in: testUserIds },
      },
    });

    // Delete likes from test users
    console.log('Deleting likes...');
    await prisma.like.deleteMany({
      where: {
        userId: { in: testUserIds },
      },
    });

    // Get challenge IDs created by test users
    const challenges = await prisma.challenge.findMany({
      where: {
        creatorId: { in: testUserIds },
      },
      select: { id: true },
    });

    const challengeIds = challenges.map((c) => c.id);

    // Delete challenge participants
    console.log('Deleting challenge participants...');
    await prisma.challengeParticipant.deleteMany({
      where: {
        OR: [
          { userId: { in: testUserIds } },
          { challengeId: { in: challengeIds } },
        ],
      },
    });

    // Delete challenges
    console.log('Deleting challenges...');
    await prisma.challenge.deleteMany({
      where: {
        creatorId: { in: testUserIds },
      },
    });

    // Delete posts
    console.log('Deleting posts...');
    await prisma.post.deleteMany({
      where: {
        userId: { in: testUserIds },
      },
    });

    // Delete follows
    console.log('Deleting follows...');
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: testUserIds } },
          { followingId: { in: testUserIds } },
        ],
      },
    });

    // Delete users
    console.log('Deleting users...');
    await prisma.user.deleteMany({
      where: {
        id: { in: testUserIds },
      },
    });

    console.log('✅ All test data cleaned successfully!');
  } catch (error) {
    console.error('Error cleaning test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();
