import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Validation schema
const suggestCommitmentsSchema = z.object({
  userId: z.string().min(1),
  count: z.number().min(1).max(10).optional().default(3),
  category: z.string().optional(),
  timeOfDay: z.string().optional(), // morning, afternoon, evening
  context: z.string().optional(), // اطلاعات اضافی برای شخصی‌سازی
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, count, category, timeOfDay, context } = suggestCommitmentsSchema.parse(body);

    // 1. دریافت تعهدات قبلی کاربر
    const pastCommitments = await db.commitment.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    // 2. دریافت بازتاب‌های کاربر برای تحلیل الگوها
    const reflections = await db.reflection.findMany({
      where: {
        commitment: { userId },
      },
      include: {
        commitment: true,
      },
      orderBy: { reflectedAt: 'desc' },
      take: 20,
    });

    // 3. دریافت برنامه‌های فعال کاربر
    const activePlans = await db.plan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 4. دریافت گزارش‌های هفتگی برای تحلیل الگوهای رفتاری
    const weeklyReports = await db.weeklyReport.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: 4,
    });

    // 5. تحلیل داده‌ها و آماده‌سازی برای AI
    const analysisData = {
      pastCommitments: pastCommitments.map(c => ({
        text: c.text,
        date: c.date.toISOString(),
        completed: c.reflection?.completed || false,
      })),
      reflections: reflections.map(r => ({
        completed: r.completed,
        reason: r.reason,
        date: r.reflectedAt.toISOString(),
      })),
      activePlans: activePlans.map(p => ({
        title: p.title,
        description: p.description,
        type: p.type,
        category: p.category,
      })),
      weeklyInsights: weeklyReports.map(r => ({
        summary: r.weeklySummary,
        behavioralInsight: r.behavioralInsight,
        suggestedDirection: r.suggestedDirection,
      })),
    };

    // 6. محاسبه نرخ تکمیل و الگوها
    const totalCommitments = analysisData.pastCommitments.length;
    const completedCommitments = analysisData.pastCommitments.filter(c => c.completed).length;
    const completionRate = totalCommitments > 0 ? (completedCommitments / totalCommitments) * 100 : 0;

    // 7. تحلیل دسته‌بندی‌های موفق
    const successfulPatterns = analysisData.pastCommitments
      .filter(c => c.completed)
      .map(c => c.text);

    const failedPatterns = analysisData.reflections
      .filter(r => !r.completed && r.reason)
      .map(r => ({ reason: r.reason, date: r.date }));

    // 8. ساخت Prompt برای AI
    let aiPrompt = `تو یک دستیار هوشمند برای برنامه‌ریزی و تعهدات روزانه هستی.

اطلاعات کاربر:
- نرخ تکمیل تعهدات: ${completionRate.toFixed(1)}%
- تعداد تعهدات قبلی: ${totalCommitments}
- تعداد تعهدات تکمیل شده: ${completedCommitments}

تعهدات موفق قبلی:
${successfulPatterns.slice(0, 5).map(c => `- ${c}`).join('\n')}

دلایل عدم انجام (اگر وجود داره):
${failedPatterns.slice(0, 3).map(f => `- ${f.reason}`).join('\n')}

برنامه‌های فعال کاربر:
${analysisData.activePlans.map(p => `- ${p.title} (${p.category})`).join('\n')}

`;

    // اضافه کردن اطلاعات بازه زمانی
    if (timeOfDay) {
      const timeContext = {
        morning: 'این تعهدات برای صبح است، توصیه می‌شود فعالیت‌های سبک‌تر و پرانرژی پیشنهاد شوند.',
        afternoon: 'این تعهدات برای بعدازظهر است، توصیه می‌شود فعالیت‌های متوسط پیشنهاد شوند.',
        evening: 'این تعهدات برای شب است، توصیه می‌شود فعالیت‌های آرام و قابل انجام پیشنهاد شوند.',
      };
      aiPrompt += timeContext[timeOfDay as keyof typeof timeContext] + '\n';
    }

    // اضافه کردن دسته‌بندی
    if (category) {
      aiPrompt += `این تعهدات باید در دسته‌بندی "${category}" باشند.\n`;
    }

    // اضافه کردن context اضافی
    if (context) {
      aiPrompt += `اطلاعات اضافی کاربر: ${context}\n`;
    }

    aiPrompt += `
بر اساس این اطلاعات، ${count} تعهد مناسب و قابل‌دستیابی به فارسی پیشنهاد بده.

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
      "category": "دسته‌بندی (مثلاً سلامتی، یادگیری، کار)",
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

    // 9. فراخوانی AI
    const aiResponse = await fetch('http://localhost:3001/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'تو یک دستیار هوشمند برای برنامه‌ریزی تعهدات روزانه هستی. فقط JSON خروجی بده، بدون هیچ توضیح اضافه.',
          },
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content || '{}';

    // 10. پارس کردن JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId الزامی است' },
        { status: 400 }
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
