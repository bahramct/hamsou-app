import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkAllUsers() {
  console.log('Checking ALL users in the database...\n');

  const allUsers = await db.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`Total users: ${allUsers.length}\n`);

  // Group by name to find duplicates
  const byName: Record<string, typeof allUsers> = {};
  allUsers.forEach(user => {
    const name = user.name || 'null';
    if (!byName[name]) {
      byName[name] = [];
    }
    byName[name].push(user);
  });

  console.log('Users grouped by name:');
  Object.entries(byName).forEach(([name, users]) => {
    console.log(`\n"${name}": ${users.length} user(s)`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id.substring(0, 12)}... | Phone: ${user.phone} | Posts: ${user._count.posts} | Followers: ${user._count.followers}`);
    });
  });

  // Check for exact phone duplicates
  const phoneCounts: Record<string, number> = {};
  allUsers.forEach(user => {
    phoneCounts[user.phone] = (phoneCounts[user.phone] || 0) + 1;
  });

  const duplicatePhones = Object.entries(phoneCounts).filter(([_, count]) => count > 1);
  if (duplicatePhones.length > 0) {
    console.log('\n\nDUPLICATE PHONES FOUND:');
    duplicatePhones.forEach(([phone, count]) => {
      console.log(`  ${phone}: ${count} users`);
    });
  } else {
    console.log('\n\nNo duplicate phone numbers found.');
  }

  await db.$disconnect();
}

checkAllUsers().catch(console.error);
