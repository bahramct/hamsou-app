import { NextRequest, NextResponse } from 'next/server';
import { aiClient } from '@/lib/ai/ai-client';
import { buildAnalyticsContext } from '@/lib/ai/context-builders';
import { SYSTEM_PROMPTS, addContextToPrompt } from '@/lib/ai/system-prompts';
import { db } from '@/lib/db';
import { format, startOfDay, subDays } from 'date-fns';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// Helper function
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // 2. دریافت روزهای منحصر به فرد تعهدات کاربر
    const commitments = await db.commitment.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 365, // حداکثر ۳۶۵ روز
    });

    // استخراج روزهای منحصر به فرد
    const uniqueDates = Array.from(
      new Set(commitments.map(c => format(startOfDay(new Date(c.date)), 'yyyy-MM-dd')))
    );

    const daysWithData = uniqueDates.length;

    // 3. بررسی حداقل داده لازم
    if (daysWithData < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'برای تولید گزارش حداقل به ۳ روز داده نیاز دارید',
          currentDays: daysWithData,
          requiredDays: 3,
        },
        { status: 400 }
      );
    }

    // 4. محاسبه بازه زمانی گزارش
    let startDate: Date;
    const endDate = new Date();

    if (daysWithData > 90) {
      // اگر بیشتر از ۹۰ روز داده داره، فقط ۳۰ روز آخر
      startDate = subDays(endDate, 30);
    } else {
      // در غیر این صورت، همه داده‌ها
      startDate = startOfDay(new Date(uniqueDates[uniqueDates.length - 1]));
    }

    // 5. دریافت context کامل
    const context = await buildAnalyticsContext(userId, [startDate, endDate]);

    // 6. ساخت system prompt
    let systemPrompt = SYSTEM_PROMPTS.REPORT_GENERATOR;
    systemPrompt = addContextToPrompt(systemPrompt, {
      statistics: context.statistics,
      streak: context.streak,
      dateRange: context.dateRange,
    });

    // 7. پیام کاربر
    const userMessage = `یک گزارش جامع و کاربردی از پیشرفت من در بازه ${format(startDate, 'yyyy/MM/dd')} تا ${format(endDate, 'yyyy/MM/dd')} تولید کن. گزارش شامل آمار، نکات مثبت، چالش‌ها و پیشنهادات عملی باشد.`;

    // 8. ارسال به AI
    const provider = aiClient.getProvider();
    const result = await provider.chat({
      messages: [{ role: 'user', content: userMessage }],
      systemPrompt,
      temperature: 0.5,
    });

    // 9. بازگرداندن نتیجه
    return NextResponse.json({
      success: true,
      report: {
        content: result.content,
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        },
        daysUsed: daysWithData > 90 ? 30 : daysWithData,
        totalDaysWithData: daysWithData,
        model: result.model,
      },
    });

  } catch (error: any) {
    console.error('[API] Generate Report Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در تولید گزارش',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    // 2. اطلاعات endpoint
    return NextResponse.json({
      success: true,
      endpoint: '/api/ai/generate-report',
      method: 'POST',
      description: 'تولید گزارش هوشمند از پیشرفت کاربر با AI',
      logic: {
        minDaysRequired: 3,
        maxDaysLimit: 90,
        description: 'اگر کاربر کمتر از ۳ روز داده داشته باشد، گزارش غیرفعال است. اگر بیش از ۹۰ روز داده داشته باشد، از ۳۰ روز آخر استفاده می‌شود.',
      },
      example: {
        request: {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer <token>',
            'Content-Type': 'application/json',
          },
        },
        response: {
          success: true,
          report: {
            content: 'گزارش تولید شده...',
            dateRange: {
              start: '2025-01-01',
              end: '2025-01-30',
            },
            daysUsed: 30,
            totalDaysWithData: 95,
            model: 'gpt-4',
          },
        },
      },
    });

  } catch (error: any) {
    console.error('[API] Generate Report GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در دریافت اطلاعات',
      },
      { status: 500 }
    );
  }
}
