import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// دریافت پیام خوش‌آمدگویی شخصی‌سازی شده
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربری الزامی است' },
        { status: 400 }
      );
    }

    // دریافت اطلاعات کاربر و آمار
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        commitments: {
          where: {
            date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
          select: {
            reflection: {
              select: {
                completed: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // محاسبه آمار
    const totalCommitments = user.commitments.length;
    const completedCommitments = user.commitments.filter(
      (c) => c.reflection?.completed
    ).length;
    const completionRate = totalCommitments > 0
      ? Math.round((completedCommitments / totalCommitments) * 100)
      : 0;

    // تولید پیام خوش‌آمدگویی شخصی‌سازی شده
    let welcomeMessage = '';

    if (user.name) {
      welcomeMessage = `سلام ${user.name} عزیز! 👋\n\n`;
    } else {
      welcomeMessage = 'سلام دوست من! 👋\n\n';
    }

    if (totalCommitments === 0) {
      welcomeMessage +=
        'به دستیار هوشمند همسو خوش اومدی! من اینجام تا بهت تو رسیدن به اهدا و تعهداتت کمک کنم.\n\n' +
        'می‌تونی هر سوالی که داری از من بپرسی، یا در مورد پیشرفتت با من صحبت کنی. چطور می‌تونم کمکت کنم؟';
    } else {
      welcomeMessage +=
        `خوش اومدی باز! 🌟\n\n` +
        `در 30 روز گذشته، ${totalCommitments} تعهد ثبت کردی و ${completedCommitments} تاش رو انجام دادی ` +
        `(نرخ موفقیت: ${completionRate}%)${completionRate >= 70 ? ' - آفرین! 🎉' : ''}\n\n` +
        `چطور می‌تونم امروز کمکت کنم؟ می‌تونی در مورد:\n` +
        `- پرسیدن سوالات عمومی\n` +
        `- دریافت تحلیل پیشرفتت\n` +
        `- دریافت پیشنهاد برای اهداف جدید\n` +
        `- راهنمایی برای بهبود\n\n` +
        `با من صحبت کن!`;
    }

    return NextResponse.json({
      success: true,
      welcomeMessage,
      stats: {
        totalCommitments,
        completedCommitments,
        completionRate,
      },
    });
  } catch (error) {
    console.error('Error in chat welcome API:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پیام خوش‌آمدگویی' },
      { status: 500 }
    );
  }
}
