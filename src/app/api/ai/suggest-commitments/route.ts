import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { aiClient } from '@/lib/ai';
import { verifyToken } from '@/lib/auth';

// Validation schema
const suggestCommitmentsSchema = z.object({
  userId: z.string().min(1),
  count: z.number().min(1).max(10).optional().default(3),
  category: z.string().optional(),
  timeOfDay: z.string().optional(),
  context: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, count, category, timeOfDay, context } = suggestCommitmentsSchema.parse(body);

    // Check if userId matches authenticated user
    if (userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // بررسی حداقل داده کافی (حداقل 7 روز تعهد)
    const totalCommitments = await db.commitment.count({
      where: { userId },
    });

    if (totalCommitments < 7) {
      return NextResponse.json(
        {
          success: false,
          error: 'برای ارائه صحیح پیشنهادات هوشمند، شما به حداقل 7 روز داده نیاز دارید. شما می‌توانید از هفته دوم از این ویژگی استفاده کنید.',
          code: 'INSUFFICIENT_DATA',
          requiredDays: 7,
          currentDays: totalCommitments,
        },
        { status: 400 }
      );
    }

    const completedCommitments = await db.commitment.count({
      where: {
        userId,
        reflection: { completed: true },
      },
    });

    const completionRate = totalCommitments > 0
      ? (completedCommitments / totalCommitments) * 100
      : 0;

    // 2. دریافت تعهدات موفق و ناموفق
    const successfulCommitments = await db.commitment.findMany({
      where: {
        userId,
        reflection: { completed: true },
      },
      orderBy: { date: 'desc' },
      take: 10,
      select: { text: true },
    });

    const failedReflections = await db.reflection.findMany({
      where: {
        commitment: { userId },
        completed: false,
        reason: { not: null },
      },
      include: {
        commitment: { select: { text: true } },
      },
      orderBy: { reflectedAt: 'desc' },
      take: 10,
    });

    // 3. ساخت prompt برای AI با context اضافی
    let customPrompt = `بر اساس سابقه من، ${count} تعهد مناسب و قابل‌دستیابی به فارسی پیشنهاد بده.

اطلاعات من:
- نرخ تکمیل تعهدات: ${completionRate.toFixed(1)}%
- تعداد تعهدات قبلی: ${totalCommitments}
- تعداد تعهدات تکمیل شده: ${completedCommitments}

تعهدات موفق قبلی:
${successfulCommitments.map(c => `- ${c.text}`).join('\n')}

دلایل عدم انجام (اگر وجود داره):
${failedReflections.map(r => `- ${r.reason} (${r.commitment.text})`).join('\n')}
`;

    // اضافه کردن context اضافی
    if (timeOfDay) {
      const timeContext = {
        morning: 'این تعهدات برای صبح است، توصیه می‌شود فعالیت‌های سبک‌تر و پرانرژی پیشنهاد شوند.',
        afternoon: 'این تعهدات برای بعدازظهر است، توصیه می‌شود فعالیت‌های متوسط پیشنهاد شوند.',
        evening: 'این تعهدات برای شب است، توصیه می‌شود فعالیت‌های آرام و قابل انجام پیشنهاد شوند.',
      };
      customPrompt += timeContext[timeOfDay as keyof typeof timeContext] + '\n';
    }

    if (category) {
      customPrompt += `این تعهدات باید در دسته‌بندی "${category}" باشند.\n`;
    }

    if (context) {
      customPrompt += `اطلاعات اضافی کاربر: ${context}\n`;
    }

    customPrompt += `
نکات مهم:
1. تعهدات باید کوتاه، مشخص و قابل‌اندازه‌گیری باشند
2. از الگوهای موفق قبلی الهام بگیر
3. از دلایل عدم انجام درس بگیر و تعهدات مشابه پیشنهاد نده
4. در نظر بگیر نرخ تکمیل کاربر چقدره و تعهدات مناسبی پیشنهاد بده
5. اگر نرخ تکمیل پایینه، تعهدات ساده‌تر و کم‌تر پیشنهاد بده
6. اگر نرخ تکمیل بالاست، می‌تونی تعهدات کمی چالش‌برانگیزتر هم پیشنهاد بدی

خروجی باید به فرمت JSON زیر باشه:
{
  "suggestions": [
    {
      "title": "عنوان کوتاه تعهد",
      "description": "توضیح مختصر که چرا این تعهد مناسب است",
      "estimatedTime": "مثلاً 15 دقیقه",
      "category": "${category || 'عمومی'}",
      "priority": "high/medium/low",
      "reason": "دلیل پیشنهاد این تعهد بر اساس داده‌های کاربر"
    }
  ],
  "insights": {
    "strengths": ["نقاط قوت کاربر"],
    "areasForImprovement": ["نقاط قابل بهبود"],
    "recommendations": ["توصیه‌های کلی"]
  }
}

فقط JSON خروجی بده، بدون هیچ متن دیگه.`;

    // 4. فراخوانی AI
    const provider = aiClient.getProvider();
    const response = await provider.chat({
      messages: [{ role: 'user', content: customPrompt }],
      systemPrompt: 'تو یک دستیار هوشمند برای برنامه‌ریزی تعهدات روزانه هستی. فقط JSON خروجی بده، بدون هیچ توضیح اضافه.',
      temperature: 0.7,
      maxTokens: 1500,
    });

    // 5. پارس کردن JSON
    let parsedResponse;
    try {
      // استخراج JSON از پاسخ AI (ممکنه با ```json و ``` احاطه شده باشه)
      let content = response.content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      } else {
        // اگر code block نبود، شکل براکت رو پیدا کن
        const braceMatch = content.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          content = braceMatch[0];
        }
      }
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response.content);
      throw new Error('خطا در پردازش پاسخ AI');
    }

    return NextResponse.json({
      success: true,
      suggestions: parsedResponse.suggestions || [],
      insights: parsedResponse.insights || {},
      analysis: {
        completionRate: completionRate.toFixed(1),
        totalCommitments,
        completedCommitments,
      },
    });

  } catch (error) {
    console.error('Error in suggest-commitments:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof z.ZodError ? 'خطا در ورودی‌ها' : 'خطا در پیشنهاد تعهدات',
      },
      { status: 500 }
    );
  }
}

// GET برای دریافت آمار و اطلاعات مرتبط
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'توکن نامعتبر است' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId الزامی است' },
        { status: 400 }
      );
    }

    // Check if userId matches authenticated user
    if (userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'دسترسی غیرمجاز' },
        { status: 403 }
      );
    }

    // دریافت آمار کلی برای UI
    const totalCommitments = await db.commitment.count({
      where: { userId },
    });

    const completedCommitments = await db.commitment.count({
      where: {
        userId,
        reflection: { completed: true },
      },
    });

    const activePlans = await db.plan.count({
      where: { userId },
    });

    const recentCommitments = await db.commitment.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      select: {
        text: true,
        date: true,
        reflection: {
          select: {
            completed: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCommitments,
        completedCommitments,
        completionRate: totalCommitments > 0
          ? ((completedCommitments / totalCommitments) * 100).toFixed(1)
          : '0.0',
        activePlans,
      },
      recentCommitments,
    });

  } catch (error) {
    console.error('Error in suggest-commitments GET:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت اطلاعات' },
      { status: 500 }
    );
  }
}
