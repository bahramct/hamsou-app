import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

// System Prompt برای AI
const AI_SYSTEM_PROMPT = `
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

export async function POST(request: NextRequest) {
  try {
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

    // دریافت گزارش
    const report = await db.weeklyReport.findFirst({
      where: {
        id: reportId,
        userId: decoded.userId,
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'گزارش یافت نشد' }, { status: 404 });
    }

    // دریافت تعهدات هفته
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

    // آماده‌سازی داده‌ها برای AI
    const aiInput = {
      period: {
        start: report.weekStart,
        end: report.weekEnd,
      },
      commitments: commitments.map(c => ({
        text: c.text,
        date: c.date,
        completed: c.reflection?.completed || false,
        reason: c.reflection?.reason || null,
      })),
    };

    // فراخوانی AI با استفاده از fetch به API endpoint
    // در اینجا از z-ai-web-dev-sdk استفاده می‌کنیم
    const aiPrompt = `
لطفاً بر اساس داده‌های زیر، یک گزارش هفتگی مینیمال و آرام تولید کنید:

${JSON.stringify(aiInput, null, 2)}

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
`;

    try {
      // فراخوانی AI API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const aiResponse = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: AI_SYSTEM_PROMPT },
            { role: 'user', content: aiPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('خطا در ارتباط با AI');
      }

      const aiData = await aiResponse.json();
      const aiResult = JSON.parse(aiData.content || aiData.message || '{}');

      // به‌روزرسانی گزارش با نتایج AI
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

      // اگر AI در دسترس نبود، یک گزارش ساده بر اساس آمار ایجاد می‌کنیم
      const pattern = report.completionPattern ? JSON.parse(report.completionPattern) : null;
      const completionRate = pattern?.completionRate || 0;

      let summary = '';
      let insight = '';
      let direction = '';

      if (commitments.length === 0) {
        summary = 'این هفته هنوز تعهدی ثبت نشده است.';
        insight = 'شروع تعهدات جدید می‌تواند آغاز مسیری آگاهانه باشد.';
        direction = 'می‌توانی با یک تعهد ساده شروع کنی.';
      } else if (completionRate >= 0.8) {
        summary = `در این هفته از ${commitments.length} تعهد، ${Math.round(completionRate * 100)}% انجام شده است.`;
        insight = 'الگوی ثباتی در تعهدات دیده می‌شود که نشان‌دهنده انسجام درونی است.';
        direction = 'ادامه دادن به همین مسیر می‌تواند اعتماد به خود را تقویت کند.';
      } else if (completionRate >= 0.5) {
        summary = `در این هفته از ${commitments.length} تعهد، ${Math.round(completionRate * 100)}% انجام شده است.`;
        insight = 'تعادل میان انجام و عدم انجام تعهدات دیده می‌شود.';
        direction = 'می‌توان به الگوهایی که باعث عدم انجام می‌شوند آگاه‌تر شد.';
      } else {
        summary = `در این هفته از ${commitments.length} تعهد، ${Math.round(completionRate * 100)}% انجام شده است.`;
        insight = 'الگوی تکراری در عدم انجام تعهدات دیده می‌شود.';
        direction = 'آگاهی از موانع واقعی می‌تواند اولین قدم باشد.';
      }

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
            fallback: true, // نشان می‌دهد که از fallback logic استفاده شده
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
        fallback: true, // نشان می‌دهد که از fallback استفاده شده
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
