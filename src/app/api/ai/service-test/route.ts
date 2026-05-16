/**
 * AI Service Test API
 * 
 * این API route برای تست کردن متدهای مختلف AI Service استفاده می‌شود.
 * فقط برای توسعه و تست (Development Only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { verifyToken } from '@/lib/auth';
import { subDays, subWeeks, startOfWeek, startOfMonth } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    // Verify user
    const user = await verifyToken(request);
    
    const body = await request.json();
    const { action, ...params } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      // 1. تست چت
      case 'chat': {
        const { message, history } = params;
        if (!message) {
          return NextResponse.json({ error: 'message is required' }, { status: 400 });
        }
        result = await aiService.chat(user.id, message, history || []);
        break;
      }
      
      // 2. تست تحلیل پیشرفت
      case 'analyzeUser': {
        const days = params.days || 7;
        const dateRange: [Date, Date] = [
          subDays(new Date(), days),
          new Date(),
        ];
        result = await aiService.analyzeUser(user.id, dateRange, params.detailed ?? true);
        break;
      }
      
      // 3. تست پیشنهاد تعهدات
      case 'suggestCommitments': {
        const count = params.count || 5;
        result = await aiService.suggestCommitments(user.id, count);
        break;
      }
      
      // 4. تست تحلیل احساسی
      case 'analyzeSentiment': {
        const { text } = params;
        if (!text) {
          return NextResponse.json({ error: 'text is required' }, { status: 400 });
        }
        result = await aiService.analyzeSentiment(user.id, text);
        break;
      }
      
      // 5. تست تحلیل احساسی از بازتف‌ها
      case 'analyzeSentimentFromReflections': {
        const days = params.days || 7;
        const dateRange: [Date, Date] = [
          subDays(new Date(), days),
          new Date(),
        ];
        result = await aiService.analyzeSentimentFromReflections(user.id, dateRange);
        break;
      }
      
      // 6. تست گزارش هفتگی
      case 'generateWeeklyReport': {
        const weekStart = params.weekStart
          ? new Date(params.weekStart)
          : startOfWeek(new Date(), { weekStartsOn: 6 }); // شنبه
        result = await aiService.generateWeeklyReport(user.id, weekStart);
        break;
      }
      
      // 7. تست گزارش ماهانه
      case 'generateMonthlyReport': {
        const monthStart = params.monthStart
          ? new Date(params.monthStart)
          : startOfMonth(new Date());
        result = await aiService.generateMonthlyReport(user.id, monthStart);
        break;
      }
      
      // 8. تست راهنمایی بهبود
      case 'provideImprovementGuide': {
        const { area } = params;
        result = await aiService.provideImprovementGuide(user.id, area);
        break;
      }
      
      // 9. تست پیشنهاد اهداف
      case 'suggestGoals': {
        const count = params.count || 5;
        result = await aiService.suggestGoals(user.id, count);
        break;
      }
      
      // 10. سلامت سرویس
      case 'healthCheck': {
        result = await aiService.healthCheck();
        break;
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      action,
      provider: aiService.getProviderInfo(),
      result,
    });
  } catch (error: any) {
    console.error('[AI Service Test] Error:', error);
    return NextResponse.json(
      { error: 'خطا در تست AI Service: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// GET endpoint برای لیست action های موجود
export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    
    const actions = [
      { name: 'chat', description: 'چت با دستیار هوشمند', params: { message: 'string', history: 'array (optional)' } },
      { name: 'analyzeUser', description: 'تحلیل پیشرفت کاربر', params: { days: 'number (default: 7)', detailed: 'boolean (default: true)' } },
      { name: 'suggestCommitments', description: 'پیشنهاد تعهدات', params: { count: 'number (default: 5)' } },
      { name: 'analyzeSentiment', description: 'تحلیل احساسی متن', params: { text: 'string' } },
      { name: 'analyzeSentimentFromReflections', description: 'تحلیل احساسی از بازتف‌ها', params: { days: 'number (default: 7)' } },
      { name: 'generateWeeklyReport', description: 'گزارش هفتگی', params: { weekStart: 'date (optional)' } },
      { name: 'generateMonthlyReport', description: 'گزارش ماهانه', params: { monthStart: 'date (optional)' } },
      { name: 'provideImprovementGuide', description: 'راهنمایی برای بهبود', params: { area: 'string (optional)' } },
      { name: 'suggestGoals', description: 'پیشنهاد اهداف', params: { count: 'number (default: 5)' } },
      { name: 'healthCheck', description: 'سلامت سرویس', params: {} },
    ];
    
    return NextResponse.json({
      success: true,
      provider: aiService.getProviderInfo(),
      user: {
        id: user.id,
        name: user.name,
      },
      actions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
