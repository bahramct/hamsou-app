import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 شروع ایجاد داده‌های تستی...');

  // ایجاد کاربر تست
  const user = await prisma.user.upsert({
    where: { phone: '09123456789' },
    update: {},
    create: {
      phone: '09123456789',
      name: 'کاربر تست',
      notificationTime: '09:00',
      notificationEnabled: true,
      subscriptionPlan: 'free',
      subscriptionStart: new Date(),
    },
  });

  console.log('✅ کاربر تست ایجاد شد:', user.id);

  // محاسبه تاریخ‌های 7 روز گذشته
  const today = new Date();
  const commitments = [];

  for (let i = 7; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // تعهدات نمونه
    const sampleCommitments = [
      'امشب قبل از خواب 10 صفحه کتاب می‌خوانم',
      'صبح ساعت 7 بیدار می‌شوم و ورزش می‌کنم',
      'امروز حداقل 2 لیتر آب می‌خورم',
      'عصر 30 دقیقه قدم می‌زنم',
      'امشب قبل از 11 می‌خوابم',
      'امروز بدون گوشی با خانواده شام می‌خورم',
      'صبح مدیتیشن 5 دقیقه‌ای انجام می‌دهم',
    ];

    const commitment = await prisma.commitment.create({
      data: {
        userId: user.id,
        text: sampleCommitments[i % sampleCommitments.length],
        date: new Date(date.setHours(0, 0, 0, 0)),
      },
    });

    commitments.push(commitment);

    // ایجاد reflection برای هر تعهد (با الگوی واقعی‌تر)
    const completed = Math.random() > 0.3; // 70% احتمال انجام

    const reasons = [
      'خسته بودم و انرژی نداشتم',
      'فراموش کردم',
      'کار اضافه داشتم',
      'حواسم پرت شد',
      'هوا خوب نبود',
      'سرم درد می‌کرد',
      'خیلی مشغول بودم',
    ];

    await prisma.reflection.create({
      data: {
        userId: user.id,
        commitmentId: commitment.id,
        completed,
        reason: !completed ? reasons[Math.floor(Math.random() * reasons.length)] : null,
        reflectedAt: new Date(date.setDate(date.getDate() + 1)),
      },
    });

    console.log(`✅ روز ${8 - i}: تعهد "${commitment.text.substring(0, 20)}..." - ${completed ? 'انجام شد' : 'انجام نشد'}`);
  }

  console.log('\n📊 خلاصه:');
  console.log(`- کاربر: ${user.phone}`);
  console.log(`- تعداد تعهدات: ${commitments.length}`);
  console.log(`- پلن: ${user.subscriptionPlan}`);
  console.log('\n✅ داده‌های تستی با موفقیت ایجاد شدند!');
  console.log('\n🔑 برای ورود:');
  console.log('   شماره: 09123456789');
  console.log('   کد OTP: 1234');
}

main()
  .catch((e) => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
