import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPosts() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('\n=== ALL POSTS IN DATABASE ===');
    console.log(`Total posts: ${posts.length}\n`);

    posts.forEach((post, index) => {
      const isTestUser = post.user.phone?.startsWith('98900000000');
      const userLabel = isTestUser ? 'TEST USER' : 'REAL USER';
      console.log(`${index + 1}. ${post.user.name} (${userLabel})`);
      console.log(`   Phone: ${post.user.phone}`);
      console.log(`   Content: ${post.content.substring(0, 50)}...`);
      console.log('');
    });

    const testUserPosts = posts.filter(p => p.user.phone?.startsWith('98900000000'));
    console.log(`\n=== SUMMARY ===`);
    console.log(`Test user posts: ${testUserPosts.length}`);
    console.log(`Real user posts: ${posts.length - testUserPosts.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPosts();
