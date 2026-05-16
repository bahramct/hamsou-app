import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCounts() {
  try {
    console.log('=== CHECKING POSTS AND COUNTS ===\n');

    const posts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        likesCount: true,
        commentsCount: true,
      },
      take: 5,
    });

    console.log(`Found ${posts.length} posts:\n`);

    for (const post of posts) {
      const actualLikes = await prisma.like.count({ where: { postId: post.id } });
      const actualComments = await prisma.comment.count({ where: { postId: post.id } });

      console.log(`Post: "${post.content.slice(0, 30)}..."`);
      console.log(`  DB likesCount: ${post.likesCount}`);
      console.log(`  DB commentsCount: ${post.commentsCount}`);
      console.log(`  Actual likes: ${actualLikes}`);
      console.log(`  Actual comments: ${actualComments}`);

      const likesMatch = post.likesCount === actualLikes;
      const commentsMatch = post.commentsCount === actualComments;

      if (!likesMatch) console.log('  ❌ likesCount mismatch!');
      if (!commentsMatch) console.log('  ❌ commentsCount mismatch!');
      if (likesMatch && commentsMatch) console.log('  ✅ All counts match');
      console.log();
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCounts();
