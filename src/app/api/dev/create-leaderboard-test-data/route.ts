import { NextRequest, NextResponse } from 'next/server';
import { db, getFreshDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// POST /api/dev/create-leaderboard-test-data - ایجاد داده‌های تستی لیدربورد
export async function POST(request: NextRequest) {
  try {
    const freshDb = getFreshDb();

    // لیست کاربران نمونه
    const testUsers = [
      { name: 'علی احمدی', phone: '989000000001', bio: 'علاقه‌مند به توسعه شخصی و رشد' },
      { name: 'مریم رضایی', phone: '989000000002', bio: 'در حال تمرین عادت‌های روزانه' },
      { name: 'محمد کریمی', phone: '989000000003', bio: 'مربی توسعه فردی' },
      { name: 'سارا محمدی', phone: '989000000004', bio: 'مسافر و ماجراجو' },
      { name: 'رضا حسینی', phone: '989000000005', bio: 'نویسنده و پادکستر' },
    ];

    // ایجاد کاربران نمونه
    const createdUsers = [];
    for (const userData of testUsers) {
      const existingUser = await db.user.findUnique({
        where: { phone: userData.phone },
      });

      let user;
      if (!existingUser) {
        user = await freshDb.user.create({
          data: {
            id: `user_${uuidv4()}`,
            phone: userData.phone,
            name: userData.name,
            bio: userData.bio,
          },
        });
        console.log(`Created user: ${user.name}`);
      } else {
        user = existingUser;
        console.log(`User already exists: ${user.name}`);
      }
      createdUsers.push(user);
    }

    // دریافت کاربر جاری (اولین کاربر موجود)
    const currentUser = await db.user.findFirst();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'هیچ کاربری وجود ندارد' },
        { status: 400 }
      );
    }

    // ایجاد رابطه فالووینگ بین کاربران
    for (let i = 0; i < createdUsers.length; i++) {
      for (let j = i + 1; j < createdUsers.length; j++) {
        // ایجاد رابطه فالووینگ دوطرفه
        const existingFollow1 = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: createdUsers[i].id,
              followingId: createdUsers[j].id,
            },
          },
        });

        if (!existingFollow1) {
          await freshDb.follow.create({
            data: {
              followerId: createdUsers[i].id,
              followingId: createdUsers[j].id,
            },
          });
        }

        const existingFollow2 = await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: createdUsers[j].id,
              followingId: createdUsers[i].id,
            },
          },
        });

        if (!existingFollow2) {
          await freshDb.follow.create({
            data: {
              followerId: createdUsers[j].id,
              followingId: createdUsers[i].id,
            },
          });
        }

        // کاربر جاری همه را فالو کند
        if (currentUser.id !== createdUsers[i].id) {
          const existingFollowCurrent1 = await db.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUser.id,
                followingId: createdUsers[i].id,
              },
            },
          });
          if (!existingFollowCurrent1) {
            await freshDb.follow.create({
              data: {
                followerId: currentUser.id,
                followingId: createdUsers[i].id,
              },
            });
          }
        }
      }
    }

    // ایجاد پست‌های نمونه
    const samplePosts = [
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

    const allUsers = [currentUser, ...createdUsers];
    const postsPerUser = Math.ceil(samplePosts.length / allUsers.length);

    for (let userIndex = 0; userIndex < allUsers.length; userIndex++) {
      const user = allUsers[userIndex];
      const startIndex = userIndex * postsPerUser;
      const userPosts = samplePosts.slice(startIndex, startIndex + postsPerUser);

      for (let i = 0; i < userPosts.length; i++) {
        const postContent = userPosts[i];
        const postDate = new Date();
        postDate.setDate(postDate.getDate() - i * 2); // پست‌ها با فاصله زمانی

        await freshDb.post.create({
          data: {
            userId: user.id,
            content: postContent,
            postType: 'achievement',
            createdAt: postDate,
          },
        });
      }
    }

    // ایجاد لایک‌ها و کامنت‌ها
    const allPosts = await db.post.findMany();
    for (const post of allPosts) {
      // هر پست را 2 تا 4 کاربر دیگر لایک کنند
      const likers = allUsers.filter(u => u.id !== post.userId);
      const numLikes = Math.floor(Math.random() * 3) + 2; // 2-4 لایک

      for (let i = 0; i < numLikes && i < likers.length; i++) {
        const existingLike = await db.like.findUnique({
          where: {
            userId_postId: {
              userId: likers[i].id,
              postId: post.id,
            },
          },
        });

        if (!existingLike) {
          await freshDb.like.create({
            data: {
              userId: likers[i].id,
              postId: post.id,
            },
          });
        }
      }

      // هر پست را 1 تا 2 کاربر کامنت بگذارند
      const commenters = likers.slice(0, 2);
      const comments = [
        'عالی بود! ادامه بده 🎉',
        'منم همین تجربه رو داشتم.',
        'موفق باشی دوست عزیز!',
        'الهام‌بخش بود.',
        'بی‌صبرانه منتظر پست بعدی هستم.',
      ];

      for (let i = 0; i < commenters.length; i++) {
        const existingComment = await db.comment.findFirst({
          where: {
            userId: commenters[i].id,
            postId: post.id,
          },
        });

        if (!existingComment) {
          const commentContent = comments[Math.floor(Math.random() * comments.length)];
          await freshDb.comment.create({
            data: {
              userId: commenters[i].id,
              postId: post.id,
              content: commentContent,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'داده‌های تستی لیدربورد ایجاد شد',
      stats: {
        usersCreated: createdUsers.length,
        totalUsers: allUsers.length,
        totalPosts: allPosts.length,
      },
    });
  } catch (error: any) {
    console.error('Error creating leaderboard test data:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در ایجاد داده‌های تستی' },
      { status: 500 }
    );
  }
}
