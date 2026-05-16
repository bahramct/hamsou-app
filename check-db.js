import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('=== POSTS ===');
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      userId: true,
      content: true,
      likesCount: true,
      commentsCount: true,
    },
    take: 5,
  });
  console.log(JSON.stringify(posts, null, 2));

  console.log('\n=== LIKES ===');
  const likes = await prisma.like.findMany({
    select: {
      id: true,
      userId: true,
      postId: true,
    },
    take: 5,
  });
  console.log(JSON.stringify(likes, null, 2));

  console.log('\n=== COMMENTS ===');
  const comments = await prisma.comment.findMany({
    select: {
      id: true,
      userId: true,
      postId: true,
      content: true,
    },
    take: 5,
  });
  console.log(JSON.stringify(comments, null, 2));

  console.log('\n=== TOTAL COUNTS ===');
  const postCount = await prisma.post.count();
  const likeCount = await prisma.like.count();
  const commentCount = await prisma.comment.count();
  console.log(`Posts: ${postCount}, Likes: ${likeCount}, Comments: ${commentCount}`);
}

checkDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
