/**
 * AI Service - High-level Business Logic
 * 
 * این سرویس لایه High-level را مدیریت می‌کند و Business Logic را پیاده‌سازی می‌کند.
 * این لایه بین API Routes و AI Provider قرار می‌گیرد.
 */

import { aiClient } from './ai-client';
import { SYSTEM_PROMPTS, addContextToPrompt, addUserNameToPrompt } from './system-prompts';
import {
  buildChatContext,
  buildAnalyticsContext,
  buildCommitmentContext,
  buildSentimentContext,
  buildWeeklyReportContext,
  buildMonthlyReportContext,
} from './context-builders';
import { Message, ChatResponse, AnalysisResult, CommitmentSuggestion } from './types';

export class AIService {
  private provider = aiClient.getProvider();

  // ============================================================
  // 1. چت‌بات اختصاصی (8.1.1)
  // ============================================================

  /**
   * چت با دستیار هوشمند همسو
   * @param userId - شناسه کاربر
   * @param message - پیام کاربر
   * @param history - تاریخچه چت (پیام‌های قبلی)
   */
  async chat(userId: string, message: string, history: Message[] = []): Promise<ChatResponse> {
    try {
      // دریافت context سبک برای چت
      const context = await buildChatContext(userId);
      
      // ساخت system prompt با context
      let systemPrompt = SYSTEM_PROMPTS.CHAT_BOT;
      systemPrompt = addUserNameToPrompt(systemPrompt, context.userName);
      systemPrompt = addContextToPrompt(systemPrompt, context.stats);
      
      // فرمت کردن پیام‌ها
      const messages: Message[] = [...history, { role: 'user' as const, content: message }];
      
      // ارسال به AI
      const response = await this.provider.chat({
        messages,
        systemPrompt,
        temperature: 0.7,
      });
      
      return response;
    } catch (error: any) {
      console.error('[AIService] Chat error:', error);
      throw new Error(`خطا در چت با AI: ${error.message}`);
    }
  }

  // ============================================================
  // 2. تحلیل پیشرفت کاربر (8.1.4)
  // ============================================================

  /**
   * تحلیل پیشرفت کاربر در بازه زمانی مشخص
   * @param userId - شناسه کاربر
   * @param dateRange - بازه زمانی [شروع, پایان]
   * @param detailed - آیا تحلیل جزئی خواسته شده؟
   */
  async analyzeUser(
    userId: string,
    dateRange: [Date, Date],
    detailed: boolean = true
  ): Promise<ChatResponse> {
    try {
      // دریافت context کامل برای تحلیل
      const context = await buildAnalyticsContext(userId, dateRange);
      
      // ساخت system prompt
      let systemPrompt = SYSTEM_PROMPTS.ANALYTICS_COACH;
      
      // اضافه کردن context به system prompt
      systemPrompt = addContextToPrompt(systemPrompt, {
        statistics: context.statistics,
        streak: context.streak,
        plans: context.plans.map(p => ({
          title: p.title,
          type: p.type,
          progress: p.progress,
          status: p.status,
        })),
      });
      
      // پیام کاربر
      const userMessage = detailed
        ? 'لطفاً یک تحلیل کامل و جزئی از پیشرفت من در این بازه زمانی ارائه بده. شامل الگوها، نقاط قوت، ضعف‌ها و راهکارهای عملی.'
        : 'لطفاً یک خلاصه کوتاه از پیشرفت من در این بازه زمانی ارائه بده.';
      
      // ارسال به AI
      const response = await this.provider.chat({
        messages: [{ role: 'user', content: userMessage }],
        systemPrompt,
        temperature: 0.6, // کمتر خلاقانه، بیشتر تحلیلی
      });
      
      return response;
    } catch (error: any) {
      console.error('[AIService] Analysis error:', error);
      throw new Error(`خطا در تحلیل پیشرفت: ${error.message}`);
    }
  }

  // ============================================================
  // 3. پیشنهاد تعهدات (8.2)
  // ============================================================

  /**
   * پیشنهاد تعهدات بر اساس سابقه کاربر
   * @param userId - شناسه کاربر
   * @param count - تعداد پیشنهاد (پیش‌فرض ۵)
   */
  async suggestCommitments(userId: string, count: number = 5): Promise<ChatResponse> {
    try {
      // دریافت context تعهدات
      const context = await buildCommitmentContext(userId);
      
      // ساخت system prompt
      let systemPrompt = SYSTEM_PROMPTS.COMMITMENT_SUGGESTER;
      systemPrompt = addContextToPrompt(systemPrompt, {
        recentCommitmentsCount: context.recentCommitments.length,
        categories: context.categories,
        completionRates: context.completionRates,
        strengths: context.strengths,
        weaknesses: context.weaknesses,
        patterns: context.patterns,
        requestedCount: count,
      });
      
      // پیام کاربر
      const userMessage = `بر اساس سابقه من، ${count} تا تعهد مناسب و قابل‌دستیابی پیشنهاد بده.`;
      
      // ارسال به AI
      const response = await this.provider.chat({
        messages: [{ role: 'user', content: userMessage }],
        systemPrompt,
        temperature: 0.8, // بیشتر خلاقانه
      });
      
      return response;
    } catch (error: any) {
      console.error('[AIService] Commitment suggestion error:', error);
      throw new Error(`خطا در پیشنهاد تعهدات: ${error.message}`);
    }
  }

  // ============================================================
  // 4. تحلیل احساسی (8.3)
  // ============================================================

  /**
   * تحلیل احساسی متن
   * @param userId - شناسه کاربر
   * @param text - متن برای تحلیل
   */
  async analyzeSentiment(userId: string, text: string): Promise<ChatResponse> {
    try {
      // استفاده از متد analyzeSentiment خود provider
      const sentiment = await this.provider.analyzeSentiment(text);
      
      // ساخت response
      const content = JSON.stringify(sentiment, null, 2);
      
      return {
        content,
        model: 'sentiment-analysis',
      };
    } catch (error: any) {
      console.error('[AIService] Sentiment analysis error:', error);
      throw new Error(`خطا در تحلیل احساسی: ${error.message}`);
    }
  }

  /**
   * تحلیل احساسی بر اساس بازتف‌ها
   * @param userId - شناسه کاربر
   * @param dateRange - بازه زمانی [شروع, پایان]
   */
  async analyzeSentimentFromReflections(
    userId: string,
    dateRange: [Date, Date]
  ): Promise<ChatResponse> {
    try {
      // دریافت context احساسی
      const context = await buildSentimentContext(userId, dateRange);
      
      // ساخت system prompt
      let systemPrompt = SYSTEM_PROMPTS.SENTIMENT_ANALYZER;
      systemPrompt = addContextToPrompt(systemPrompt, {
        moodDistribution: context.moodDistribution,
        reflectionCount: context.reflections.length,
        keywords: context.keywords,
      });
      
      // ساخت متن ترکیبی از بازتف‌ها
      const reflectionsText = context.reflections
        .map(r => `[${r.date} Mood: ${r.mood}]\nموفقیت‌ها: ${r.achievements || 'ندارد'}\nچالش‌ها: ${r.challenges || 'ندارد'}`)
        .join('\n\n---\n\n');
      
      // پیام کاربر
      const userMessage = `تحلیل احساسی از بازتف‌های من در این بازه زمانی:\n\n${reflectionsText}`;
      
      // ارسال به AI
      const response = await this.provider.chat({
        messages: [{ role: 'user', content: userMessage }],
        systemPrompt,
        temperature: 0.5, // متوسط - نه خیلی خلاقانه، نه خیلی خشک
      });
      
      return response;
    } catch (error: any) {
      console.error('[AIService] Reflection sentiment analysis error:', error);
      throw new Error(`خطا در تحلیل احساسی بازتف‌ها: ${error.message}`);
    }
  }

  // ============================================================
  // 5. تولید گزارش (8.4)
  // ============================================================

  /**
   * تولید گزارش هفتگی
   * @param userId - شناسه کاربر
   * @param weekStart - شروع هفته
   */
  async generateWeeklyReport(userId: string, weekStart: Date): Promise<ChatResponse> {
    try {
      // دریافت context هفتگی
      const context = await buildWeeklyReportContext(userId, weekStart);
      
      // ساخت system prompt
      let systemPrompt = SYSTEM_PROMPTS.REPORT_GENERATOR;
      systemPrompt = addContextToPrompt(systemPrompt, {
        statistics: context.statistics,
        streak: context.streak,
        dateRange: context.dateRange,
      });
      
      // پیام کاربر
      const userMessage = 'گزارش هفتگی من را تولید کن.';
      
      // ارسال به AI
      const response = await this.provider.chat({
        messages: [{ role: 'user', content: userMessage }],
        systemPrompt,
        temperature: 0.5, // متوسط
      });
      
      return response;
    } catch (error: any) {
      console.error('[AIService] Weekly report error:', error);
      throw new Error(`خطا در تولید گزارش هفتگی: ${error.message}`);
    }
  }

  /**
   * تولید گزارش ماهانه
   * @param userId - شناسه کاربر
   * @param monthStart - شروع ماه
   */
  async generateMonthlyReport(userId: string, monthStart: Date): Promise<ChatResponse> {
    try {
      // دریافت context ماهانه
      const context = await buildMonthlyReportContext(userId, monthStart);
      
      // ساخت system prompt
      let systemPrompt = SYSTEM_PROMPTS.REPORT_GENERATOR;
      systemPrompt = addContextToPrompt(systemPrompt, {
        statistics: context.statistics,
        streak: context.streak,
        dateRange: context.dateRange,
      });
      
      // پیام کاربر
      const userMessage = 'گزارش ماهانه من را تولید کن.';
      
      // ارسال به AI
      const response = await this.provider.chat({
        messages: [{ role: 'user', content: userMessage }],
        systemPrompt,
        temperature: 0.5, // متوسط
      });
      
      return response;
    } catch (error: any) {
      console.error('[AIService] Monthly report error:', error);
      throw new Error(`خطا در تولید گزارش ماهانه: ${error.message}`);
    }
  }

  // ============================================================
  // 6. راهنمایی برای بهبود (8.1.5)
  // ============================================================

  /**
   * ارائه راهنمایی برای بهبود
   * @param userId - شناسه کاربر
   * @param area - حوزه بهبود (اختیاری)
   */
  async provideImprovementGuide(userId: string, area?: string): Promise<ChatResponse> {
    try {
      // دریافت context سبک
      const context = await buildChatContext(userId);
      
      // ساخت system prompt
      let systemPrompt = SYSTEM_PROMPTS.IMPROVEMENT_GUIDE;
      systemPrompt = addContextToPrompt(systemPrompt, {
        completionRate: context.stats.completionRate,
        currentStreak: context.stats.currentStreak,
        totalCommitments: context.stats.totalCommitments,
      });
      
      // پیام کاربر
      let userMessage = 'برای بهبود رشد و پیشرفتم، راهکارهای عملی بده.';
      
      if (area) {
        userMessage = `برای بهبود در حوزه "${area}"، راهکارهای عملی بده.`;
      }
      
      // ارسال به AI
      const response = await this.provider.chat({
        messages: [{ role: 'user', content: userMessage }],
        systemPrompt,
        temperature: 0.7,
      });
      
      return response;
    } catch (error: any) {
      console.error('[AIService] Improvement guide error:', error);
      throw new Error(`خطا در ارائه راهنمایی بهبود: ${error.message}`);
    }
  }

  // ============================================================
  // 7. پیشنهاد اهداف (8.1.3)
  // ============================================================

  /**
   * پیشنهاد اهداف بر اساس تاریخچه کاربر
   * @param userId - شناسه کاربر
   * @param count - تعداد اهداف (پیش‌فرض ۵)
   */
  async suggestGoals(userId: string, count: number = 5): Promise<ChatResponse> {
    try {
      // دریافت context
      const context = await buildChatContext(userId);
      
      // ساخت system prompt
      let systemPrompt = SYSTEM_PROMPTS.GOAL_SUGGESTER;
      systemPrompt = addContextToPrompt(systemPrompt, {
        completionRate: context.stats.completionRate,
        currentStreak: context.stats.currentStreak,
        totalReflections: context.stats.totalReflections,
        activePlans: context.stats.activePlans,
      });
      
      // پیام کاربر
      const userMessage = `بر اساس سابقه من، ${count} تا هدف هوشمندانه (SMART) پیشنهاد بده.`;
      
      // ارسال به AI
      const response = await this.provider.chat({
        messages: [{ role: 'user', content: userMessage }],
        systemPrompt,
        temperature: 0.8, // خلاقانه
      });
      
      return response;
    } catch (error: any) {
      console.error('[AIService] Goal suggestion error:', error);
      throw new Error(`خطا در پیشنهاد اهداف: ${error.message}`);
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  /**
   * دریافت اطلاعات Provider فعلی
   */
  getProviderInfo() {
    return {
      name: this.provider.getProviderName(),
      type: aiClient.getProviderType(),
    };
  }

  /**
   * چک کردن سلامت سرویس
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; provider: string }> {
    try {
      // یک تست ساده
      await this.provider.chat({
        messages: [{ role: 'user', content: 'سلام' }],
        systemPrompt: SYSTEM_PROMPTS.GENERIC,
        temperature: 0.5,
      });

      return {
        status: 'healthy',
        provider: this.provider.getProviderName(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.provider.getProviderName(),
      };
    }
  }
}

// ============================================================
// Export singleton instance
// ============================================================

export const aiService = new AIService();
