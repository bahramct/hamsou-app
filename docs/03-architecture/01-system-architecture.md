# معماری سیستم AI در همسو (Hamsou AI Architecture)

<div dir="rtl">

**نسخه:** 2.0.0  
**تاریخ:** ۳۰ ژانویه ۲۰۲۵  
**وضعیت:** ✅ Backend کامل و تمیز شده

</div>

---

## 📋 فهرست مطالب

1. [مقدمه و هدف](#مقدمه-و-هدف)
2. [اصلاحیات نسخه 2.0](#اصلاحیات-نسخه-۲۰)
3. [معماری کلی](#معماری-کلی)
4. [ساختار فایل‌ها](#ساختار-فایل‌ها)
5. [توضیح کامپوننت‌ها](#توضیح-کامپوننت‌ها)
6. [System Prompts](#system-prompts)
7. [Context Builders](#context-builders)
8. [AI Service](#ai-service)
9. [API Routes](#api-routes)
10. [امنیت و حریم خصوصی](#امنیت-و-حریم-خصوصی)
11. [Environment Variables](#environment-variables)
12. [نحوه استفاده](#نحوه-استفاده)
13. [نحوه تغییر سرویس AI](#نحوه-تغییر-سرویس-ai)
14. [مزایا و تصمیمات طراحی](#مزایا-و-تصمیمات-طراحی)
15. [آینده و توسعه](#آینده-و-توسعه)

---

## مقدمه و هدف

### هدف اصلی
سیستم AI در همسو برای ارائه قابلیت‌های هوشمند زیر طراحی شده:

1. **چت‌بات اختصاصی** - پاسخ به سوالات کاربران با context شخصی
2. **تحلیل پیشرفت** - ارائه بینش‌های عمیق از داده‌های کاربر
3. **پیشنهاد تعهدات** - پیشنهاد اهداف هوشمندانه بر اساس سابقه
4. **تحلیل احساسی** - بررسی خلق‌وخوی و سلامت روان
5. **تولید گزارش** - خلاصه‌سازی هفتگی و ماهانه

### چالش اصلی
<div dir="rtl">

هر کدام از قابلیت‌های بالا **نوع داده**، **سیستم پرامپت** و **نوع خروجی** متفاوتی دارند. مثلاً:

- چت‌بات: سوالات عمومی، لحن دوستانه
- تحلیل پیشرفت: داده‌های خام، نقش کوچ و مشاور
- پیشنهاد تعهد: سابقه کاربر، نقش متخصص برنامه‌ریزی

علاوه بر این، **سیستم باید انعطاف‌پذیر باشد** تا اگر فردا نیاز به تغییر سرویس AI (مثلاً از z-ai به OpenAI) داشتیم، معماری و ساختار کد آسیب نبیند.

**و مهم‌تر از همه:** هر کاربر **فقط** باید به داده‌های خود دسترسی داشته باشد.

</div>

---

## اصلاحیات نسخه 2.0

### ۱. تمیزسازی و متمرکزسازی API Routes

| فایل | وضعیت قبل | وضعیت بعد |
|------|-----------|-----------|
| `/api/ai/chat/route.ts` | مستقیم از ZAI SDK استفاده می‌کرد، بدون context کاربر | از `aiService` با `userId`، authentication و validation |
| `/api/reports/generate/route.ts` | از route قدیمی استفاده می‌کرد، context ناقص | از `aiClient` با context کامل کاربر و fallback logic |

### ۲. جداسازی کامل داده‌های کاربر

**قانون طلایی:** همه Context Builders و API Routes **فقط** با `userId` کار می‌کنند.

```typescript
// ❌ قبل: ممکن بود داده‌های همه کاربران گرفته شود
const commitments = await db.commitment.findMany({});

// ✅ بعد: فقط داده‌های کاربر خاص
const commitments = await db.commitment.findMany({
  where: { userId },
});
```

### ۳. استقلال کامل از پلتفرم AI

**ساختار مبتنی بر Interface:**

```
API Routes
    ↓
AI Service / AI Client
    ↓
BaseAIProvider (Interface)
    ↓
ZAIProvider (فعلی) / OpenAIProvider (آینده)
```

**برای تغییر به OpenAI:**
1. `src/lib/ai/providers/openai-provider.ts` را بسازید (extends BaseAIProvider)
2. `AI_PROVIDER=openai` در `.env` تنظیم کنید
3. هیچ تغییری در API Routes یا AI Service لازم نیست!

---

## معماری کلی

### دیاگرام کامل (نسخه 2.0)

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                          │
│  (Frontend: Chat UI, Analytics Dashboard, Reports)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes Layer                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  /api/ai/chat (POST, GET)                          │    │
│  │  - JWT Authentication                              │    │
│  │  - Zod Validation                                  │    │
│  │  - Uses aiService.chat(userId, message, history)  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  /api/reports/generate (POST)                       │    │
│  │  - JWT Authentication                              │    │
│  │  - User Context (commitments, reflections)         │    │
│  │  - Uses aiClient.getProvider().chat()             │    │
│  │  - Fallback logic                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  /api/ai/suggest-commitments (POST, GET)            │    │
│  │  - User Context only                                 │    │
│  │  - Uses aiClient.getProvider()                      │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Service Layer                          │
│  (Business Logic, High-level Operations)                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AIService Class                                     │    │
│  │  - chat(userId, message, history)                   │    │
│  │  - analyzeUser(userId, dateRange)                   │    │
│  │  - suggestCommitments(userId, count)                │    │
│  │  - analyzeSentiment(userId, text)                   │    │
│  │  - generateWeeklyReport(userId, weekStart)          │    │
│  │  - provideImprovementGuide(userId, area)            │    │
│  │  - suggestGoals(userId, count)                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Context Builders (User-Isolated):                          │
│  - buildChatContext(userId) → only user's stats             │
│  - buildAnalyticsContext(userId, range) → only user's data  │
│  - buildCommitmentContext(userId) → only user's history     │
│  - buildSentimentContext(userId, range) → only user's mood  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     AI Client Layer                          │
│  (Factory Pattern, Singleton)                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AIClient Class (Singleton)                         │    │
│  │  - Factory Pattern for Provider creation             │    │
│  │  - Selects Provider from AI_PROVIDER env var        │    │
│  │  - getProvider() → AIProvider interface             │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Provider Layer (Abstraction)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              BaseAIProvider (Abstract)               │    │
│  │  - chat(params): Promise<ChatResponse>              │    │
│  │  - analyzeSentiment(text): Promise<SentimentAnalysis>│    │
│  │  - getProviderName(): string                         │    │
│  │  - Helper methods: formatMessages, validateParams   │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                                 │
│              ┌───────────────┼───────────────┐                 │
│              ▼               ▼               ▼                 │
│  ┌──────────────────┐ ┌──────────┐ ┌────────────────┐        │
│  │  ZAIProvider     │ │ OpenAI   │ │  Anthropic     │        │
│  │  (فعلی)          │ │ Provider │ │  Provider      │        │
│  │  - z-ai-sdk      │ │ (آینده)  │ │  (آینده)       │        │
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
6. **User Isolation** - هر کاربر فقط به داده‌های خود دسترسی دارد

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
├── context-builders.ts         # Context Data Builders (User-Isolated)
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
  getProviderName(): string;
}

export interface ChatParams {
  messages: Message[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  context?: Record<string, any>;
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SentimentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 0-1
  keywords?: string[];
  confidence?: number;
}

export type AIProviderType = 'zai' | 'openai' | 'anthropic';
```

### ۲. Base Provider (`providers/base.ts`)

کلاس Abstract که تمام Providerها باید آن را پیاده‌سازی کنند.

```typescript
import { AIProvider, ChatParams, ChatResponse, SentimentAnalysis } from '../types';

export abstract class BaseAIProvider implements AIProvider {
  protected initialized: boolean = false;

  protected abstract initProvider(): Promise<void>;
  abstract chat(params: ChatParams): Promise<ChatResponse>;
  abstract analyzeSentiment(text: string): Promise<SentimentAnalysis>;
  abstract getProviderName(): string;

  // Helper methods
  protected formatMessages(messages: Message[], systemPrompt: string): Message[] {
    return [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];
  }

  protected validateChatParams(params: ChatParams): void {
    if (!params.messages || !Array.isArray(params.messages)) {
      throw new Error('messages must be an array');
    }
    // ...
  }

  protected getTemperature(params: ChatParams): number {
    return params.temperature ?? 0.7;
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
  private instance: any = null;

  protected async initProvider(): Promise<void> {
    if (!this.instance) {
      this.instance = await ZAI.create();
      this.zai = this.instance;
    }
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    await this.init();
    this.validateChatParams(params);

    const messages = this.formatMessages(params.messages, params.systemPrompt);

    const completion = await this.zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
      temperature: this.getTemperature(params),
      maxTokens: params.maxTokens,
    });

    return {
      content: this.extractContent(completion),
      usage: this.extractUsage(completion),
      model: 'zai-chat',
    };
  }

  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    // Implementation with fallback
  }

  getProviderName(): string {
    return 'ZAI (z-ai-web-dev-sdk)';
  }
}
```

### ۴. AI Client (`ai-client.ts`)

Factory Pattern برای ایجاد و مدیریت Providerها.

```typescript
import { AIProvider, AIProviderType } from './types';
import { ZAIProvider } from './providers/zai-provider';

class AIClient {
  private static instance: AIClient | null = null;
  private provider: AIProvider;
  private providerType: AIProviderType;

  private constructor() {
    this.providerType = (process.env.AI_PROVIDER as AIProviderType) || 'zai';
    this.provider = this.createProvider(this.providerType);
  }

  static getInstance(): AIClient {
    if (!AIClient.instance) {
      AIClient.instance = new AIClient();
    }
    return AIClient.instance;
  }

  private createProvider(type: AIProviderType): AIProvider {
    switch (type) {
      case 'zai':
        return new ZAIProvider();
      case 'openai':
        throw new Error('OpenAI provider is not implemented yet. Use "zai" provider.');
      case 'anthropic':
        throw new Error('Anthropic provider is not implemented yet. Use "zai" provider.');
      default:
        throw new Error(`Unknown AI provider: ${type}`);
    }
  }

  getProvider(): AIProvider {
    return this.provider;
  }

  getProviderType(): AIProviderType {
    return this.providerType;
  }
}

export const aiClient = AIClient.getInstance();
```

---

## System Prompts

### فایل `system-prompts.ts`

شامل System Prompt های اختصاصی برای هر Use Case.

| System Prompt | نقش AI | لحن | استفاده |
|---------------|---------|-----|---------|
| `CHAT_BOT` | دستیار دوستانه | دوستانه، انگیزشی | چت‌بات |
| `ANALYTICS_COACH` | کوچ و مشاور | حرفه‌ای، تحلیلی | تحلیل پیشرفت |
| `COMMITMENT_SUGGESTER` | متخصص برنامه‌ریزی | حرفه‌ای، واقع‌بین | پیشنهاد تعهدات |
| `SENTIMENT_ANALYZER` | روانشناس | همدلانه، حمایت‌کننده | تحلیل احساسی |
| `REPORT_GENERATOR` | متخصص گزارش | رسمی، شفاف | گزارش هفتگی/ماهانه |
| `IMPROVEMENT_GUIDE` | راهنمای بهبود | حمایت‌کننده، عملی | راهنمایی بهبود |
| `GOAL_SUGGESTER` | متخصص تعیین اهداف | حرفه‌ای، الهام‌بخش | پیشنهاد اهداف |
| `GENERIC` | دستیار عمومی | دوستانه | استفاده‌های عمومی |

**قوانین مشترک:**
- همیشه به فارسی پاسخ بده
- فقط از context ارائه شده استفاده کن
- اطلاعات حساس کاربر را reveal نکن
- اگر سوالی خارج از حوزه بود، politely decline کن

---

## Context Builders

### فایل `context-builders.ts`

برای هر Use Case، context مناسب **فقط برای آن کاربر** جمع‌آوری می‌شود.

**قانون طلایی:** همه Context Builders فقط `userId` می‌گیرند و فقط داده‌های آن کاربر برمی‌گردانند.

```typescript
// ✅ درست - فقط داده‌های کاربر
export async function buildChatContext(userId: string): Promise<ChatContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const stats = await getUserBasicStats(userId);

  return {
    userName: user?.name || 'کاربر',
    stats: {
      totalCommitments: stats.totalCommitments,
      completionRate: stats.completionRate,
      currentStreak: stats.currentStreak,
      // فقط آمار کاربر خاص
    },
  };
}

// ✅ درست - فقط داده‌های کاربر در بازه زمانی
export async function buildAnalyticsContext(
  userId: string,
  dateRange: [Date, Date]
): Promise<AnalyticsContext> {
  const [commitments, reflections, plans] = await Promise.all([
    getCommitmentsInRange(userId, startDate, endDate),  // فقط کاربر
    getReflectionsInRange(userId, startDate, endDate),  // فقط کاربر
    getPlans(userId),  // فقط کاربر
  ]);

  return {
    commitments,  // فقط تعهدات کاربر
    reflections,  // فقط بازتف‌های کاربر
    plans,        // فقط برنامه‌های کاربر
    // ...
  };
}
```

| Context Builder | ورودی | خروجی | فیلتر کاربر |
|-----------------|-------|--------|------------|
| `buildChatContext()` | `userId` | آمار پایه کاربر | ✅ |
| `buildAnalyticsContext()` | `userId`, `dateRange` | داده‌های تحلیلی کاربر | ✅ |
| `buildCommitmentContext()` | `userId` | سابقه تعهدات کاربر | ✅ |
| `buildSentimentContext()` | `userId`, `dateRange` | بازتف‌ها و mood کاربر | ✅ |
| `buildWeeklyReportContext()` | `userId`, `weekStart` | داده‌های هفتگی کاربر | ✅ |
| `buildMonthlyReportContext()` | `userId`, `monthStart` | داده‌های ماهانه کاربر | ✅ |

---

## AI Service

### فایل `ai-service.ts`

لایه High-level که Business Logic را مدیریت می‌کند.

```typescript
import { aiClient } from './ai-client';
import { SYSTEM_PROMPTS, addContextToPrompt, addUserNameToPrompt } from './system-prompts';
import {
  buildChatContext,
  buildAnalyticsContext,
  buildCommitmentContext,
  buildSentimentContext,
} from './context-builders';

export class AIService {
  private provider = aiClient.getProvider();

  // 1. چت‌بات اختصاصی
  async chat(userId: string, message: string, history: Message[] = []): Promise<ChatResponse> {
    // فقط context کاربر
    const context = await buildChatContext(userId);

    // ساخت system prompt با context
    let systemPrompt = SYSTEM_PROMPTS.CHAT_BOT;
    systemPrompt = addUserNameToPrompt(systemPrompt, context.userName);
    systemPrompt = addContextToPrompt(systemPrompt, context.stats);

    // ارسال به AI
    const messages: Message[] = [...history, { role: 'user' as const, content: message }];
    return await this.provider.chat({
      messages,
      systemPrompt,
      temperature: 0.7,
    });
  }

  // 2. تحلیل پیشرفت کاربر
  async analyzeUser(userId: string, dateRange: [Date, Date]): Promise<ChatResponse> {
    // فقط context کاربر
    const context = await buildAnalyticsContext(userId, dateRange);

    let systemPrompt = SYSTEM_PROMPTS.ANALYTICS_COACH;
    systemPrompt = addContextToPrompt(systemPrompt, {
      statistics: context.statistics,
      streak: context.streak,
      // فقط داده‌های کاربر
    });

    return await this.provider.chat({
      messages: [{ role: 'user', content: 'تحلیل کامل بده' }],
      systemPrompt,
      temperature: 0.6,
    });
  }

  // ... سایر متدها با همان الگو
}

export const aiService = new AIService();
```

---

## API Routes

### `/api/ai/chat` - چت‌بات اختصاصی

```typescript
// POST /api/ai/chat
export async function POST(request: NextRequest) {
  // 1. Authentication
  const authHeader = request.headers.get('authorization');
  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

  // 2. Validation
  const body = await request.json();
  const { message, history } = chatRequestSchema.parse(body);

  // 3. استفاده از aiService با userId (فقط context کاربر)
  const response = await aiService.chat(decoded.userId, message, history || []);

  return NextResponse.json({
    success: true,
    content: response.content,
    usage: response.usage,
  });
}

// GET /api/ai/chat - Health check
export async function GET(request: NextRequest) {
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

  const health = await aiService.healthCheck();
  const providerInfo = aiService.getProviderInfo();

  return NextResponse.json({
    success: true,
    health,
    provider: providerInfo,
    availableSystemPrompts: ['CHAT_BOT', 'ANALYTICS_COACH', ...],
  });
}
```

### `/api/reports/generate` - گزارش هفتگی

```typescript
// POST /api/reports/generate
export async function POST(request: NextRequest) {
  // 1. Authentication
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

  // 2. دریافت گزارش کاربر
  const report = await db.weeklyReport.findFirst({
    where: {
      id: reportId,
      userId: decoded.userId,  // فقط گزارش کاربر
    },
  });

  // 3. دریافت تعهدات کاربر (فقط کاربر)
  const commitments = await db.commitment.findMany({
    where: {
      userId: decoded.userId,  // فقط تعهدات کاربر
      date: { gte: report.weekStart, lte: report.weekEnd },
    },
  });

  // 4. ساخت context با داده‌های کاربر
  const context = {
    userId: decoded.userId,
    totalCommitments: commitments.length,
    // فقط آمار کاربر
  };

  // 5. ارسال به AI
  const provider = aiClient.getProvider();
  const response = await provider.chat({
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt: addContextToPrompt(systemPrompt, context),
    temperature: 0.7,
  });

  // 6. Fallback logic در صورت خطا
  if (!response) {
    // گزارش ساده بر اساس آمار کاربر
  }
}
```

---

## امنیت و حریم خصوصی

### ۱. جداسازی داده‌های کاربر

**قانون:** هر `userId` فقط به داده‌های خود دسترسی دارد.

```typescript
// ✅ درست - فقط داده‌های کاربر
const commitments = await db.commitment.findMany({
  where: { userId: decoded.userId },
});

// ❌ غلط - دسترسی به همه داده‌ها
const commitments = await db.commitment.findMany({});
```

### ۲. Authentication

**همه API Routes:**
- از JWT برای احراز هویت استفاده می‌کنند
- `userId` از token استخراج می‌شود
- اگر token نامعتبر باشد، 401 بازگردانده می‌شود

### ۳. Context Isolation

**تمام Context Builders:**
- فقط `userId` می‌گیرند
- فقط داده‌های کاربر برمی‌گردانند
- هیچ data leakage وجود ندارد

### ۴. System Prompts

**تمام System Prompts:**
- شامل قانون عدم افشای اطلاعات حساس هستند
- فقط از context ارائه شده استفاده می‌کنند
- هیچ دسترسی به داده‌های دیگر کاربران ندارند

---

## Environment Variables

```env
# انتخاب سرویس AI
AI_PROVIDER=zai  # گزینه‌ها: zai, openai, anthropic

# اگر OpenAI انتخاب شد:
# OPENAI_API_KEY=sk-...

# اگر Anthropic انتخاب شد:
# ANTHROPIC_API_KEY=sk-ant-...

# JWT Secret برای Authentication
JWT_SECRET=your-secret-key
```

---

## نحوه استفاده

### 1. در API Routes (الگوی استاندارد)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  // 1. Authentication
  const authHeader = request.headers.get('authorization');
  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

  // 2. دریافت ورودی
  const body = await request.json();
  const { message, history } = body;

  // 3. استفاده از aiService با userId (فقط context کاربر)
  const response = await aiService.chat(decoded.userId, message, history || []);

  return NextResponse.json({
    success: true,
    content: response.content,
  });
}
```

### 2. در Frontend

```typescript
import { authApiPost } from '@/lib/api';

const response = await authApiPost('/api/ai/chat', {
  message: 'چطور می‌تونم نرخ تکمیل تعهداتم رو افزایش بدم؟',
  history: [],
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
// src/lib/ai/providers/openai-provider.ts
import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import { ChatParams, ChatResponse, SentimentAnalysis } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({ apiKey });
  }

  protected async initProvider(): Promise<void> {
    // Initialize if needed
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    const messages = this.formatMessages(params.messages, params.systemPrompt);

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: this.getTemperature(params),
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
    // Implementation
  }

  getProviderName(): string {
    return 'OpenAI (GPT-4)';
  }
}
```

و آن را به `ai-client.ts` اضافه کنید:

```typescript
case 'openai':
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for OpenAI provider');
  }
  return new OpenAIProvider(process.env.OPENAI_API_KEY);
```

---

## مزایا و تصمیمات طراحی

### ۱. Decoupling (کوپل نشدن)
کد اصلی به سرویس AI خاصی وابسته نیست، بلکه به Interface وابسته است.

### ۲. Easy Switch (تغییر آسان)
با تغییر یک Environment Variable، کل سرویس عوض می‌شود.

### 3. Testability (قابلیت تست)
می‌توان Mock Provider ساخت برای Unit Tests.

### 4. Extensibility (قابلیت توسعه)
اگر سرویس جدیدی اومد، فقط یه Provider جدید می‌سازیم.

### 5. User Isolation (جداسازی کاربران)
هر کاربر فقط به داده‌های خود دسترسی دارد. هیچ data leakage وجود ندارد.

### 6. Single Responsibility (تک مسئولیتی)
هر کامپوننت فقط یک کار انجام می‌دهد:
- `types.ts` → تعریف Types
- `base.ts` → تعریف Interface
- `zai-provider.ts` → پیاده‌سازی ZAI
- `ai-service.ts` → Business Logic
- `context-builders.ts` → جمع‌آوری context کاربر

### 7. Maintainability (قابلیت نگهداری)
کد خوانا و ساختارمند است. تغییرات کم‌خطر هستند.

---

## آینده و توسعه

### ✅ تکمیل شده (نسخه 2.0)
1. ✅ پیاده‌سازی `ZAIProvider`
2. ✅ پیاده‌سازی `System Prompts` (8 نوع)
3. ✅ پیاده‌سازی `Context Builders` (6 نوع با userId)
4. ✅ پیاده‌سازی `AI Service` (9 متد)
5. ✅ **تمیزسازی API Routes**
6. ✅ **Authentication و Validation در تمام routes**
7. ✅ **جداسازی کامل داده‌های کاربر**

### ⏳ گام‌های بعدی
- [ ] چت‌بات Frontend
- [ ] ذخیره تاریخچه چت در دیتابیس
- [ ] پیاده‌سازی `OpenAIProvider` برای انعطاف‌پذیری
- [ ] Streaming responses
- [ ] Voice input (ASR) و output (TTS)

### 📋 بهبودهای آینده

- **Caching** - Cache کردن response‌های تکراری
- **Rate Limiting** - محدود کردن درخواست‌ها
- **Monitoring** - مانیتور کردن استفاده و هزینه‌ها
- **A/B Testing** - تست کردن System Prompt‌های مختلف
- **Fallback Providers** - اگر یک Provider fail شد، از دیگری استفاده شود
- **Streaming** - Streaming response برای تجربه بهتر چت

---

## نتیجه‌گیری

این معماری به ما اجازه می‌دهد:

1. **به راحتی سرویس AI را تغییر دهیم** بدون اینکه کد اصلی آسیب ببیند
2. **Use Case های مختلف را با System Prompt‌های متفاوت مدیریت کنیم**
3. **کد تمیز، ساختاریافته و قابل نگهداری داشته باشیم**
4. **در آینده سرویس‌های جدیدی را اضافه کنیم**
5. **اطمینان حاصل کنیم که هر کاربر فقط به داده‌های خود دسترسی دارد**

<div dir="rtl">

**نکات کلیدی:**
- کل سیستم بر پایه **Abstraction** بنا شده است، نه Implementation
- **هر کاربر فقط به داده‌های خود دسترسی دارد**
- **تمام API Routes احراز هویت و validation دارند**
- **برای تغییر پلتفرم AI فقط یک Provider جدید لازم است**

</div>

---

<div align="center">

**آخرین بروزرسانی:** ۳۰ ژانویه ۲۰۲۵  
**نسخه:** 2.0.0  
**نویسنده:** Z.ai Code

</div>
