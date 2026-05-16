# معماری سیستم AI در همسو (Hamsou AI Architecture)

<div dir="rtl">

**نسخه:** 1.0.0  
**تاریخ:** ۳۰ ژانویه ۲۰۲۵  
**وضعیت:** در حال توسعه

</div>

---

## 📋 فهرست مطالب

1. [مقدمه و هدف](#مقدمه-و-هدف)
2. [چالش‌ها و نیازمندی‌ها](#چالش‌ها-و-نیازمندی‌ها)
3. [معماری کلی](#معماری-کلی)
4. [ساختار فایل‌ها](#ساختار-فایل‌ها)
5. [توضیح کامپوننت‌ها](#توضیح-کامپوننت‌ها)
6. [System Prompts](#system-prompts)
7. [Context Builders](#context-builders)
8. [AI Service](#ai-service)
9. [Environment Variables](#environment-variables)
10. [نحوه استفاده](#نحوه-استفاده)
11. [نحوه تغییر سرویس AI](#نحوه-تغییر-سرویس-ai)
12. [مزایا و تصمیمات طراحی](#مزایا-و-تصمیمات-طراحی)
13. [مثال‌های کاربردی](#مثال‌های-کاربردی)
14. [آینده و توسعه](#آینده-و-توسعه)

---

## مقدمه و هدف

### هدف اصلی
سیستم AI در همسو برای ارائه قابلیت‌های هوشمند زیر طراحی شده:

1. **چت‌بات اختصاصی** - پاسخ به سوالات کاربران
2. **تحلیل پیشرفت** - ارائه بینش‌های عمیق از داده‌های کاربر
3. **پیشنهاد تعهدات** - پیشنهاد اهداف هوشمندانه
4. **تحلیل احساسی** - بررسی خلق‌وخوی و سلامت روان

### چالش اصلی
<div dir="rtl">

هر کدام از قابلیت‌های بالا **نوع داده**، **سیستم پرامپت** و **نوع خروجی** متفاوتی دارند. مثلاً:

- چت‌بات: سوالات عمومی، لحن دوستانه
- تحلیل پیشرفت: داده‌های خام، نقش کوچ و مشاور
- پیشنهاد تعهد: سابقه کاربر، نقش متخصص برنامه‌ریزی

علاوه بر این، **سیستم باید انعطاف‌پذیر باشد** تا اگر فردا نیاز به تغییر سرویس AI (مثلاً از z-ai به OpenAI) داشتیم، معماری و ساختار کد آسیب نبیند.

</div>

---

## چالش‌ها و نیازمندی‌ها

### ۱. تنوع Use Case ها

| Use Case | نوع داده | نقش AI | خروجی |
|----------|----------|---------|--------|
| چت‌بات | سوالات متفرقه | دستیار دوستانه | پاسخ متنی |
| تحلیل پیشرفت | تعهدات، بازتف‌ها، برنامه‌ها | کوچ و مشاور | تحلیل و راهکار |
| پیشنهاد تعهد | سابقه کاربر | متخصص برنامه‌ریزی | لیست پیشنهاد |
| تحلیل احساسی | متن بازتف‌ها | روانشناس | تحلیل mood |

### ۲. انعطاف‌پذیری در سرویس AI
- ممکن است فردا نیاز به تغییر از `z-ai-web-dev-sdk` به OpenAI یا Anthropic داشته باشیم
- ممکن است محدودیت‌های Rate Limit یا هزینه‌ها تغییر کند
- ممکن است Provider جدیدی وارد بازار شود

### ۳. نگهداری و توسعه
- کد باید خوانا و قابل فهم باشد
- تغییرات باید ساده و کم‌خطر باشد
- تست‌نویسی باید آسان باشد

---

## معماری کلی

### دیاگرام ساده

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                          │
│  (Frontend: Chat UI, Analytics Dashboard, etc.)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes Layer                          │
│  /api/ai/chat, /api/ai/analyze, /api/ai/suggest              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Service Layer                          │
│  (Business Logic, High-level Operations)                     │
│  - chat()                                                     │
│  - analyzeUser()                                              │
│  - suggestCommitments()                                       │
│  - analyzeSentiment()                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     AI Client Layer                          │
│  (Factory Pattern, Singleton)                                │
│  - مدیریت Provider                                           │
│  - انتخاب Provider بر اساس Environment Variable             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Provider Layer (Abstraction)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              BaseAIProvider (Abstract)               │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                                 │
│              ┌───────────────┼───────────────┐                 │
│              ▼               ▼               ▼                 │
│  ┌──────────────────┐ ┌──────────┐ ┌────────────────┐        │
│  │  ZAIProvider     │ │ OpenAI   │ │  Anthropic     │        │
│  │  (فعلی)          │ │ Provider │ │  Provider      │        │
│  └──────────────────┘ └──────────┘ └────────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   External AI Services                        │
│  - z-ai-web-dev-sdk (فعلی)                                   │
│  - OpenAI API (آینده - آپشنال)                               │
│  - Anthropic API (آینده - آپشنال)                            │
└─────────────────────────────────────────────────────────────┘
```

### اصول طراحی

1. **Dependency Inversion** - کد به Interface وابسته است، نه به Implementation
2. **Single Responsibility** - هر کامپوننت فقط یک کار انجام می‌دهد
3. **Open/Closed Principle** - باز برای توسعه، بسته برای تغییر
4. **Factory Pattern** - ایجاد Providerها از طریق Factory
5. **Singleton Pattern** - AI Client فقط یک instance دارد

---

## ساختار فایل‌ها

```
src/lib/ai/
├── types.ts                    # TypeScript Types و Interfaces
├── providers/
│   ├── base.ts                 # Base Abstract Class
│   ├── zai-provider.ts         # Implementation با z-ai-web-dev-sdk
│   ├── openai-provider.ts      # Implementation با OpenAI (آینده)
│   └── anthropic-provider.ts   # Implementation با Anthropic (آینده)
├── system-prompts.ts           # System Prompts برای هر Use Case
├── context-builders.ts         # Context Data Builders
├── ai-client.ts                # Main AI Client (Factory)
├── ai-service.ts               # High-level AI Service
└── index.ts                    # Exports اصلی
```

---

## توضیح کامپوننت‌ها

### ۱. Types & Interfaces (`types.ts`)

فایل شامل تمام TypeScript Types و Interfaces مورد نیاز سیستم.

```typescript
export interface AIProvider {
  chat(params: ChatParams): Promise<ChatResponse>;
  analyzeSentiment(text: string): Promise<SentimentAnalysis>;
}

export interface ChatParams {
  messages: Message[];
  systemPrompt: string;
  temperature?: number;
  context?: Record<string, any>;
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 0-1
  keywords?: string[];
}

export type AIProviderType = 'zai' | 'openai' | 'anthropic';
```

### ۲. Base Provider (`providers/base.ts`)

کلاس Abstract که تمام Providerها باید آن را پیاده‌سازی کنند.

```typescript
import { AIProvider, ChatParams, ChatResponse, SentimentAnalysis } from '../types';

export abstract class BaseAIProvider implements AIProvider {
  abstract chat(params: ChatParams): Promise<ChatResponse>;
  abstract analyzeSentiment(text: string): Promise<SentimentAnalysis>;
  
  // متدهای کمکی مشترک
  protected formatMessages(messages: Message[], systemPrompt: string): Message[] {
    return [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];
  }
}
```

### ۳. ZAI Provider (`providers/zai-provider.ts`)

Implementation فعلی با استفاده از `z-ai-web-dev-sdk`.

```typescript
import ZAI from 'z-ai-web-dev-sdk';
import { BaseAIProvider } from './base';
import { ChatParams, ChatResponse, SentimentAnalysis } from '../types';

export class ZAIProvider extends BaseAIProvider {
  private zai: any;
  
  async init() {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
  }
  
  async chat(params: ChatParams): Promise<ChatResponse> {
    await this.init();
    
    const messages = this.formatMessages(params.messages, params.systemPrompt);
    
    const completion = await this.zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
      temperature: params.temperature || 0.7,
    });
    
    return {
      content: completion.choices[0]?.message?.content || '',
      usage: completion.usage,
    };
  }
  
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    const response = await this.chat({
      messages: [{ role: 'user', content: text }],
      systemPrompt: 'تو تحلیل‌گر احساسی هستی. فقط JSON خروجی بده: {"sentiment": "positive/neutral/negative", "score": 0-1}',
    });
    
    return JSON.parse(response.content);
  }
}
```

### ۴. OpenAI Provider (`providers/openai-provider.ts`)

Implementation آینده با OpenAI (اختیاری).

```typescript
import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import { ChatParams, ChatResponse, SentimentAnalysis } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({ apiKey });
  }
  
  async chat(params: ChatParams): Promise<ChatResponse> {
    const messages = this.formatMessages(params.messages, params.systemPrompt);
    
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: params.temperature || 0.7,
    });
    
    return {
      content: completion.choices[0]?.message?.content || '',
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    };
  }
  
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // Implementation با OpenAI
  }
}
```

### ۵. AI Client (`ai-client.ts`)

Factory Pattern برای ایجاد و مدیریت Providerها.

```typescript
import { AIProvider, AIProviderType } from './types';
import { ZAIProvider } from './providers/zai-provider';
import { OpenAIProvider } from './providers/openai-provider';

class AIClient {
  private static instance: AIClient;
  private provider: AIProvider;
  
  private constructor() {
    const providerType = (process.env.AI_PROVIDER as AIProviderType) || 'zai';
    this.provider = this.createProvider(providerType);
  }
  
  private createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case 'zai':
        return new ZAIProvider();
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY is required for OpenAI provider');
        }
        return new OpenAIProvider(process.env.OPENAI_API_KEY);
      default:
        throw new Error(`Unknown AI provider: ${type}`);
    }
  }
  
  static getInstance(): AIClient {
    if (!AIClient.instance) {
      AIClient.instance = new AIClient();
    }
    return AIClient.instance;
  }
  
  getProvider(): AIProvider {
    return this.provider;
  }
}

export const aiClient = AIClient.getInstance();
```

---

## System Prompts

### فایل `system-prompts.ts`

شامل System Prompt های اختصاصی برای هر Use Case.

```typescript
export const SYSTEM_PROMPTS = {
  // چت‌بات اختصاصی همسو
  CHAT_BOT: `تو دستیار هوشمند همسو هستی.

نقش تو:
- کمک به کاربر برای رشد فردی
- پاسخ به سوالات عمومی در مورد همسو
- ارائه راهنمایی و انگیزه

لحن:
- دوستانه و صمیمی
- انگیزشی و حمایت‌کننده
- محترمانه و حرفه‌ای

قوانین:
- همیشه به فارسی پاسخ بده
- اگر سوالی درباره داده‌های کاربر پرسیده شد، از context استفاده کن
- اگر سوالی خارج از حوزه همسو بود، politely decline کن
- هرگز اطلاعات حساس کاربر را reveal نکن`,

  // تحلیل پیشرفت (نقش کوچ و مشاور)
  ANALYTICS_COACH: `تو یک کوچ و مشاور حرفه‌ای رشد فردی هستی.

نقش تو:
- تحلیل داده‌های کاربر (تعهدات، بازتف‌ها، برنامه‌ها)
- شناسایی الگوهای رفتاری
- ارائه بینش‌های عمیق
- راهکار عملی برای بهبود

لحن:
- حرفه‌ای و تحلیلی
- تشویق‌کننده و سازنده
- واقع‌بین و صادق

قوانین:
- بر اساس داده‌های واقعی تحلیل کن
- همیشه راهکار عملی بده (نه فقط توصیه)
- نقاط قوت رو تقویت کن و ضعف‌ها رو روبرو شو
- از مثال‌های واقعی استفاده کن`,

  // پیشنهاد تعهدات
  COMMITMENT_SUGGESTER: `تو متخصص برنامه‌ریزی و تعهدات هستی.

نقش تو:
- تحلیل سابقه کاربر
- پیشنهاد تعهدات مناسب
- در نظر گرفتن ظرفیت واقعی کاربر
- تنوع در دسته‌بندی‌ها

لحن:
- حرفه‌ای و متخصص
- واقع‌بین و عملی
- انعطاف‌پذیر

قوانین:
- تعهدات باید قابل‌دستیاب باشن (نه خیلی سخت، نه خیلی راحت)
- تنوع در دسته‌بندی‌ها (کاری، شخصی، سلامتی، یادگیری)
- بر اساس تاریخچه پیشنهاد بده
- حداکثر ۵ تا ۷ تعهد پیشنهاد کن`,

  // تحلیل احساسی
  SENTIMENT_ANALYZER: `تو تحلیل‌گر احساسی و روانشناس هستی.

نقش تو:
- تشخیص خلق‌وخوی کاربر از متن
- شناسایی الگوهای استرس
- ارائه پیشنهاد تکنیک‌های مدیریت

لحن:
- همدلانه و حمایت‌کننده
- حرفه‌ای و محترمانه
- امیدبخش

قوانین:
- همیشه احترام به حریم خصوصی کاربر
- اگر نشانه‌های جدی مشکلات روانی دیدی، به دنبال کمک حرفه‌ای برو
- پیشنهاد‌ها باید عملی و ساده باشن
- از اصطلاحات تخصصی کمتر استفاده کن`,

  // تولید گزارش
  REPORT_GENERATOR: `تو متخصص تولید گزارش و خلاصه‌سازی هستی.

نقش تو:
- خلاصه‌سازی داده‌های کاربر
- تولید گزارش‌های خوانا
- هایلایت کردن نکات کلیدی

لحن:
- رسمی و شفاف
- مختصر و مفید
- ساختاریافته

قوانین:
- از ساختار واضح استفاده کن (بولت پوینت، هدر)
- اعداد و آمار رو هایلایت کن
- همیشه خلاصه‌ای از پیشرفت بده`,
};
```

---

## Context Builders

### فایل `context-builders.ts`

برای هر Use Case، context مناسب جمع‌آوری می‌شود.

```typescript
import { db } from '@/lib/db';

// Context برای چت‌بات (سبک)
export async function buildChatContext(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      phone: true,
    },
  });
  
  const stats = await getUserBasicStats(userId);
  
  return {
    userName: user?.name || 'کاربر',
    stats: {
      totalCommitments: stats.totalCommitments,
      completionRate: stats.completionRate,
      currentStreak: stats.currentStreak,
    },
  };
}

// Context برای تحلیل پیشرفت (کامل)
export async function buildAnalyticsContext(userId: string, dateRange: Date[]) {
  const [commitments, reflections, plans, streak, moodTrends] = await Promise.all([
    getCommitmentsInRange(userId, dateRange),
    getReflectionsInRange(userId, dateRange),
    getPlans(userId),
    getStreak(userId),
    getMoodTrends(userId, dateRange),
  ]);
  
  return {
    commitments,
    reflections,
    plans,
    streak,
    moodTrends,
    dateRange: {
      start: dateRange[0],
      end: dateRange[1],
    },
  };
}

// Context برای پیشنهاد تعهدات
export async function buildCommitmentContext(userId: string) {
  const [recentCommitments, categories, completionRates] = await Promise.all([
    getRecentCommitments(userId, 30), // ۳۰ روز اخیر
    getCommitmentCategories(userId),
    getCategoryCompletionRates(userId),
  ]);
  
  return {
    recentCommitments,
    categories,
    completionRates,
    strengths: getStrengthCategories(completionRates),
    weaknesses: getWeaknessCategories(completionRates),
  };
}

// Context برای تحلیل احساسی
export async function buildSentimentContext(userId: string, dateRange: Date[]) {
  const reflections = await getReflectionsInRange(userId, dateRange);
  
  return {
    reflections: reflections.map(r => ({
      date: r.date,
      mood: r.mood,
      achievements: r.achievements,
      challenges: r.challenges,
      learnings: r.learnings,
    })),
    moodDistribution: getMoodDistribution(reflections),
  };
}
```

---

## AI Service

### فایل `ai-service.ts`

لایه High-level که Business Logic را مدیریت می‌کند.

```typescript
import { aiClient } from './ai-client';
import { SYSTEM_PROMPTS } from './system-prompts';
import {
  buildChatContext,
  buildAnalyticsContext,
  buildCommitmentContext,
  buildSentimentContext,
} from './context-builders';
import { Message, ChatResponse } from './types';

export class AIService {
  private provider = aiClient.getProvider();
  
  // 1. چت‌بات اختصاصی
  async chat(userId: string, message: string, history: Message[]): Promise<ChatResponse> {
    const context = await buildChatContext(userId);
    const systemPrompt = `${SYSTEM_PROMPTS.CHAT_BOT}\n\nکاربر: ${context.userName}\nآمار: ${JSON.stringify(context.stats)}`;
    
    return await this.provider.chat({
      messages: history,
      systemPrompt,
      temperature: 0.7,
    });
  }
  
  // 2. تحلیل پیشرفت کاربر
  async analyzeUser(userId: string, dateRange: Date[]): Promise<ChatResponse> {
    const context = await buildAnalyticsContext(userId, dateRange);
    const systemPrompt = `${SYSTEM_PROMPTS.ANALYTICS_COACH}\n\nداده‌های کاربر:\n${JSON.stringify(context, null, 2)}`;
    
    return await this.provider.chat({
      messages: [{ role: 'user', content: 'لطفاً پیشرفت این کاربر رو تحلیل کن و راهکار بده' }],
      systemPrompt,
      temperature: 0.6, // کمتر خلاقانه، بیشتر تحلیلی
    });
  }
  
  // 3. پیشنهاد تعهدات
  async suggestCommitments(userId: string): Promise<ChatResponse> {
    const context = await buildCommitmentContext(userId);
    const systemPrompt = `${SYSTEM_PROMPTS.COMMITMENT_SUGGESTER}\n\nسابقه کاربر:\n${JSON.stringify(context, null, 2)}`;
    
    return await this.provider.chat({
      messages: [{ role: 'user', content: 'لیست تعهدات پیشنهادی بده' }],
      systemPrompt,
      temperature: 0.8, // بیشتر خلاقانه
    });
  }
  
  // 4. تحلیل احساسی
  async analyzeSentiment(userId: string, text: string): Promise<any> {
    return await this.provider.analyzeSentiment(text);
  }
  
  // 5. تولید گزارش هفتگی
  async generateWeeklyReport(userId: string, weekStart: Date, weekEnd: Date): Promise<ChatResponse> {
    const context = await buildAnalyticsContext(userId, [weekStart, weekEnd]);
    const systemPrompt = `${SYSTEM_PROMPTS.REPORT_GENERATOR}\n\nداده‌های هفته:\n${JSON.stringify(context, null, 2)}`;
    
    return await this.provider.chat({
      messages: [{ role: 'user', content: 'گزارش هفتگی خلاصه و شفاف تولید کن' }],
      systemPrompt,
      temperature: 0.5, // کمتر خلاقانه، بیشتر مستند
    });
  }
}

export const aiService = new AIService();
```

---

## Environment Variables

### فایل `.env`

```env
# انتخاب سرویس AI
AI_PROVIDER=zai  # گزینه‌ها: zai, openai, anthropic

# اگر OpenAI انتخاب شد:
# OPENAI_API_KEY=sk-...

# اگر Anthropic انتخاب شد:
# ANTHROPIC_API_KEY=sk-ant-...
```

---

## نحوه استفاده

### 1. در API Routes

```typescript
// src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/ai-service';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  const body = await request.json();
  const { message, history } = body;
  
  const response = await aiService.chat(user.id, message, history || []);
  
  return NextResponse.json({
    success: true,
    content: response.content,
  });
}
```

### 2. در Frontend

```typescript
// استفاده از API
import { authApiPost } from '@/lib/api';

const response = await authApiPost('/api/ai/chat', {
  message: 'چطور می‌تونم نرخ تکمیل تعهداتم رو افزایش بدم؟',
  history: [], // تاریخچه چت
});

console.log(response.content);
```

---

## نحوه تغییر سرویس AI

### فقط ۲ مرحله لازم است:

### ۱. Environment Variable را تغییر دهید

```env
# از:
AI_PROVIDER=zai

# به:
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### ۲. Provider جدید را پیاده‌سازی کنید (اگر وجود ندارد)

```typescript
// src/lib/ai/providers/anthropic-provider.ts
import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base';
import { ChatParams, ChatResponse } from '../types';

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({ apiKey });
  }
  
  async chat(params: ChatParams): Promise<ChatResponse> {
    // Implementation...
  }
  
  async analyzeSentiment(text: string): Promise<any> {
    // Implementation...
  }
}
```

و آن را به `ai-client.ts` اضافه کنید:

```typescript
case 'anthropic':
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is required for Anthropic provider');
  }
  return new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
```

---

## مزایا و تصمیمات طراحی

### ۱. Decoupling (کوپل نشدن)
کد اصلی به سرویس AI خاصی وابسته نیست، بلکه به Interface وابسته است.

### ۲. Easy Switch (تغییر آسان)
با تغییر یک Environment Variable، کل سرویس عوض می‌شود.

### ۳. Testability (قابلیت تست)
می‌توان Mock Provider ساخت برای Unit Tests.

### ۴. Extensibility (قابلیت توسعه)
اگر سرویس جدیدی اومد، فقط یه Provider جدید می‌سازیم.

### ۵. Single Responsibility (تک مسئولیتی)
هر کامپوننت فقط یک کار انجام می‌دهد:
- `types.ts` → تعریف Types
- `base.ts` → تعریف Interface
- `zai-provider.ts` → پیاده‌سازی ZAI
- `ai-service.ts` → Business Logic

### ۶. Maintainability (قابلیت نگهداری)
کد خوانا و ساختارمند است. تغییرات کم‌خطر هستند.

---

## مثال‌های کاربردی

### مثال ۱: چت‌بات

```typescript
const response = await aiService.chat(
  'user-123',
  'چطور می‌تونم استریکم رو افزایش بدم؟',
  [
    { role: 'user', content: 'من ۵ روز استریک دارم' },
    { role: 'assistant', content: 'عالیه! ادامه بده...' },
  ]
);
```

### مثال ۲: تحلیل پیشرفت هفتگی

```typescript
const weekStart = new Date('2025-01-20');
const weekEnd = new Date('2025-01-26');

const analysis = await aiService.analyzeUser('user-123', [weekStart, weekEnd]);
```

### مثال ۳: پیشنهاد تعهدات

```typescript
const suggestions = await aiService.suggestCommitments('user-123');
```

### مثال ۴: تحلیل احساسی

```typescript
const sentiment = await aiService.analyzeSentiment('user-123', 'امروز خیلی خسته بودم و نتونستم همه کارام رو انجام بدم');
// خروجی: { sentiment: 'negative', score: 0.7, keywords: ['خسته', 'نتونستم'] }
```

---

## آینده و توسعه

### گام‌های بعدی

1. ✅ پیاده‌سازی `ZAIProvider`
2. ⏳ پیاده‌سازی `System Prompts`
3. ⏳ پیاده‌سازی `Context Builders`
4. ⏳ پیاده‌سازی `AI Service`
5. ⏳ ساخت Frontend چت‌بات
6. ⏳ تست و تست و تست

### بهبودهای آینده

- **Caching** - Cache کردن response‌های تکراری
- **Rate Limiting** - محدود کردن درخواست‌ها برای جلوگیری از هزینه‌های بالا
- **Monitoring** - مانیتور کردن استفاده و هزینه‌ها
- **A/B Testing** - تست کردن System Prompt‌های مختلف
- **Fallback** - اگر یک Provider fail شد، از دیگری استفاده شود
- **Streaming** - Streaming response برای تجربه بهتر چت

---

## نتیجه‌گیری

این معماری به ما اجازه می‌دهد:

1. **به راحتی سرویس AI را تغییر دهیم** بدون اینکه کد اصلی آسیب ببیند
2. **Use Case های مختلف را با System Prompt‌های متفاوت مدیریت کنیم**
3. **کد تمیز، ساختاریافته و قابل نگهداری داشته باشیم**
4. **در آینده سرویس‌های جدیدی را اضافه کنیم**

<div dir="rtl">

**نکته کلیدی:** کل سیستم بر پایه **Abstraction** بنا شده است، نه Implementation. این یعنی انعطاف‌پذیری بالا و ریسک پایین برای تغییرات آینده.

</div>

---

<div align="center">

**آخرین بروزرسانی:** ۳۰ ژانویه ۲۰۲۵  
**نسخه:** 1.0.0  
**نویسنده:** Z.ai Code

</div>
