# راهنمای ادغام سرویس AI جدید (GapGPT) در همسو

<div dir="rtl">

**تاریخ:** ۱۸ ژانویه ۲۰۲۶  
**وضعیت:** ✅ بررسی شده و آماده پیاده‌سازی  
**سرویس:** GapGPT (OpenAI-compatible)

</div>

---

## 📋 فهرست مطالب

1. [بررسی سازگاری سرویس](#بررسی-سازگاری-سرویس)
2. [معماری فعلی سیستم AI](#معماری-فعلی-سیستم-ai)
3. [روش ادغام بدون تغییر کد](#روش-ادغام-بدون-تغییر-کد)
4. [مرحله به مرحله: ساخت Provider جدید](#مرحله-به-مرحله-ساخت-provider-جدید)
5. [تنظیمات Environment](#تنظیمات-environment)
6. [تست و Verification](#تست-و-verification)
7. [مزایا و معایب](#مزایا-ومعایب)
8. [سوالات متداول](#سوالات-متداول)

---

## بررسی سازگاری سرویس

### مشخصات سرویس GapGPT

| ویژگی | مقدار | سازگار؟ |
|--------|-------|---------|
| **Base URL** | `https://api.gapgpt.app/v1` | ✅ قابل تنظیم |
| **احراز هویت** | API Key | ✅ پشتیبانی می‌شود |
| **مدل** | `gpt-4o-mini` | ✅ قابل تغییر |
| **Endpoint** | `POST /v1/chat/completions` | ✅ استاندارد OpenAI |
| **SDK** | OpenAI SDK | ✅ کاملاً سازگار |
| **ساختار Response** | OpenAI Format | ✅ سازگار |

### نمونه کد سرویس

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://api.gapgpt.app/v1',
  apiKey: 'xxx'
});

const response = await client.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'سلام!' }]
});

console.log(response.choices[0].message.content);
```

### نتیجه بررسی

✅ **سرویس کاملاً OpenAI-compatible است**  
✅ **ساختار API مطابق استاندارد OpenAI است**  
✅ **می‌توان از OpenAI SDK استفاده کرد**  
✅ **قابلیت ادغام کامل با معماری فعلی دارد**  

---

## معماری فعلی سیستم AI

### دیاگرام لایه‌ها

```
Frontend
    ↓ (API Calls)
API Routes (/api/ai/*, /api/reports/*)
    ↓ (فراخوانی)
AI Service (Business Logic)
    ↓ (Context + userId)
AI Client (Factory + Singleton)
    ↓ (selects based on .env)
AIProvider Interface ← Contract
    ↓ (extends)
BaseAIProvider ← Abstract Class
    ↓ (implements)
ZAIProvider ← Current Implementation
```

### فایل‌های کلیدی

| فایل | وظیفه | وابستگی |
|------|-------|----------|
| `src/lib/ai/types.ts` | Interfaces و Types | هیچ |
| `src/lib/ai/providers/base.ts` | Base Abstract Class | types |
| `src/lib/ai/providers/zai-provider.ts` | ZAI Implementation | base, types |
| `src/lib/ai/ai-client.ts` | Factory + Singleton | providers |
| `src/lib/ai/ai-service.ts` | Business Logic | ai-client |
| `src/app/api/ai/*` | API Routes | ai-service |

### Provider Type در Types

```typescript
// src/lib/ai/types.ts
export type AIProviderType = 'zai' | 'openai' | 'anthropic';
```

**نکته مهم:** Type `openai` قبلاً در سیستم تعریف شده است.

### Factory در AI Client

```typescript
// src/lib/ai/ai-client.ts
private createProvider(type: AIProviderType): AIProvider {
  switch (type) {
    case 'zai':
      return new ZAIProvider();

    case 'openai':
      // TODO: بعداً اضافه شود
      throw new Error('OpenAI provider is not implemented yet. Please use "zai" provider.');

    case 'anthropic':
      // TODO: بعداً اضافه شود
      throw new Error('Anthropic provider is not implemented yet. Please use "zai" provider.');

    default:
      throw new Error(`Unknown AI provider: ${type}`);
  }
}
```

---

## روش ادغام بدون تغییر کد

### اصل کلیدی

> **شما نیازی به تغییر هیچ کد موجود ندارید!**
>
> فقط یک فایل جدید اضافه کنید: `gapgpt-provider.ts`

### استراتژی

از آنجا که سرویس GapGPT OpenAI-compatible است، می‌توانیم یک Provider جدید بسازیم که:

1. از OpenAI SDK استفاده کند
2. `BaseAIProvider` را extend کند
3. تمام متدهای abstract را پیاده‌سازی کند
4. با GapGPT API کار کند

### مزایای این روش

| مزیت | توضیح |
|------|-------|
| ✅ **بدون تغییر کد موجود** | همه فایل‌های فعلی بدون تغییر باقی می‌مانند |
| ✅ **معماری حفظ می‌شود** | الگوهای طراحی فعلی رعایت می‌شوند |
| ✅ **قابل revert** | اگر مشکلی پیش آمد، ساده revert کنید |
| ✅ **A/B Testing** | می‌توانید هر دو provider را تست کنید |
| ✅ **Failover** | می‌توانید به سرور ZAI برگردید |

---

## مرحله به مرحله: ساخت Provider جدید

### مرحله ۱: ساخت فایل Provider جدید

**مسیر:** `src/lib/ai/providers/gapgpt-provider.ts`

**محتوای پیشنهادی:**

```typescript
/**
 * GapGPT Provider Implementation
 *
 * این Provider از سرویس GapGPT (OpenAI-compatible) استفاده می‌کند.
 * از OpenAI SDK برای ارتباط با API استفاده می‌شود.
 *
 * مستندات: https://api.gapgpt.app/v1
 * مدل پیشنهادی: gpt-4o-mini
 */

import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import { ChatParams, ChatResponse, SentimentAnalysis } from '../types';

export class GapGPTProvider extends BaseAIProvider {
  private client: OpenAI | null = null;
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(
    baseURL?: string,
    apiKey?: string,
    defaultModel?: string
  ) {
    super();
    this.baseURL = baseURL || process.env.GAPGPT_BASE_URL || 'https://api.gapgpt.app/v1';
    this.apiKey = apiKey || process.env.GAPGPT_API_KEY || '';
    this.defaultModel = defaultModel || process.env.GAPGPT_MODEL || 'gpt-4o-mini';

    if (!this.apiKey) {
      console.warn('[GapGPTProvider] API Key not found in environment variables');
    }
  }

  /**
   * Initialize OpenAI client with GapGPT endpoint
   */
  protected async initProvider(): Promise<void> {
    if (!this.client) {
      this.client = new OpenAI({
        baseURL: this.baseURL,
        apiKey: this.apiKey,
      });
      console.log(`[GapGPTProvider] Initialized with model: ${this.defaultModel}`);
    }
  }

  /**
   * Send chat request to GapGPT
   */
  async chat(params: ChatParams): Promise<ChatResponse> {
    await this.init();
    this.validateChatParams(params);

    // Format messages with system prompt
    const messages = this.formatMessages(params.messages, params.systemPrompt);

    try {
      // Call GapGPT via OpenAI SDK
      const completion = await this.client!.chat.completions.create({
        model: this.defaultModel,
        messages,
        temperature: this.getTemperature(params),
        maxTokens: params.maxTokens,
      });

      // Extract content and usage
      const content = this.extractContent(completion);
      const usage = this.extractUsage(completion);

      return {
        content,
        usage,
        model: this.defaultModel,
      };
    } catch (error: any) {
      console.error('[GapGPTProvider] Chat Error:', error);
      throw new Error(`GapGPT chat failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Analyze sentiment using GapGPT
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    await this.init();

    const systemPrompt = `تو یک تحلیل‌گر احساسی حرفه‌ای هستی.
تحلیل احساسی متن زیر رو انجام بده و فقط JSON خروجی بده.

فرمت خروجی:
{
  "sentiment": "positive" یا "neutral" یا "negative",
  "score": عدد بین 0 تا 1 (امتیاز اطمینان),
  "keywords": ["کلمه1", "کلمه2", ...],
  "confidence": عدد بین 0 تا 1
}

متن:
${text}`;

    try {
      const response = await this.chat({
        messages: [{ role: 'user', content: 'تحلیل احساسی انجام بده' }],
        systemPrompt,
        temperature: 0.3,
      });

      // Try to parse JSON from response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: analyze based on content
      return this.fallbackSentimentAnalysis(text, response.content);
    } catch (error: any) {
      console.error('[GapGPTProvider] Sentiment Analysis Error:', error);
      return {
        sentiment: 'neutral',
        score: 0.5,
        keywords: [],
        confidence: 0.3,
      };
    }
  }

  /**
   * Fallback sentiment analysis if JSON parsing fails
   */
  private fallbackSentimentAnalysis(text: string, aiResponse: string): SentimentAnalysis {
    const lowerText = text.toLowerCase();
    const positiveWords = ['خوشحال', 'عالی', 'موفقیت', 'خوب', 'راضی', 'موفق'];
    const negativeWords = ['غمگین', 'ناراحت', 'ناامید', 'خسته', 'مشکل', 'شکست', 'سخت'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) {
      return {
        sentiment: 'positive',
        score: Math.min(0.5 + (positiveCount - negativeCount) * 0.1, 1),
        keywords: positiveWords.filter(w => lowerText.includes(w)),
        confidence: 0.6,
      };
    } else if (negativeCount > positiveCount) {
      return {
        sentiment: 'negative',
        score: Math.min(0.5 + (negativeCount - positiveCount) * 0.1, 1),
        keywords: negativeWords.filter(w => lowerText.includes(w)),
        confidence: 0.6,
      };
    } else {
      return {
        sentiment: 'neutral',
        score: 0.5,
        keywords: [],
        confidence: 0.5,
      };
    }
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'GapGPT (OpenAI-compatible)';
  }

  /**
   * Extract content from OpenAI response
   */
  protected extractContent(response: any): string {
    return response.choices?.[0]?.message?.content || '';
  }

  /**
   * Extract usage from OpenAI response
   */
  protected extractUsage(response: any): ChatResponse['usage'] {
    if (response.usage) {
      return {
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      };
    }
    return undefined;
  }
}
```

### مرحله ۲: بروزرسانی Type Definitions (اختیاری)

**مسیر:** `src/lib/ai/types.ts`

برای افزودن `gapgpt` به Provider Types:

```typescript
export type AIProviderType = 'zai' | 'openai' | 'anthropic' | 'gapgpt';
```

**نکته:** این مرحله اختیاری است. می‌توانید از `openai` type استفاده کنید.

### مرحله ۳: بروزرسانی AI Client Factory (اختیاری)

**مسیر:** `src/lib/ai/ai-client.ts`

برای پشتیبانی از `gapgpt` type:

```typescript
import { ZAIProvider } from './providers/zai-provider';
import { GapGPTProvider } from './providers/gapgpt-provider'; // ← اضافه شده

private createProvider(type: AIProviderType): AIProvider {
  switch (type) {
    case 'zai':
      return new ZAIProvider();

    case 'gapgpt': // ← اضافه شده
      return new GapGPTProvider();

    case 'openai':
      throw new Error('OpenAI provider is not implemented yet. Please use "zai" or "gapgpt" provider.');

    case 'anthropic':
      throw new Error('Anthropic provider is not implemented yet. Please use "zai" or "gapgpt" provider.');

    default:
      throw new Error(`Unknown AI provider: ${type}. Available providers: zai, gapgpt`);
  }
}
```

**نکته:** این مرحله هم اختیاری است. می‌توانید Provider را مستقیماً در کد استفاده کنید.

---

## تنظیمات Environment

### فایل .env

```bash
# سرویس AI فعلی (ZAI)
AI_PROVIDER="zai"

# ============================================================
# سرویس GapGPT (برای استفاده از آن، AI_PROVIDER="gapgpt" تنظیم کنید)
# ============================================================
GAPGPT_BASE_URL="https://api.gapgpt.app/v1"
GAPGPT_API_KEY="your-api-key-here"
GAPGPT_MODEL="gpt-4o-mini"
```

### تغییر Provider

برای تغییر از ZAI به GapGPT:

```bash
# .env
AI_PROVIDER="gapgpt"
```

سپس سرور را ریستارت کنید.

---

## تست و Verification

### تست ۱: بررسی سلامت Provider

**Endpoint:** `GET /api/ai/chat`

**Response:**

```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "provider": "GapGPT (OpenAI-compatible)"
  },
  "provider": {
    "name": "GapGPT (OpenAI-compatible)",
    "type": "gapgpt"
  },
  "availableSystemPrompts": [
    "CHAT_BOT",
    "ANALYTICS_COACH",
    "COMMITMENT_SUGGESTER",
    "SENTIMENT_ANALYZER",
    "REPORT_GENERATOR",
    "IMPROVEMENT_GUIDE",
    "GOAL_SUGGESTER",
    "GENERIC"
  ]
}
```

### تست ۲: ارسال پیام

**Endpoint:** `POST /api/ai/chat`

**Request:**

```json
{
  "message": "سلام! چطوری؟",
  "history": []
}
```

**Response:**

```json
{
  "success": true,
  "content": "سلام! من خوبم، ممنون که پرسیدی. چطور می‌تونم کمکت کنم؟",
  "usage": {
    "promptTokens": 20,
    "completionTokens": 15,
    "totalTokens": 35
  },
  "model": "gpt-4o-mini"
}
```

### تست ۳: چک کردن لاگ‌ها

```bash
# مشاهده لاگ‌ها
tail -f dev.log

# باید ببینید:
# [AIClient] Initialized with provider: gapgpt
# [GapGPTProvider] Initialized with model: gpt-4o-mini
```

### تست ۴: Context Builders

چک کنید که Context Builders همچنان کار می‌کنند:

```bash
# تست پیشنهاد تعهدات
curl -X POST http://localhost:3000/api/ai/suggest-commitments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count": 3}'
```

---

## مزایا و معایب

### مزایا

| مزیت | توضیح |
|------|-------|
| ✅ **هزینه کمتر** | GapGPT معمولاً ارزان‌تر است |
| ✅ **مدل gpt-4o-mini** | مدل جدید و کارآمد |
| ✅ **OpenAI SDK** | SDK شناخته‌شده و ثابت |
| ✅ **بدون تغییر کد** | سیستم فعلی حفظ می‌شود |
| ✅ **قابل revert** | به سادگی به ZAI برگردید |
| ✅ **A/B Testing** | هر دو provider را تست کنید |

### معایب

| عیب | توضیح |
|------|-------|
| ⚠️ **API Key مدیریت** | نیاز به محافظت از API Key |
| ⚠️ **دسترسی خارجی** | وابستگی به سرویس خارجی |
| ⚠️ **SLA سرویس** | وابستگی به uptime سرویس GapGPT |
| ⚠️ **تست مورد نیاز** | نیاز به تست کامل |

---

## سوالات متداول

### سوال ۱: آیا نیاز به تغییر کد موجود داریم؟

**پاسخ:** خیر، هیچ کدی در فایل‌های فعلی تغییر نمی‌کند. فقط یک فایل جدید اضافه می‌شود.

### سوال ۲: آیا می‌توانیم بین دو provider سوییچ کنیم؟

**پاسخ:** بله، با تغییر `AI_PROVIDER` در `.env` می‌توانید سوییچ کنید.

### سوال ۳: آیا Context Builders کار می‌کنند؟

**پاسخ:** بله، Context Builders هیچ تغییری نمی‌کنند. فقط در پشت صحنه provider عوض می‌شود.

### سوال ۴: آیا API Routes نیاز به تغییر دارند؟

**پاسخ:** خیر، همه API Routes به `ai-service` وصل هستند و `ai-service` خودش provider را انتخاب می‌کند.

### سوال ۵: اگر سرویس GapGPT down شد چه می‌شود؟

**پاسخ:** می‌توانید ساده `AI_PROVIDER="zai"` کنید و به ZAI برگردید.

### سوال ۶: آیا می‌توانیم هر دو provider را همزمان استفاده کنیم؟

**پاسخ:** بله، با ایجاد چند instance از `AIClient` می‌توانید هر دو را استفاده کنید. اما معمولاً برای production یک provider استفاده می‌شود.

### سوال ۷: چطور cost را مقایسه کنیم؟

**پاسخ:**
```bash
# با ZAI
tail -f dev.log | grep "usage"

# با GapGPT
# .env را تغییر دهید و دوباره تست کنید
```

---

## خلاصه

### آنچه باید انجام دهید:

1. ✅ **فایل Provider جدید بسازید:** `src/lib/ai/providers/gapgpt-provider.ts`
2. ✅ **Environment variables تنظیم کنید:** `GAPGPT_BASE_URL`, `GAPGPT_API_KEY`, `GAPGPT_MODEL`
3. ✅ **(اختیاری) AI Client بروزرسانی کنید:** برای پشتیبانی از type جدید
4. ✅ **(اختیاری) Types بروزرسانی کنید:** برای افزودن `gapgpt` to `AIProviderType`
5. ✅ **تست کنید:** `/api/ai/chat` و `/api/ai/suggest-commitments`
6. ✅ **Verify کنید:** Context Builders و همه AI features کار می‌کنند

### آنچه **نباید** انجام دهید:

- ❌ هیچ فایل موجود را تغییر ندهید (مگر مرحله‌های اختیاری)
- ❌ API Routes را تغییر ندهید
- ❌ AI Service را تغییر ندهید
- ❌ Context Builders را تغییر ندهید
- ❌ Database schema را تغییر ندهید

---

<div align="center">

**آخرین بروزرسانی:** ۱۸ ژانویه ۲۰۲۶  
**نسخه:** 1.0.0  
**وضعیت:** ✅ آماده پیاده‌سازی

با ❤️ برای همسو

</div>
