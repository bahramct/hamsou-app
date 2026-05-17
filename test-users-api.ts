import { PrismaClient } from '@prisma/client';
import { sign } from 'jsonwebtoken';

const db = new PrismaClient();

// Create a test token for user with phone 09355273500
async function createTestToken() {
  const user = await db.user.findFirst({
    where: { phone: '09355273500' }
  });

  if (!user) {
    console.log('User not found!');
    return null;
  }

  const token = sign(
    {
      userId: user.id,
      phone: user.phone
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );

  return { token, userId: user.id };
}

async function testUsersAPI() {
  const auth = await createTestToken();
  if (!auth) return;

  console.log('Testing users API...');
  console.log('User ID:', auth.userId);
  console.log('');

  // Simulate the API query
  const search = '';

  const users = await db.user.findMany({
    where: {
      NOT: {
        id: auth.userId,
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

  console.log(`Found ${users.length} users:`);
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. ${user.name || 'No Name'}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Bio: ${user.bio || 'No bio'}`);
    console.log(`   Followers: ${user._count.followers}`);
    console.log(`   Following: ${user._count.following}`);
    console.log(`   Posts: ${user._count.posts}`);
  });

  await db.$disconnect();
}

testUsersAPI().catch(console.error);
