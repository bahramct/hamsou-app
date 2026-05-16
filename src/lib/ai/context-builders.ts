/**
 * Context Builders برای AI
 * 
 * این فایل شامل توابعی است که Context (داده‌های کاربر) را برای استفاده در AI
 * جمع‌آوری و فرمت می‌کنند.
 */

import { db } from '@/lib/db';
import { startOfDay, subDays, subWeeks, subMonths, isSameDay, format } from 'date-fns';

// ============================================================
// Types
// ============================================================

export interface ChatContext {
  userName: string;
  stats: {
    totalCommitments: number;
    completionRate: number;
    currentStreak: number;
    totalReflections: number;
    activePlans: number;
  };
}

export interface AnalyticsContext {
  commitments: any[];
  reflections: any[];
  plans: any[];
  streak: number;
  moodTrends: {
    date: string;
    mood: string;
    overallRating: number | null;
  }[];
  dateRange: {
    start: Date;
    end: Date;
  };
  statistics: {
    totalCommitments: number;
    completedCommitments: number;
    completionRate: number;
    totalReflections: number;
    avgMood: number | null;
    moodDistribution: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    dayOfWeekBreakdown: Record<string, number>;
  };
}

export interface CommitmentContext {
  recentCommitments: any[];
  categories: string[];
  completionRates: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  patterns: {
    successfulDays: string[];
    challengingDays: string[];
    peakTimes: string[];
  };
}

export interface SentimentContext {
  reflections: {
    date: string;
    mood: string;
    achievements: string | null;
    challenges: string | null;
    learnings: string | null;
  }[];
  moodDistribution: Record<string, number>;
  keywords: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * دریافت آمار پایه کاربر
 */
async function getUserBasicStats(userId: string) {
  // Reflection ها از طریق Commitment به دست می‌آیند
  const userCommitments = await db.commitment.findMany({
    where: { userId },
    select: { id: true, reflection: { select: { id: true } } },
  });
  const totalReflections = userCommitments.filter(c => c.reflection).length;

  // محاسبه تعهدات تکمیل شده
  const totalCommitments = userCommitments.length;
  const completedCommitments = userCommitments.filter(c =>
    c.reflection?.completed
  ).length;

  const activePlans = await db.plan.count({ where: { userId, status: 'active' } });

  const completionRate = totalCommitments > 0
    ? Math.round((completedCommitments / totalCommitments) * 100)
    : 0;

  const streak = await calculateStreak(userId);

  return {
    totalCommitments,
    completedCommitments,
    completionRate,
    totalReflections,
    activePlans,
    currentStreak: streak,
  };
}

/**
 * محاسبه استریک (روزهای متوالی فعالیت)
 */
async function calculateStreak(userId: string): Promise<number> {
  const commitments = await db.commitment.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    select: { date: true },
    take: 365, // حداکثر ۳۶۵ روز
  });

  if (commitments.length === 0) return 0;

  // یافتن روزهای منحصر به فرد
  const uniqueDates = Array.from(
    new Set(commitments.map(c => format(startOfDay(new Date(c.date)), 'yyyy-MM-dd')))
  ).sort().reverse();

  let streak = 0;
  let currentDate = startOfDay(new Date());

  for (const dateStr of uniqueDates) {
    const date = startOfDay(new Date(dateStr));
    
    // بررسی تفاوت روزها
    const diffDays = Math.floor(
      (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    // اگر تفاوت بیشتر از ۱ روز بود، استریک شکست
    if (diffDays > 1) {
      break;
    }

    // اگر تفاوت ۰ یا ۱ روز بود، ادامه بده
    streak++;
    currentDate = date;
  }

  return streak;
}

/**
 * دریافت تعهدات در بازه زمانی
 */
async function getCommitmentsInRange(userId: string, startDate: Date, endDate: Date) {
  return await db.commitment.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'desc' },
  });
}

/**
 * دریافت بازتاب‌ها در بازه زمانی
 */
async function getReflectionsInRange(userId: string, startDate: Date, endDate: Date) {
  const commitments = await db.commitment.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      reflection: {
        isNot: null,
      },
    },
    include: {
      reflection: true,
    },
    orderBy: { date: 'desc' },
  });

  return commitments
    .filter(c => c.reflection)
    .map(c => ({
      ...c.reflection,
      date: c.date,
      commitmentId: c.id,
    }));
}

/**
 * دریافت برنامه‌های کاربر
 */
async function getPlans(userId: string) {
  return await db.plan.findMany({
    where: { userId },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * دریافت تعهدات اخیر
 */
async function getRecentCommitments(userId: string, days: number = 30) {
  const startDate = subDays(new Date(), days);
  return await getCommitmentsInRange(userId, startDate, new Date());
}

/**
 * دریافت دسته‌بندی‌های تعهدات
 */
async function getCommitmentCategories(userId: string): Promise<string[]> {
  const commitments = await db.commitment.findMany({
    where: { userId },
    select: { text: true },
    distinct: ['text'],
  });

  // این باید بر اساس category باشد، اما فعلاً از متن استخراج می‌کنیم
  // TODO: بعد از اضافه شدن category به مدل تعهدات، اصلاح شود
  const categories = new Set(['کاری', 'شخصی', 'سلامتی', 'یادگیری']);
  return Array.from(categories);
}

/**
 * محاسبه نرخ تکمیل بر اساس دسته‌بندی
 */
async function getCategoryCompletionRates(userId: string): Promise<Record<string, number>> {
  // TODO: بعد از اضافه شدن category به مدل تعهدات، پیاده‌سازی شود
  // فعلاً داده‌های نمونه برمی‌گردانیم
  return {
    کاری: 85,
    شخصی: 70,
    سلامتی: 90,
    یادگیری: 60,
  };
}

/**
 * شناسایی دسته‌بندی‌های قوی
 */
function getStrengthCategories(completionRates: Record<string, number>): string[] {
  const threshold = 75;
  return Object.entries(completionRates)
    .filter(([_, rate]) => rate >= threshold)
    .map(([category, _]) => category);
}

/**
 * شناسایی دسته‌بندی‌های ضعیف
 */
function getWeaknessCategories(completionRates: Record<string, number>): string[] {
  const threshold = 60;
  return Object.entries(completionRates)
    .filter(([_, rate]) => rate < threshold)
    .map(([category, _]) => category);
}

/**
 * دریافت توزیع mood
 */
function getMoodDistribution(reflections: any[]): Record<string, number> {
  const distribution: Record<string, number> = {
    happy: 0,
    neutral: 0,
    sad: 0,
    stressed: 0,
    motivated: 0,
  };

  reflections.forEach(r => {
    if (r.mood && distribution[r.mood] !== undefined) {
      distribution[r.mood]++;
    }
  });

  return distribution;
}

/**
 * دریافت روندهای mood
 */
async function getMoodTrends(userId: string, dateRange: [Date, Date]) {
  const [startDate, endDate] = dateRange;
  const reflections = await getReflectionsInRange(userId, startDate, endDate);

  return reflections.map(r => ({
    date: format(new Date(r.date), 'yyyy-MM-dd'),
    mood: r.mood || 'neutral',
    overallRating: r.overallRating || null,
  }));
}

/**
 * محاسبه میانگین mood
 */
function calculateAvgMood(moodDistribution: Record<string, number>): number | null {
  const total = Object.values(moodDistribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const moodValues = {
    happy: 5,
    motivated: 4,
    neutral: 3,
    stressed: 2,
    sad: 1,
  };

  let sum = 0;
  let count = 0;

  Object.entries(moodDistribution).forEach(([mood, value]) => {
    if (value > 0 && moodValues[mood]) {
      sum += moodValues[mood] * value;
      count += value;
    }
  });

  return count > 0 ? Math.round((sum / count) * 10) / 10 : null;
}

// ============================================================
// Main Context Builders
// ============================================================

/**
 * Context برای چت‌بات (سبک و ساده)
 */
export async function buildChatContext(userId: string): Promise<ChatContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
    },
  });

  const stats = await getUserBasicStats(userId);

  return {
    userName: user?.name || 'کاربر',
    stats: {
      totalCommitments: stats.totalCommitments,
      completionRate: stats.completionRate,
      currentStreak: stats.currentStreak,
      totalReflections: stats.totalReflections,
      activePlans: stats.activePlans,
    },
  };
}

/**
 * Context برای تحلیل پیشرفت (کامل و جزئی)
 */
export async function buildAnalyticsContext(
  userId: string,
  dateRange: [Date, Date]
): Promise<AnalyticsContext> {
  const [startDate, endDate] = dateRange;
  const [commitments, reflections, plans, moodTrends] = await Promise.all([
    getCommitmentsInRange(userId, startDate, endDate),
    getReflectionsInRange(userId, startDate, endDate),
    getPlans(userId),
    getMoodTrends(userId, dateRange),
  ]);

  const streak = await calculateStreak(userId);
  const moodDistribution = getMoodDistribution(reflections);
  const avgMood = calculateAvgMood(moodDistribution);

  // محاسبه آمار
  const totalCommitments = commitments.length;
  const completedCommitments = commitments.filter(c => c.status === 'completed').length;
  const completionRate = totalCommitments > 0 
    ? Math.round((completedCommitments / totalCommitments) * 100)
    : 0;

  // توزیع دسته‌بندی‌ها (فعلاً نمونه)
  const categoryBreakdown = {
    کاری: 35,
    شخصی: 25,
    سلامتی: 25,
    یادگیری: 15,
  };

  // توزیع روزهای هفته
  const dayOfWeekBreakdown: Record<string, number> = {
    شنبه: 0,
    یکشنبه: 0,
    دوشنبه: 0,
    سه‌شنبه: 0,
    چهارشنبه: 0,
    پنج‌شنبه: 0,
    جمعه: 0,
  };

  commitments.forEach(c => {
    const day = format(new Date(c.date), 'EEEE', { locale: 'fa-IR' });
    if (dayOfWeekBreakdown[day] !== undefined) {
      dayOfWeekBreakdown[day]++;
    }
  });

  return {
    commitments,
    reflections,
    plans,
    streak,
    moodTrends,
    dateRange: { start: startDate, end: endDate },
    statistics: {
      totalCommitments,
      completedCommitments,
      completionRate,
      totalReflections: reflections.length,
      avgMood,
      moodDistribution,
      categoryBreakdown,
      dayOfWeekBreakdown,
    },
  };
}

/**
 * Context برای پیشنهاد تعهدات
 */
export async function buildCommitmentContext(userId: string): Promise<CommitmentContext> {
  const recentCommitments = await getRecentCommitments(userId, 30);
  const categories = await getCommitmentCategories(userId);
  const completionRates = await getCategoryCompletionRates(userId);

  const strengths = getStrengthCategories(completionRates);
  const weaknesses = getWeaknessCategories(completionRates);

  // شناسایی الگوها
  const commitmentsByDate = new Map<string, number>();
  recentCommitments.forEach(c => {
    const date = format(new Date(c.date), 'yyyy-MM-dd');
    commitmentsByDate.set(date, (commitmentsByDate.get(date) || 0) + 1);
  });

  const successfulDays = Array.from(commitmentsByDate.entries())
    .filter(([_, count]) => count >= 5)
    .map(([date, _]) => date);

  const challengingDays = Array.from(commitmentsByDate.entries())
    .filter(([_, count]) => count <= 2)
    .map(([date, _]) => date);

  // TODO: Peak times را بعداً با ساعت دقیق‌تر پیاده‌سازی کن

  return {
    recentCommitments,
    categories,
    completionRates,
    strengths,
    weaknesses,
    patterns: {
      successfulDays,
      challengingDays,
      peakTimes: [],
    },
  };
}

/**
 * Context برای تحلیل احساسی
 */
export async function buildSentimentContext(
  userId: string,
  dateRange: [Date, Date]
): Promise<SentimentContext> {
  const [startDate, endDate] = dateRange;
  const reflections = await getReflectionsInRange(userId, startDate, endDate);

  const moodDistribution = getMoodDistribution(reflections);

  // استخراج کلمات کلیدی (ساده)
  const keywords = {
    positive: [] as string[],
    negative: [] as string[],
    neutral: [] as string[],
  };

  reflections.forEach(r => {
    if (r.achievements) {
      keywords.positive.push('موفقیت', 'پیشرفت');
    }
    if (r.challenges) {
      keywords.negative.push('چالش', 'مشکل');
    }
    if (r.learnings) {
      keywords.neutral.push('یادگیری', 'تجربه');
    }
  });

  return {
    reflections: reflections.map(r => ({
      date: format(new Date(r.date), 'yyyy-MM-dd'),
      mood: r.mood || 'neutral',
      achievements: r.achievements,
      challenges: r.challenges,
      learnings: r.learnings,
    })),
    moodDistribution,
    keywords: {
      positive: [...new Set(keywords.positive)],
      negative: [...new Set(keywords.negative)],
      neutral: [...new Set(keywords.neutral)],
    },
  };
}

/**
 * Context برای گزارش هفتگی
 */
export async function buildWeeklyReportContext(userId: string, weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return await buildAnalyticsContext(userId, [weekStart, weekEnd]);
}

/**
 * Context برای گزارش ماهانه
 */
export async function buildMonthlyReportContext(userId: string, monthStart: Date) {
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);

  return await buildAnalyticsContext(userId, [monthStart, monthEnd]);
}
