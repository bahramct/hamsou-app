import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';

// کلمات توقف فارسی که باید نادیده گرفته شوند
const STOP_WORDS = new Set([
  // کلمات عمومی
  'از', 'به', 'در', 'با', 'برای', 'و', 'یا', 'که', 'این', 'آن',
  'را', 'هست', 'است', 'می', 'شود', 'کردن', 'شدن', 'باشم', 'باشی',
  'باشد', 'بودن', 'نم', 'ها', 'های', 'تری', 'تر', 'ترین',
  // کلمات بیشتر استفاده شده در تعهدات
  'هر', 'روز', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت',
  'اول', 'دوم', 'سوم', 'آخر', 'قبل', 'بعد', 'بین', 'تا',
  'خودم', 'من', 'تو', 'او', 'ما', 'شما', 'آنها',
  'کسی', 'چیزی', 'کجا', 'کجاها', 'چطور', 'چگونگی',
  'باید', 'نمی', 'هم', 'همه', 'همان', 'همین',
]);

// تابع تمیز کردن و نرمال‌سازی متن فارسی
function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    // حذف علائم نگارشی
    .replace(/[،؛:!؟.؟،"«»\(\)\[\]{}]/g, ' ')
    // حذف اعداد انگلیسی و فارسی
    .replace(/[0-9۰-۹]/g, ' ')
    // تقسیم به کلمات
    .split(/\s+/)
    // فیلتر کردن کلمات خالی و توقف
    .filter(word => word.length >= 2 && !STOP_WORDS.has(word))
    // حذف تکرارها
    .filter((word, index, self) => self.indexOf(word) === index);
}

// تابع شمارش تکرار کلمات
function countWordFrequency(words: string[]): Map<string, number> {
  const frequency = new Map<string, number>();

  for (const word of words) {
    const count = frequency.get(word) || 0;
    frequency.set(word, count + 1);
  }

  return frequency;
}

// تبدیل Map به آرایه و مرتب‌سازی
function getTopWords(frequency: Map<string, number>, limit: number = 50) {
  return Array.from(frequency.entries())
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';
    const type = searchParams.get('type') || 'all'; // 'commitments', 'reflections', 'all'

    // محاسبه بازه زمانی
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      case '30d':
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    const allWords: string[] = [];

    // پردازش تعهدات
    if (type === 'commitments' || type === 'all') {
      const commitments = await db.commitment.findMany({
        where: {
          userId: user.userId,
          date: {
            gte: startDate,
            lte: now,
          },
        },
        select: {
          text: true,
        },
      });

      for (const commitment of commitments) {
        const normalized = normalizeText(commitment.text);
        allWords.push(...normalized);
      }
    }

    // پردازش بازتاب‌ها (دلایل عدم انجام)
    if (type === 'reflections' || type === 'all') {
      const reflections = await db.reflection.findMany({
        where: {
          commitment: {
            userId: user.userId,
            date: {
              gte: startDate,
              lte: now,
            },
          },
          completed: false, // فقط تعهداتی که انجام نشده‌اند
          reason: {
            not: null,
          },
        },
        select: {
          reason: true,
        },
      });

      for (const reflection of reflections) {
        if (reflection.reason) {
          const normalized = normalizeText(reflection.reason);
          allWords.push(...normalized);
        }
      }
    }

    // شمارش تکرار کلمات
    const frequency = countWordFrequency(allWords);

    // دریافت 50 کلمه پرتکرار
    const topWords = getTopWords(frequency, 50);

    // اگر هیچ داده‌ای وجود نداشت
    if (topWords.length === 0) {
      return NextResponse.json({
        words: [],
        message: 'هنوز داده‌ای برای نمایش ابر کلمات وجود ندارد',
      });
    }

    return NextResponse.json({
      words: topWords,
      totalWords: allWords.length,
      uniqueWords: frequency.size,
    });
  } catch (error) {
    console.error('Error fetching word cloud data:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت داده‌های ابر کلمات' },
      { status: 500 }
    );
  }
}
