import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkDuplicateUsers() {
  console.log('Checking for duplicate users...\n');

  // Get all users with phone 09355273500
  const users = await db.user.findMany({
    where: {
      phone: '09355273500'
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${users.length} user(s) with phone 09355273500:`);
  users.forEach((user, index) => {
    console.log(`\nUser ${index + 1}:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Phone: ${user.phone}`);
    console.log(`  Created At: ${user.createdAt}`);
  });

  // Check all test users (phones starting with 98900000000)
  const allTestUsers = await db.user.findMany({
    where: {
      phone: { startsWith: '98900000000' }
    },
    orderBy: { phone: 'asc' }
  });

  console.log(`\n\nTotal test users (phones starting with 98900000000): ${allTestUsers.length}`);
  allTestUsers.forEach(user => {
    console.log(`  ${user.name} - ${user.phone} (${user.id})`);
  });

  // Check all users in the system
  const allUsers = await db.user.findMany({
    select: {
      id: true,
      name: true,
      phone: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n\nTotal users in system: ${allUsers.length}`);
  console.log('\nAll users:');
  allUsers.forEach(user => {
    console.log(`  ${user.name} - ${user.phone} (${user.id.substring(0, 8)}...)`);
  });

  await db.$disconnect();
}

checkDuplicateUsers().catch(console.error);
