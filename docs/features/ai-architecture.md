# AI Architecture — معماری AI همسو

> **زمینه:** AI در همسو یک «فیچر» نیست؛ یک **لایه ساختاری** است که در ده‌ها نقطه از اپلیکیشن با نقش‌ها و خروجی‌های مختلف ظاهر می‌شود.
> **هدف این سند:** تعریف یک معماری تمیز، توسعه‌پذیر، Provider-agnostic که اجزای آن مستقل از هم قابل تست/تغییر باشند ولی یکپارچه عمل کنند.
> **منبع:** CLAUDE.md §۸، DECISION-020، memory: project-ai-as-heart

---

## ۱. اصول طراحی (غیرقابل مذاکره)

| اصل | معنا |
|-----|-------|
| **Single Responsibility per Role** | هر نقش AI یک کار مشخص دارد (گزارش هفتگی ≠ چت ≠ پیشنهاد پلن) |
| **Heterogeneous Input/Output** | هر نقش schema input/output **مخصوص خودش** را دارد — هیچ schema کلی برای همه نقش‌ها نیست |
| **Provider-agnostic** | امروز Mock، فردا OpenAI، پس‌فردا Gemini یا Provider ایرانی — همه پشت `AIAdapter` |
| **Locale ≠ Country (DECISION-028)** | زبان پرامپت (انتخاب کاربر) جدا از Provider routing (IP-based) |
| **No Direct AI Calls** | هیچ کامپوننت/API Route مستقیماً Adapter را صدا نمی‌زند — همه از Orchestrator رد می‌شوند |
| **Prompt Versioning** | هر prompt یک نسخه دارد، تغییر prompt = bump نسخه + لاگ |
| **Observability by Default** | ورودی/خروجی/توکن/تاخیر هر فراخوانی در dev قابل بازبینی است |
| **Mock-first Development** | هر نقش جدید با Mock شروع می‌شود؛ Provider واقعی بعداً متصل می‌شود |
| **Persian-Native Output** | متن، اعداد، ساختار خروجی همه فارسی — هیچ‌گاه «ترجمه» نباشد |
| **No Cross-User Context** | context هر فراخوانی فقط داده‌های کاربر خودش — حریم خصوصی + جلوگیری از مقایسه |

---

## ۲. لایه‌ها — ۴ لایه روی AIAdapter موجود

```
┌─────────────────────────────────────────────────────────────┐
│  Consumers: API Routes / Server Components / Background Jobs│
└──────────────────────────┬──────────────────────────────────┘
                           │ اَلز Registry فراخوانی می‌کنند، نه Adapter مستقیم
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 4 — AI Roles (نقش‌های مشخص: weekly-report، chat، ...) │
│           هر نقش = Prompt + InputSchema + OutputSchema       │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 3 — AI Orchestrator                                    │
│           انتخاب نقش، اعمال context، token budgeting،        │
│           retry/fallback، caching                            │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 2 — AI Registry                                        │
│           ثبت/کشف نقش‌ها، lookup نسخه‌ها، type-safety        │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Layer 1 — AIAdapter (موجود — TASK-003)                       │
│           interface ساده generate(prompt) → response        │
│           پیاده‌سازی‌ها: MockAIAdapter / OpenAIAdapter / ... │
└─────────────────────────────────────────────────────────────┘
```

---

## ۳. مفاهیم کلیدی

### AI Role
یک نقش = یک نهاد type-safe که شامل:
- `id` (kebab-case منحصربفرد، مثل `"weekly-report"`)
- `version` (semver، مثل `"1.0.0"`)
- `inputSchema` (Zod schema)
- `outputSchema` (Zod schema)
- `buildPrompt(input)` → `string`
- `parseOutput(raw)` → `OutputType`
- `meta` (description فارسی، token budget، cache policy)

### AI Registry
- `register(role)` — ثبت نقش
- `get(id, version?)` — کشف نقش (`version` خالی → آخرین)
- `list()` — همه نقش‌های ثبت‌شده (برای dev panel و admin)

### AI Orchestrator
وظیفه: گرفتن `roleId + input` و بازگرداندن `output` type-safe، با:
- اعمال context کاربر (اگر نقش نیاز داشت)
- token budget enforcement
- retry با backoff (در صورت خطای Provider)
- caching بر اساس policy نقش
- logging کامل در dev (`<DevAIInspector>`)

### نقش‌های اولیه شناسایی‌شده

| Role ID | نسخه | کاربر | فاز |
|---------|------|-------|-----|
| `weekly-report` | 1.0.0 | تحلیل هفتگی کاربر | فاز ۱ (TASK-009) |
| `chat-companion` | 1.0.0 | چت‌بات همراه | فاز ۲.۵ |
| `plan-suggestion` | 1.0.0 | پیشنهاد تعهد روزانه از پلن | فاز ۲ |
| `gap-reflection` | 1.0.0 | تفسیر فاصله غیرفعالی | فاز ۲ |
| `pattern-insight` | 1.0.0 | کشف الگو در تاریخچه طولانی | فاز ۲.۵ |
| `report-share-summary` | 1.0.0 | خلاصه قابل اشتراک گزارش | فاز ۳ (TASK-012) |

---

## ۴. ساختار پوشه‌ها (پیشنهادی)

```
src/lib/ai/
├── adapter.ts             ← export از src/lib/adapters/ (لایه ۱)
├── registry.ts            ← AIRegistry singleton (لایه ۲)
├── orchestrator.ts        ← AIOrchestrator (لایه ۳)
├── observability.ts       ← logging، token counting، latency
├── cache.ts               ← cache layer (در فاز ۲+)
└── roles/                 ← لایه ۴
    ├── _types.ts          ← AIRole<TInput, TOutput> generic
    ├── weekly-report/
    │   ├── index.ts       ← export role
    │   ├── prompt.ts      ← buildPrompt + متن prompt
    │   ├── schema.ts      ← Zod input/output
    │   └── prompt.v1.md   ← prompt به‌صورت markdown (نسخه‌پذیر)
    ├── chat-companion/
    └── ...
```

---

## ۵. توسعه‌پذیری — اضافه کردن نقش جدید

مراحل (باید در ۵ دقیقه ممکن باشد):
1. ساخت پوشه `src/lib/ai/roles/<new-role>/`
2. نوشتن schema (Zod) برای input/output
3. نوشتن prompt در فایل `.md` (نسخه‌پذیر)
4. ساخت `role.ts` با `buildPrompt`/`parseOutput`
5. ثبت در `registry.ts` با یک خط
6. تست با `<DevAIInspector>` (لایه dev — جزء dev-data-generation)

**هیچ تغییری در orchestrator، adapter، یا کامپوننت‌های مصرف‌کننده نیاز نیست.**

---

## ۶. حریم خصوصی و امنیت

- ورودی AI روی سرور ساخته می‌شود؛ هیچ‌گاه prompt کامل به client نشت نمی‌کند
- داده کاربر فقط در حد لازم به Provider ارسال می‌شود (شماره موبایل، ID، email هرگز)
- در dev: لاگ کامل — در prod: فقط metadata (token count، latency، success)
- اگر کاربر داده‌اش را پاک کرد → cache مربوطه هم پاک می‌شود
- خط قرمز: هیچ نقشی **پیام انگیزشی مصنوعی** تولید نمی‌کند (مرجع: CLAUDE.md §۱)

---

## ۷. درخت تسک — مهاجرت تدریجی

> **ترتیب اجرا:** TASK-009 با AIAdapter ساده انجام می‌شود؛ بلافاصله بعد از آن TASK-AI-ARCH.

### TASK-AI-ARCH | معماری Registry/Orchestrator
- **فاز:** ۱.۵ (بلافاصله بعد از TASK-009)
- **اولویت:** 🔴 Critical
- **وابستگی:** TASK-009 (تا نمونه عملی یک نقش داشته باشیم)

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-AI-ARCH-01 | تایپ‌های پایه: `AIRole<I,O>`، `AIRoleMeta`، `AIInvocationResult` |
| TASK-AI-ARCH-02 | پیاده‌سازی `AIRegistry` (singleton، type-safe lookup) |
| TASK-AI-ARCH-03 | پیاده‌سازی `AIOrchestrator` (با token budget، retry، logging) |
| TASK-AI-ARCH-04 | مهاجرت TASK-009 به Registry — نقش `weekly-report` |
| TASK-AI-ARCH-05 | افزودن نسخه‌پذیری prompt (فایل‌های `.md` در `roles/*/`) |
| TASK-AI-ARCH-06 | `DevAIInspector` — پنل dev برای دیدن ورودی/خروجی هر فراخوانی (مرتبط با dev-data-generation) |
| TASK-AI-ARCH-07 | تست end-to-end: فراخوانی `weekly-report` از طریق Orchestrator |
| TASK-AI-ARCH-08 | مستندسازی الگوی «افزودن نقش جدید» در CLAUDE.md §۸ |

### TASK-AI-CHAT | چت‌بات همدل و همراه (نقش `chat-companion`)
- **فاز:** ۲.۵
- **اولویت:** 🟠 High
- **وابستگی:** TASK-AI-ARCH ✅، TASK-AI-PROVIDERS، TASK-PROFILE-FULL
- **منبع:** **DECISION-031** (شخصیت + محدودیت‌ها + UI + خط قرمزها)
- **هشدار تعارض:** DECISION-025 (وابستگی کاربر) — رعایت مرز ساختاری

**ویژگی‌های کلیدی (مرجع DECISION-031):**
- **شخصیت:** همدل، نه ChatGPT عمومی. مرز روشن — سؤال خارج از حوزه شخصی → بازگشت با لحن مهربان به نقش
- **Globally Accessible:** آیکون شناور (FAB) در همه صفحه‌های authenticated (به جز `/login` و `/`)
- **Rate limit per plan:** FREE=10، PLUS=50، PRO=200 پیام در روز — در سرور enforce می‌شود
- **Anti-dependency:** cooldown نرم بعد از ۵ پیام پشت‌سرهم، هیچ notification از طرف چت

ساب‌تسک‌های کامل: TASKS.md → TASK-AI-CHAT-01 تا 09

### TASK-AI-PROVIDERS | اتصال Provider واقعی
- **فاز:** ۲
- **اولویت:** 🟠 High
- **وابستگی:** TASK-AI-ARCH

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-AI-PROV-01 | `OpenAIAdapter` (پیاده‌سازی AIAdapter) |
| TASK-AI-PROV-02 | `GeminiAdapter` (پیاده‌سازی AIAdapter) |
| TASK-AI-PROV-03 | Provider selection از env + UI ادمین (TASK-ADMIN-INTEG-AI) |
| TASK-AI-PROV-04 | Fallback chain (اگر primary fail شد → secondary) |
| TASK-AI-PROV-05 | rate limiting و quota tracking |

---

## ۸. تعارض با مانیفست — یادآوری

- نقش `chat-companion` ممکن است به وابستگی منجر شود → DECISION-025، DECISION-031 (محافظ‌های ساختاری)
- خروجی هیچ نقشی نباید «انگیزش مصنوعی» باشد → در review prompt هر نقش چک می‌شود
- مقایسه با کاربران دیگر در هیچ نقشی مجاز نیست
- هیچ context cross-user — هر کاربر فقط با داده‌های خودش (حریم + اجرای §۱)

## ۹. خلاصه — جداسازی locale و country (DECISION-028)

**locale** (`fa`/`en`):
- انتخاب کاربر (روی User ذخیره می‌شود — TASK-I18N)
- در PromptLoader: تعیین فایل پرامپت (`v1.fa.md` vs `v1.en.md`)
- مستقل از مکان فیزیکی

**clientCountry** (`IR`/`US`/...):
- از IP request (headers `x-vercel-ip-country` / `cf-ipcountry`) — `src/lib/utils/geo.ts`
- در ProviderRouter: تعیین Adapter
- در dev: header `x-dev-country` برای override

API Routes **همیشه** هر دو را به orchestrator می‌فرستند:
```typescript
const clientCountry = getCountryFromHeaders(request.headers);
await invokeAI(roleId, input, { userId, locale, clientCountry });
```

---

*آخرین بروزرسانی: ۲۰۲۶-۰۵-۲۷ — ساخت اولیه*
*هر تغییر مهم در معماری AI باید این سند را آپدیت کند.*
