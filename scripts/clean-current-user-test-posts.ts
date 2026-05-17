import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanCurrentUserTestPosts() {
  try {
    console.log('Finding current user test posts...');

    // پست‌هایی که محتوای اونا شبیه samplePosts هستن
    const sampleContents = [
      'امروز روز عالی بود! تمام تعهداتم رو انجام دادم.',
      'بعد از ۳۰ روز تمرین مدیتیشن، حس می‌کنم آرامش بیشتری دارم.',
      'چالش ۳۰ روز ورزش رو شروع کردم. ببینم چی میشه!',
      'کتاب "عادت‌های اتمی" رو خوندم. فوق‌العاده بود!',
      'امروز یاد گرفتم که نه گفتن یه مهارته، نه ضعف.',
      'صبح زود بیدار شدم و قبل از کار، ورزش کردم.',
      'اولین پست من توی این جامعه! خوشحالم اینجام.',
      'روزهای سختی داشتم اما ادامه دادم.',
      'یادم باشه: رشد تدریجی بهتر از رشد ناگهانیه.',
      'چالش خواندن روزانه یک کتاب رو با دوستام شروع کردم.',
    ];

    const posts = await prisma.post.findMany({
      where: {
        content: {
          in: sampleContents,
        },
      },
    });

    console.log(`Found ${posts.length} test posts from current user`);

    // حذف لایک‌های این پست‌ها
    for (const post of posts) {
      await prisma.like.deleteMany({
        where: { postId: post.id },
      });

      // حذف کامنت‌های این پست‌ها
      await prisma.comment.deleteMany({
        where: { postId: post.id },
      });
    }

    // حذف پست‌ها
    const result = await prisma.post.deleteMany({
      where: {
        content: {
          in: sampleContents,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} test posts`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanCurrentUserTestPosts();
