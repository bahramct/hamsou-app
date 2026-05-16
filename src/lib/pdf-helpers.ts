/**
 * PDF Helper Functions for Persian/Arabic Support
 * Clean, reusable functions for PDF generation
 */

/**
 * Convert English numbers to Persian
 */
export function toPersianNumber(num: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

/**
 * Convert English numbers in string to Persian
 */
export function toPersianString(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

/**
 * Persian month names
 */
export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * Get current Persian date
 */
export function getPersianDate(): string {
  const now = new Date();
  return now.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Range labels in Persian
 */
export const RANGE_LABELS: Record<string, string> = {
  '7d': '۷ روز اخیر',
  '30d': '۳۰ روز اخیر',
  '90d': '۹۰ روز اخیر',
  'all': 'همه زمان',
};

/**
 * Category labels in Persian
 */
export const CATEGORY_LABELS: Record<string, string> = {
  'work': 'کاری',
  'personal': 'شخصی',
  'health': 'سلامتی',
  'learning': 'یادگیری',
  'other': 'سایر',
};

/**
 * Mood labels in Persian
 */
export const MOOD_LABELS: Record<string, string> = {
  'happy': 'خوشحال',
  'neutral': 'عادی',
  'sad': 'غمگین',
  'stressed': 'استرس‌زده',
  'motivated': 'انگیزه‌دار',
};

/**
 * Summary statistics data structure
 */
export interface SummaryStats {
  totalCommitments: number;
  completedCommitments: number;
  completionRate: number;
  totalReflections: number;
  totalPlans: number;
  completedPlans: number;
  currentStreak: number;
}

/**
 * Weekly trend data structure
 */
export interface WeeklyTrend {
  week: string;
  total: number;
  completed: number;
  rate: number;
}

/**
 * Category stats data structure
 */
export interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  rate: number;
}

/**
 * User data structure
 */
export interface UserData {
  name: string;
  phone: string;
  subscriptionPlan: string;
}

/**
 * Get summary statistics rows
 */
export function getSummaryRows(stats: SummaryStats): Array<[string, string]> {
  return [
    ['کل تعهدات', toPersianNumber(stats.totalCommitments)],
    ['تکمیل شده', toPersianNumber(stats.completedCommitments)],
    ['نرخ تکمیل', `${toPersianNumber(Math.round(stats.completionRate))}٪`],
    ['کل بازتاب‌ها', toPersianNumber(stats.totalReflections)],
    ['کل برنامه‌ها', toPersianNumber(stats.totalPlans)],
    ['برنامه‌های تکمیل', toPersianNumber(stats.completedPlans)],
    ['روزهای متوالی', `${toPersianNumber(stats.currentStreak)} روز`],
  ];
}

/**
 * Get weekly trend rows
 */
export function getWeeklyTrendRows(trends: WeeklyTrend[]): Array<[string, string, string, string]> {
  return trends.map((trend) => [
    trend.week,
    toPersianNumber(trend.total),
    toPersianNumber(trend.completed),
    `${toPersianNumber(trend.rate)}٪`,
  ]);
}

/**
 * Get category stats rows
 */
export function getCategoryStatsRows(stats: CategoryStats[]): Array<[string, string, string, string]> {
  return stats.map((stat) => [
    CATEGORY_LABELS[stat.category] || stat.category,
    toPersianNumber(stat.total),
    toPersianNumber(stat.completed),
    `${toPersianNumber(stat.rate)}٪`,
  ]);
}

/**
 * Format file name with date
 */
export function getFileName(prefix: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.pdf`;
}

/**
 * Translate category name to Persian
 */
export function translateCategory(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

/**
 * Translate mood to Persian
 */
export function translateMood(mood: string): string {
  return MOOD_LABELS[mood] || mood;
}
