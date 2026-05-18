import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiClient } from '@/lib/ai';
import { addContextToPrompt } from '@/lib/ai';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

// تأیید توکن
function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. احراز هویت
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'توکن نامعتبر است' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'شناسه گزارش الزامی است' }, { status: 400 });
    }

    // 2. دریافت گزارش کاربر
    const report = await db.weeklyReport.findFirst({
      where: {
        id: reportId,
        userId: decoded.userId,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'گزارش یافت نشد' }, { status: 404 });
    }

    // 3. دریافت تعهدات هفته کاربر
    const commitments = await db.commitment.findMany({
      where: {
        userId: decoded.userId,
        date: {
          gte: report.weekStart,
          lte: report.weekEnd,
        },
      },
      include: {
        reflection: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 4. محاسبه آمار از داده‌های کاربر
    const completedCount = commitments.filter(c => c.reflection?.completed).length;
    const completionRate = commitments.length > 0 ? completedCount / commitments.length : 0;

    // 5. ساخت context برای AI - فقط داده‌های کاربر
    const context = {
      userId: decoded.userId,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      totalCommitments: commitments.length,
      completedCommitments: completedCount,
      completionRate: (completionRate * 100).toFixed(1) + '%',
      consistencyScore: report.consistencyScore,
    };

    // 6. آماده‌سازی داده‌های تعهدات برای AI
    const commitmentsData = commitments.map(c => ({
      text: c.text,
      date: c.date,
      completed: c.reflection?.completed || false,
      reason: c.reflection?.reason || null,
    }));

    // 7. ساخت system prompt با context کاربر
    let systemPrompt = `
شما یک تحلیلگر بازتابی برای پلتفرم "همسو" هستید.

نقش شما:
- تحلیل الگوهای رفتاری کاربر بر اساس تعهدات و بازتاب‌های روزانه
- ارائه insight و reflection آرام و بالغ
- شناسایی الگوهای پنهان و جهت‌های آگاهی

قوانین مهم:
1. هرگز قضاوت نکنید
2. هرگز دستوری صحبت نکنید
3. لحن باید آرام، انسانی، بدون فشار و بدون guilt باشد
4. از کلمات "باید"، "حتما"، "لازم" استفاده نکنید
5. به‌جای گفتن "چه کار کنی"، بگویید "چه الگویی می‌بینم"
6. insightها باید کوتاه، واضح و actionable باشند
7. از اصطلاحات روان‌شناسی پیچیده استفاده نکنید
8. کاربر را تشویق نکنید، فقط آگاهی ایجاد کنید
9. از تشویق افراطی، ستاره و gamification دوری کنید

خروجی باید به زبان فارسی و با لحن آرام و بالغ باشد.
`;
    systemPrompt = addContextToPrompt(systemPrompt, context);

    // 8. ساخت user prompt با داده‌های کاربر
    const userPrompt = `
لطفاً بر اساس داده‌های زیر، یک گزارش هفتگی مینیمال و آرام تولید کنید:

داده‌های تعهدات کاربر:
${JSON.stringify(commitmentsData, null, 2)}

خروجی باید شامل این بخش‌ها باشد:
1. weeklySummary: خلاصه هفتگی (2-3 جمله، آرام و بدون قضاوت)
2. behavioralInsight: Insight رفتاری (1-2 جمله، الگوهای پنهان)
3. suggestedDirection: جهت پیشنهادی آگاهی (1 جمله، نه دستوری)

فرمت خروجی: JSON
{
  "weeklySummary": "...",
  "behavioralInsight": "...",
  "suggestedDirection": "..."
}

فقط JSON خروجی بده، بدون هیچ متن اضافه.
`;

    try {
      // 9. فراخوانی AI Provider با context کاربر
      const provider = aiClient.getProvider();
      const response = await provider.chat({
        messages: [{ role: 'user', content: userPrompt }],
        systemPrompt,
        temperature: 0.7,
      });

      // 10. Parse JSON response
      let aiResult;
      try {
        const content = response.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', response.content);
        throw new Error('خطا در پردازش پاسخ AI');
      }

      // 11. به‌روزرسانی گزارش با نتایج AI
      const updatedReport = await db.weeklyReport.update({
        where: { id: reportId },
        data: {
          weeklySummary: aiResult.weeklySummary || null,
          behavioralInsight: aiResult.behavioralInsight || null,
          suggestedDirection: aiResult.suggestedDirection || null,
          reportContent: JSON.stringify({
            hasData: commitments.length > 0,
            needsAI: false,
            generatedAt: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        report: {
          id: updatedReport.id,
          weekStart: updatedReport.weekStart,
          weekEnd: updatedReport.weekEnd,
          consistencyScore: updatedReport.consistencyScore,
          completionPattern: updatedReport.completionPattern ? JSON.parse(updatedReport.completionPattern) : null,
          weeklySummary: updatedReport.weeklySummary,
          behavioralInsight: updatedReport.behavioralInsight,
          suggestedDirection: updatedReport.suggestedDirection,
        },
      });
    } catch (aiError: any) {
      console.error('AI Error:', aiError);

      // 12. Fallback logic - گزارش ساده بر اساس آمار کاربر
      const summary = generateFallbackSummary(commitments, completionRate);
      const insight = generateFallbackInsight(commitmentRateToLabel(completionRate));
      const direction = generateFallbackDirection(commitmentRateToLabel(completionRate));

      const updatedReport = await db.weeklyReport.update({
        where: { id: reportId },
        data: {
          weeklySummary: summary,
          behavioralInsight: insight,
          suggestedDirection: direction,
          reportContent: JSON.stringify({
            hasData: commitments.length > 0,
            needsAI: false,
            generatedAt: new Date().toISOString(),
            fallback: true,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        report: {
          id: updatedReport.id,
          weekStart: updatedReport.weekStart,
          weekEnd: updatedReport.weekEnd,
          consistencyScore: updatedReport.consistencyScore,
          completionPattern: updatedReport.completionPattern ? JSON.parse(updatedReport.completionPattern) : null,
          weeklySummary: updatedReport.weeklySummary,
          behavioralInsight: updatedReport.behavioralInsight,
          suggestedDirection: updatedReport.suggestedDirection,
        },
        fallback: true,
      });
    }
  } catch (error: any) {
    console.error('Error generating weekly report:', error);
    return NextResponse.json(
      { error: 'خطا در تولید گزارش هفتگی' },
      { status: 500 }
    );
  }
}

// Helper functions
function commitmentRateToLabel(rate: number): 'high' | 'medium' | 'low' | 'none' {
  if (rate >= 0.8) return 'high';
  if (rate >= 0.5) return 'medium';
  if (rate > 0) return 'low';
  return 'none';
}

function generateFallbackSummary(commitments: any[], rate: number): string {
  if (commitments.length === 0) {
    return 'این هفته هنوز تعهدی ثبت نشده است.';
  }
  return `در این هفته از ${commitments.length} تعهد، ${Math.round(rate * 100)}% انجام شده است.`;
}

function generateFallbackInsight(label: string): string {
  const insights = {
    high: 'الگوی ثباتی در تعهدات دیده می‌شود که نشان‌دهنده انسجام درونی است.',
    medium: 'تعادل میان انجام و عدم انجام تعهدات دیده می‌شود.',
    low: 'الگوی تکراری در عدم انجام تعهدات دیده می‌شود.',
    none: 'شروع تعهدات جدید می‌تواند آغاز مسیری آگاهانه باشد.',
  };
  return insights[label];
}

function generateFallbackDirection(label: string): string {
  const directions = {
    high: 'ادامه دادن به همین مسیر می‌تواند اعتماد به خود را تقویت کند.',
    medium: 'می‌توان به الگوهایی که باعث عدم انجام می‌شوند آگاه‌تر شد.',
    low: 'آگاهی از موانع واقعی می‌تواند اولین قدم باشد.',
    none: 'می‌توانی با یک تعهد ساده شروع کنی.',
  };
  return directions[label];
}
