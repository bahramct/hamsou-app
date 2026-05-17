import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkDataCorruption() {
  console.log('Checking for data corruption...\n');

  // Get all users
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`=== TOTAL USERS: ${users.length} ===\n`);
  users.forEach(u => {
    console.log(`  ${u.name || 'No Name'} | ${u.phone} | ID: ${u.id.substring(0, 12)}...`);
  });

  // Check for users with phone 09355273500 (بهرام برازنده)
  const behramUsers = users.filter(u => u.phone === '09355273500');
  console.log(`\n=== Users with phone 09355273500: ${behramUsers.length} ===`);
  behramUsers.forEach(u => {
    console.log(`  ${u.name} | ${u.phone} | ID: ${u.id}`);
  });

  // Check posts
  const posts = await db.post.findMany({
    select: {
      id: true,
      userId: true,
      content: true,
      visibility: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n=== TOTAL POSTS: ${posts.length} ===`);
  posts.forEach(p => {
    const user = users.find(u => u.id === p.userId);
    console.log(`  Post by: ${user?.name || 'Unknown'} (${user?.phone || 'Unknown'})`);
    console.log(`    Content: ${p.content.substring(0, 50)}...`);
    console.log(`    Visibility: ${p.visibility}`);
    console.log(`    ID: ${p.id}`);
    console.log('');
  });

  // Check if there are posts by test users
  const testUserIds = users
    .filter(u => u.phone.startsWith('98900000000'))
    .map(u => u.id);

  const postsByTestUsers = posts.filter(p => testUserIds.includes(p.userId));
  console.log(`=== Posts by test users: ${postsByTestUsers.length} ===`);
  if (postsByTestUsers.length > 0) {
    postsByTestUsers.forEach(p => {
      const user = users.find(u => u.id === p.userId);
      console.log(`  ${user?.name} | ${p.id}`);
    });
  }

  // Check if current user (بهرام برازنده) has posts
  const behramUser = behramUsers[0];
  if (behramUser) {
    const behramPosts = posts.filter(p => p.userId === behramUser.id);
    console.log(`\n=== Posts by بهرام برازنده: ${behramPosts.length} ===`);
    behramPosts.forEach(p => {
      console.log(`  ${p.content.substring(0, 50)}... | ${p.visibility} | ${p.id}`);
    });

    // Check if بهرام برازنده has likes
    const likes = await db.like.findMany({
      where: { userId: behramUser.id },
      select: { id: true, postId: true }
    });
    console.log(`\n=== Likes by بهرام برازنده: ${likes.length} ===`);

    // Check if بهرام برازنده has comments
    const comments = await db.comment.findMany({
      where: { userId: behramUser.id },
      select: { id: true, postId: true, content: true }
    });
    console.log(`\n=== Comments by بهرام برازنده: ${comments.length} ===`);

    // Check if بهرام برازende has follows
    const followsAsFollower = await db.follow.findMany({
      where: { followerId: behramUser.id },
      select: { id: true, followingId: true }
    });
    const followsAsFollowing = await db.follow.findMany({
      where: { followingId: behramUser.id },
      select: { id: true, followerId: true }
    });
    console.log(`\n=== Follow relationships for بهرام برازنده ===`);
    console.log(`  Following: ${followsAsFollower.length} users`);
    console.log(`  Followers: ${followsAsFollowing.length} users`);
  }

  // Check all other users visible in Users tab (excluding بهرام برازنده)
  if (behramUser) {
    const otherUsers = users.filter(u => u.id !== behramUser.id);
    console.log(`\n=== Users that should appear in Users tab (excluding بهرام برازنده): ${otherUsers.length} ===`);

    for (const u of otherUsers) {
      const userPosts = posts.filter(p => p.userId === u.id).length;
      const userLikes = await db.like.count({ where: { userId: u.id }});
      const userComments = await db.comment.count({ where: { userId: u.id }});
      const userFollowers = await db.follow.count({ where: { followingId: u.id }});
      const userFollowing = await db.follow.count({ where: { followerId: u.id }});

      console.log(`  ${u.name || 'No Name'} | ${u.phone}`);
      console.log(`    Posts: ${userPosts} | Likes: ${userLikes} | Comments: ${userComments}`);
      console.log(`    Followers: ${userFollowers} | Following: ${userFollowing}`);
    }
  }

  await db.$disconnect();
}

checkDataCorruption().catch(console.error);
