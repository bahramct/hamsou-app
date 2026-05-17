import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkAllData() {
  console.log('Checking all data in the database...\n');

  // Check users
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`=== USERS (${users.length}) ===`);
  users.forEach(u => {
    console.log(`  ${u.name || 'No Name'} | ${u.phone} | ${u.id.substring(0, 12)}...`);
  });

  // Check posts
  const posts = await db.post.findMany({
    select: {
      id: true,
      userId: true,
      content: true,
      postType: true,
      visibility: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n=== POSTS (${posts.length}) ===`);
  posts.forEach(p => {
    const user = users.find(u => u.id === p.userId);
    console.log(`  ${p.id.substring(0, 12)}... | ${user?.name || 'Unknown'} | ${p.content.substring(0, 50)}... | ${p.visibility}`);
  });

  // Check likes
  const likes = await db.like.findMany({
    select: {
      id: true,
      likerId: true,
      postId: true,
      createdAt: true
    }
  });

  console.log(`\n=== LIKES (${likes.length}) ===`);
  likes.forEach(l => {
    const liker = users.find(u => u.id === l.likerId);
    const post = posts.find(p => p.id === l.postId);
    console.log(`  ${l.id.substring(0, 12)}... | ${liker?.name || 'Unknown'} -> Post ${l.postId.substring(0, 12)}...`);
  });

  // Check comments
  const comments = await db.comment.findMany({
    select: {
      id: true,
      authorId: true,
      postId: true,
      content: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n=== COMMENTS (${comments.length}) ===`);
  comments.forEach(c => {
    const author = users.find(u => u.id === c.authorId);
    console.log(`  ${c.id.substring(0, 12)}... | ${author?.name || 'Unknown'} | ${c.content.substring(0, 30)}...`);
  });

  // Check challenges
  const challenges = await db.challenge.findMany({
    select: {
      id: true,
      creatorId: true,
      title: true,
      isPublic: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n=== CHALLENGES (${challenges.length}) ===`);
  challenges.forEach(c => {
    const creator = users.find(u => u.id === c.creatorId);
    console.log(`  ${c.id.substring(0, 12)}... | ${creator?.name || 'Unknown'} | ${c.title} | Public: ${c.isPublic}`);
  });

  // Check challenge participants
  const participants = await db.challengeParticipant.findMany({
    select: {
      id: true,
      challengeId: true,
      userId: true,
      createdAt: true
    }
  });

  console.log(`\n=== CHALLENGE PARTICIPANTS (${participants.length}) ===`);
  participants.forEach(p => {
    const user = users.find(u => u.id === p.userId);
    const challenge = challenges.find(c => c.id === p.challengeId);
    console.log(`  ${user?.name || 'Unknown'} -> ${challenge?.title || 'Unknown'}`);
  });

  // Check follows
  const follows = await db.follow.findMany({
    select: {
      id: true,
      followerId: true,
      followingId: true,
      createdAt: true
    }
  });

  console.log(`\n=== FOLLOWS (${follows.length}) ===`);
  follows.forEach(f => {
    const follower = users.find(u => u.id === f.followerId);
    const following = users.find(u => u.id === f.followingId);
    console.log(`  ${follower?.name || 'Unknown'} -> ${following?.name || 'Unknown'}`);
  });

  await db.$disconnect();
}

checkAllData().catch(console.error);
