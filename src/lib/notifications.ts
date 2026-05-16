import { db } from '@/lib/db';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'hamsou-internal-secret';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}

/**
 * ایجاد یک نوتیفیکیشن برای کاربر (سمت سرور - بدون احراز هویت)
 * این تابع در API routes سمت سرور استفاده می‌شود
 */
export async function sendNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, actionUrl, actionLabel, metadata } = params;

  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
        actionLabel,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * ایجاد یک نوتیفیکیشن برای کاربر (نام مستعار برای سازگاری)
 */
export async function createNotification(params: CreateNotificationParams) {
  return sendNotification(params);
}

/**
 * نوتیفیکیشن یادآوری تعهد روزانه
 */
export async function createCommitmentReminderNotification(userId: string) {
  return createNotification({
    userId,
    type: 'commitment_reminder',
    title: 'یادآوری تعهد روزانه',
    message: 'امروز هنوز تعهدی ثبت نکرده‌اید. تعهد خود را بنویسید!',
    actionUrl: '/',
    actionLabel: 'ثبت تعهد',
  });
}

/**
 * نوتیفیکیشن یادآوری بازتاب
 */
export async function createReflectionReminderNotification(userId: string) {
  return createNotification({
    userId,
    type: 'reflection_reminder',
    title: 'یادآوری بازتاب',
    message: 'امروز بازتاب خود را ثبت کرده‌اید؟',
    actionUrl: '/',
    actionLabel: 'ثبت بازتاب',
  });
}

/**
 * نوتیفیکیشن تکمیل برنامه
 */
export async function createPlanCompletedNotification(userId: string, planTitle: string) {
  return createNotification({
    userId,
    type: 'plan_completed',
    title: '🎉 تبریک!',
    message: `برنامه "${planTitle}" با موفقیت تکمیل شد!`,
    actionUrl: '/my-plans',
    actionLabel: 'مشاهده برنامه',
    metadata: { planTitle },
  });
}

/**
 * نوتیفیکیشن گزارش هفتگی آماده است
 */
export async function createWeeklyReportNotification(userId: string) {
  return createNotification({
    userId,
    type: 'weekly_report',
    title: 'گزارش هفتگی شما آماده است',
    message: 'گزارش هفتگی شما با تحلیل‌های AI آماده مشاهده است',
    actionUrl: '/reports',
    actionLabel: 'مشاهده گزارش',
  });
}

/**
 * نوتیفیکیشن موفقیت (Achievement)
 */
export async function createAchievementNotification(
  userId: string,
  achievementTitle: string,
  achievementDescription: string
) {
  return createNotification({
    userId,
    type: 'achievement',
    title: '🏆 موفقیت جدید!',
    message: `${achievementTitle}: ${achievementDescription}`,
    metadata: { achievementTitle, achievementDescription },
  });
}

/**
 * نوتیفیکیشن پیشرفت برنامه
 */
export async function createPlanProgressNotification(
  userId: string,
  planTitle: string,
  currentDays: number,
  targetDays: number
) {
  const percentage = Math.round((currentDays / targetDays) * 100);

  return createNotification({
    userId,
    type: 'plan_progress',
    title: 'پیشرفت برنامه',
    message: `برنامه "${planTitle}" ${percentage}% پیشرفت دارد`,
    actionUrl: '/my-plans',
    actionLabel: 'مشاهده برنامه',
    metadata: { planTitle, currentDays, targetDays, percentage },
  });
}
