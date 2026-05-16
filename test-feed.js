import { PrismaClient } from '@prisma/client';
import { verifyToken } from './src/lib/auth.js';

const prisma = new PrismaClient();

// Mock request object
const mockRequest = {
  headers: {
    get: (name) => {
      if (name === 'authorization') {
        // You need to put your actual token here
        return 'Bearer YOUR_TOKEN_HERE';
      }
      return null;
    },
  },
  nextUrl: {
    searchParams: new URLSearchParams(),
  },
};

async function testFeed() {
  try {
    // First, let's check the database directly
    console.log('=== DATABASE STATE ===');
    const posts = await prisma.post.findMany({
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      take: 3,
    });

    console.log('Posts from database:');
    posts.forEach(post => {
      console.log(`- Post ${post.id}:`);
      console.log(`  likesCount: ${post.likesCount}`);
      console.log(`  commentsCount: ${post.commentsCount}`);
      console.log(`  _count.likes: ${post._count.likes}`);
      console.log(`  _count.comments: ${post._count.comments}`);
    });

    // Check actual likes and comments
    console.log('\n=== ACTUAL COUNTS ===');
    for (const post of posts) {
      const actualLikes = await prisma.like.count({ where: { postId: post.id } });
      const actualComments = await prisma.comment.count({ where: { postId: post.id } });
      console.log(`Post ${post.id.slice(0, 8)}...:`);
      console.log(`  Actual likes: ${actualLikes}`);
      console.log(`  Actual comments: ${actualComments}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFeed();
