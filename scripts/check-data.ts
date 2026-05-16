import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 بررسی داده‌های دیتابیس...\n');

  // دریافت کاربر
  const user = await prisma.user.findUnique({
    where: { phone: '09123456789' },
    include: {
      commitments: {
        include: {
          reflection: true,
        },
        orderBy: {
          date: 'desc',
        },
      },
    },
  });

  if (!user) {
    console.log('❌ کاربر یافت نشد');
    return;
  }

  console.log(`👤 کاربر: ${user.phone}`);
  console.log(`📅 پلن: ${user.subscriptionPlan}`);
  console.log(`📝 تعداد تعهدات: ${user.commitments.length}\n`);

  // آمار
  const completed = user.commitments.filter(c => c.reflection?.completed).length;
  const notCompleted = user.commitments.filter(c => c.reflection && !c.reflection.completed).length;
  const noReflection = user.commitments.filter(c => !c.reflection).length;

  console.log('📈 آمار:');
  console.log(`   ✅ انجام شده: ${completed}`);
  console.log(`   ❌ انجام نشده: ${notCompleted}`);
  console.log(`   ⏳ بدون بازتاب: ${noReflection}`);
  console.log(`   📊 نرخ موفقیت: ${((completed / user.commitments.length) * 100).toFixed(1)}%\n`);

  // لیست تعهدات
  console.log('📋 لیست تعهدات:');
  user.commitments.forEach((commitment, index) => {
    const date = new Date(commitment.date).toLocaleDateString('fa-IR');
    const status = commitment.reflection
      ? (commitment.reflection.completed ? '✅' : '❌')
      : '⏳';

    console.log(`   ${index + 1}. ${status} ${date} - ${commitment.text.substring(0, 40)}...`);

    if (commitment.reflection && !commitment.reflection.completed) {
      console.log(`      💬 دلیل: ${commitment.reflection.reason}`);
    }
  });
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
