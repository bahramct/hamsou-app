# CLAUDE.md — راهنمای عامل هوش مصنوعی برای پروژه همسو

> این فایل دستورالعمل اصلی Claude Code است.
> پیش از هر اقدامی این فایل را بخوان و به آن پایبند باش.

---

## ۱. هویت پروژه
## ⚖️ قاعدهٔ حاکمیتیِ قطعی (۲۰۲۶-۰۶-۲۴ — جایگزینِ هر قاعدهٔ مرجعیتِ قبلی):
> **از این پس نظرِ مالک مرجعِ مطلق است. دیگر به مانیفست/برندبوک استناد نمی‌شود و هیچ تعارضی با آن مطرح نمی‌گردد.** هرچه مالک بگوید همان اجرا می‌شود؛ هرگز نگو «این با مانیفست/برندبوک تعارض دارد» و گزینهٔ مبتنی بر مانیفست پیشنهاد نده. (برندبوک صرفاً منبعِ الهام است، نه قاعدهٔ الزام‌آور.)
**نام:** همسو (Hamsoo)
**ماهیت:** اپلیکیشن وب فارسی در حوزه توسعه فردی و خودآگاهی
**جوهر محصول:** کاهش فاصله میان حرف، تصمیم و عمل — بدون فشار، بدون قضاوت، بدون گیمیفیکیشن

### همسو چیست؟
هر روز یک تعهد. روز بعد یک بازخورد. در پایان هفته یک گزارش عمیق از مسیر خود.

### همسو چه نیست؟ (خط قرمز — هرگز نباید به اینها تبدیل شود)
- ❌ Task Manager یا Project Management Tool
- ❌ Habit Tracker کلاسیک
- ❌ اپلیکیشن انگیزشی با پیام‌های مصنوعی
- ❌ سیستم استریک، امتیاز، مدال یا رقابت
- ❌ محیط شلوغ با فرم‌های پیچیده
- ❌ ابزاری که کاربر را به خودش وابسته کند

---

## ۲. اصول طراحی — اینها ثابت‌اند

این اصول در هر تصمیم فنی و طراحی باید رعایت شوند:

| اصل | توضیح |
|-----|-------|
| **سادگی** | کمترین فرم، کمترین انتخاب، بیشترین وضوح |
| **سکوت بصری** | مینیمالیسم واقعی — نه مینیمالیسم تزئینی |
| **بدون قضاوت** | هیچ پیام منفی، هیچ تنبیه، هیچ مقایسه |
| **استقلال از Provider** | AI، SMS، و سرویس‌های بیرونی پشت Adapter |
| **حریم خصوصی** | داده کاربر خصوصی است؛ اشتراک‌گذاری کاملاً اختیاری |
| **یکپارچگی داده** | تعهدها پس از بازه ویرایش غیرقابل حذف یا تغییر هستند |
| **فارسی اصیل** | UI، متن، لحن — همه باید برای کاربر ایرانی طراحی شده باشد |
| **قابلیت توسعه** | هر معماری باید فاز بعدی را بدون بازنویسی ممکن کند |

---

## ۳. استک فنی و محیط توسعه

### محیط
- **IDE:** VSCode (Local Server روی Windows)
- **Agent:** Claude Code
- **مخزن:** Git (Local) — ساختار monorepo

### استک انتخابی
```
Frontend:   Next.js 14+ (App Router) + TypeScript
Styling:    Tailwind CSS + shadcn/ui (فقط کامپوننت‌های ضروری)
Backend:    Next.js API Routes (در فاز اول) / یا جداسازی بعدی
Database:   SQLite + Prisma ORM (در فاز توسعه و MVP — قابل تعویض با Postgres در آینده)
Auth:       Custom OTP-based (SMS) — با Adapter Pattern
AI Layer:   Adapter Pattern (OpenAI / Gemini / هر Provider دیگر)
State:      Zustand یا React Context (تعیین در DECISIONS.md)
```

> **مهم:** قبل از شروع کد هر ماژول، مطمئن شو که DECISIONS.md آپدیت شده باشد.

---

## ۴. ساختار پروژه

```
hamsoo/
├── CLAUDE.md              ← این فایل (همیشه بخوان)
├── TASKS.md               ← وظایف جاری و backlog
├── DECISIONS.md           ← تصمیمات معماری و دلایل آنها
├── PROGRESS.md            ← وضعیت پیشرفت فازها
├── QUESTIONS.md           ← ابهامات منتظر پاسخ صاحب پروژه
├── docs/
│   ├── architecture.md    ← دیاگرام و توضیح معماری
│   ├── data-model.md      ← مدل داده و روابط
│   ├── ai-strategy.md     ← استراتژی و نقش‌های AI
│   └── ui-principles.md   ← اصول و راهنمای UI/UX
├── src/
│   ├── app/               ← Next.js App Router
│   ├── components/        ← کامپوننت‌های UI
│   │   ├── ui/            ← کامپوننت‌های پایه (shadcn)
│   │   └── features/      ← کامپوننت‌های فیچر‌محور
│   ├── lib/
│   │   ├── adapters/      ← AI Adapter, SMS Adapter
│   │   ├── db/            ← Prisma client و helpers
│   │   ├── ai/            ← AI prompts و logic
│   │   └── utils/         ← توابع عمومی
│   ├── hooks/             ← Custom React hooks
│   ├── types/             ← TypeScript types/interfaces
│   └── constants/         ← مقادیر ثابت
├── prisma/
│   └── schema.prisma
├── public/
├── .env.example
└── package.json
```

---

## ۵. قوانین کدنویسی

### همیشه
- ✅ TypeScript strict mode — هیچ `any` بدون توضیح
- ✅ هر فانکشن / کامپوننت یک مسئولیت دارد (SRP)
- ✅ Adapter Pattern برای هر سرویس خارجی (AI, SMS, Storage)
- ✅ Error handling واقعی — نه `console.log` رها شده
- ✅ نام‌گذاری فارسی در کامنت‌ها برای منطق کسب‌وکار
- ✅ **قانون قطعی ارقام فارسی:** همهٔ اعداد در UI (پنل + سایت) با ارقام فارسی نمایش داده می‌شوند. **مکانیزم قابل‌اتکا = تبدیل در JS** (ارقام فارسیِ Unicode واقعی)، نه صرفاً فیچر فونت `ss01` (PelakFA همیشه ارقام را جایگزین نمی‌کند — مثلاً رشتهٔ خام شماره موبایل لاتین می‌ماند). قاعده‌ها: عددِ محاسبه‌شده → `n.toLocaleString("fa-IR")`؛ تاریخ → `toLocaleString("fa-IR")`/`formatJalali`؛ **رشتهٔ خام شامل رقم (شماره موبایل، …)** → `toFaDigits()` از `@/lib/utils/digits`. فیلد عددیِ ورودی را با `type="number"` نساز → `inputMode="numeric"` + نرمال‌سازی با `onlyDigits`/`toEnDigits`. جهت اعداد همیشه LTR. فقط شناسه‌های فنی LTR (مدل، URL، کلید، نام‌کاربری، کد تخفیف) لاتین می‌مانند؛ شماره موبایل فارسی است (DECISION-042/045)
- ✅ **قانون قطعی تاریخ/زمان جلالی:** هر نمایش تاریخ و زمان در کل سایت و پنل باید **شمسی (جلالی) + فونت و ارقام فارسی** باشد. برای نمایش از `toLocaleString("fa-IR", …)` (که خودش جلالی می‌دهد) یا `formatJalali()` در `@/lib/utils/date` استفاده کن — هرگز تقویم میلادی. برای **انتخاب** تاریخ هم از `<JalaliDatePicker>` (در `@/components/ui/JalaliDatePicker`) استفاده کن، نه `type="date"` بومی (که میلادی mm/dd/yyyy نشان می‌دهد) (DECISION-044)
- ✅ **قانون قطعی بدون Autofill/Suggestion:** هیچ حبابِ پیشنهاد/autofill مرورگر در هیچ input/textarea (سایت + پنل) نباید ظاهر شود. مکانیزم سراسری: `<DisableAutofill>` در `layout.tsx` ریشه (روی همهٔ فیلدها autocomplete را خنثی می‌کند + MutationObserver برای فیلدهای پویا). نیازی به دست‌زدن تک‌تک ورودی‌ها نیست؛ خودکار پوشش داده می‌شوند (DECISION-044)
- ✅ **قانون نوتیفیکیشن (DECISION-046):** برای بازخورد گذرای «یک اتفاق افتاد» از `toast.success/error/info/neutral(...)` (از `@/lib/notifications/toast`) استفاده کن — نه پیام inline موقت. برای اعلان ماندگار، **هرگز مستقیم `prisma.notification.create` نزن** — همیشه `createNotification(...)` از `@/lib/notifications/server` (قاعدهٔ طلایی، مثل invokeAI). افزودن نوع جدید = یک ردیف در `src/lib/notifications/catalog.ts`، بدون migration. تنِ مانیفستی: بدون جشن/ایموجی/فشار. یادآوری‌های زمان‌محور تا موج ۲ ساخته نمی‌شوند.
- ✅ **قانون قطعیِ متنِ دکمه (DECISION-053):** متنِ هیچ دکمه‌ای **هرگز** هنگام اکشن عوض نمی‌شود — نه «در حال ذخیره…»، نه «ذخیره شد ✓»، نه «کپی شد ✓». حینِ کار فقط `<Spinner>` (از `@/components/ui/Spinner`) کنارِ متنِ ثابت بگذار؛ نتیجه را **فقط با toast** اعلام کن. استثنا: toggleهای **حالت** (بستن/باز، فعال/غیرفعال، create/edit) که وضعیت را بازتاب می‌دهند نه پیشرفت را. اجباری در کلِ سایت و **به‌ویژه پنل ادمین**.
- ✅ هر تغییر معماری مهم در `DECISIONS.md` ثبت شود

### هرگز
- ❌ منطق کسب‌وکار مستقیم در کامپوننت‌های UI
- ❌ فراخوانی مستقیم SDK یک Provider بدون Adapter
- ❌ Hardcode کردن API key، URL، یا مقادیر محیطی
- ❌ Migration دیتابیس بدون تأیید explicit از من
- ❌ تغییر schema.prisma بدون ثبت در DECISIONS.md

---

## ۶. قوانین رفتاری عامل

### پیش از شروع هر وظیفه
1. `TASKS.md` را بخوان — مطمئن شو وظیفه جاری کدام است
2. اگر ابهام وجود دارد → در `QUESTIONS.md` بنویس و متوقف شو
3. تأیید را از من بگیر، سپس شروع کن

### حین کار
- فقط روی وظیفه جاری تمرکز کن
- هیچ refactor غیرمرتبط انجام نده
- اگر در حین کار به تصمیم معماری برخوردی → متوقف شو، در `QUESTIONS.md` بنویس

### پس از اتمام وظیفه
- وضعیت را در `TASKS.md` آپدیت کن
- تغییرات مهم را در `PROGRESS.md` ثبت کن
- اگر تصمیم معماری گرفتی → در `DECISIONS.md` ثبت کن

### قانون طلایی
> اگر مطمئن نیستی → نپرس از خودت. بنویس در `QUESTIONS.md` و صبر کن.
> هرگز بدون اطلاع من تصمیم معماری مستقل نگیر.

---

## ۷. مدل داده اصلی (نسخه اولیه)

```
User
├── id
├── phone (ایران — فرمت +98)
├── createdAt
└── plan: FREE | PLUS | PRO

DailyEntry (تعهد روزانه)
├── id
├── userId
├── content (متن تعهد)
├── date (تاریخ شمسی + میلادی)
├── createdAt
├── editableUntil (createdAt + 2 ساعت)
├── editedAt (nullable)
└── isLocked: boolean

EntryFeedback (بازخورد)
├── id
├── entryId
├── status: DONE | NOT_DONE
├── note (یادداشت اختیاری — nullable)
└── createdAt

GapRecord (فاصله غیرفعالی)
├── id
├── userId
├── fromDate
├── toDate
├── note (nullable)
└── createdAt

WeeklyReport (گزارش هفتگی)
├── id
├── userId
├── weekStart
├── weekEnd
├── aiContent (JSON — خروجی AI)
├── generatedAt
└── isShared: boolean
```

---

## ۸. استراتژی AI — معماری ۵ لایه

> **منبع:** DECISION-020، DECISION-028، DECISION-029، DECISION-030.
> **پیاده‌سازی:** TASK-009. **سند تکمیلی:** [docs/features/ai-architecture.md](docs/features/ai-architecture.md).

### اصل اول: AI یک لایه ساختاری است، نه یک «فیچر»

```
Consumer (API Route / Server Component)
     ↓ invokeAI(roleId, input, ctx)
Layer 5: Orchestrator     ← validation، routing، logging، parse JSON
Layer 4: Registry + Roles ← weekly-report، weekly-reflection، chat-companion (همدم)، goal-companion (همراه — DECISION-082)، plan-suggestion (آینده)
Layer 3: Prompt Loader    ← /prompts/<role>/v<n>.<locale>.md
Layer 2: ProviderRouter   ← انتخاب Provider بر اساس user.locale
Layer 1: AIAdapter        ← OpenAI-compatible (GapGPT و…)، (آینده) Gemini — بدون Mock (DECISION-048)
```

### قاعده طلایی
> **هیچ کد فیچری مستقیماً `AIAdapter` را صدا نمی‌زند.**
> همیشه: `import { invokeAI } from "@/lib/ai/orchestrator"; await invokeAI(roleId, input, ctx)`.

### افزودن نقش جدید AI — ۵ دقیقه

1. **پوشه پرامپت:** `prompts/<new-role>/v1.fa.md` با frontmatter (role/version/locale/jsonMode) + `## SYSTEM` + `## USER`
2. **schema:** `src/lib/ai/roles/<new-role>/schema.ts` — Zod inputSchema + outputSchema
3. **role:** `src/lib/ai/roles/<new-role>/index.ts` با id، version، meta، buildPrompt (که `loadPrompt(...)` صدا می‌زند)، parseOutput
4. **register:** افزودن یک خط در `src/lib/ai/bootstrap.ts`: `aiRegistry.register(newRole)`
5. **مصرف:** `const result = await invokeAI<I, O>("new-role", input, { userId, locale: "fa" })`

**هیچ لمسی** در Orchestrator، Registry، Adapter، یا ProviderRouter نیاز نیست.

### Prompt Design — خط قرمزها (در پرامپت v1.fa.md)
- ❌ هیچ پیام انگیزشی مصنوعی («تو می‌تونی!»)
- ❌ هیچ قضاوت («بد بود»، «خوب بود»، «باید بیشتر تلاش می‌کردی»)
- ❌ هیچ مقایسه با کاربران دیگر
- ❌ هیچ «باید»، «نباید»، «حتماً»
- ❌ هیچ ذکر استریک، امتیاز، مدال، رنک
- ❌ هیچ ایموجی، هیچ پیام تأیید برای کارهای انجام‌شده
- ✅ فاصله‌ها = داده، نه شکست
- ✅ عمق، نه انگیزه مصنوعی
- ✅ فارسی اصیل (نه ترجمه‌ای، نه رسمی خشک)

### نسخه‌پذیری پرامپت
- تغییر کوچک (typo، اصلاح لحن): فایل v1.fa.md را ویرایش کن
- تغییر معنایی: `v2.fa.md` بساز (v1 پاک نمی‌شود)، `ROLE_VERSION` در `index.ts` نقش را آپدیت کن، orchestrator به آخرین نسخه default می‌شود

### Provider Routing — تفکیک locale از country (DECISION-028)

⚠️ **مهم — دو محور کاملاً مستقل:**

| محور | منبع | تأثیر |
|------|------|-------|
| **locale** (`fa` \| `en`) | انتخاب کاربر (روی User ذخیره) | فقط فایل پرامپت را تعیین می‌کند (`v1.fa.md` vs `v1.en.md`) |
| **clientCountry** (`IR`، `US`، …) | از IP request — headers `x-vercel-ip-country` / `cf-ipcountry` | تعیین می‌کند کدام **Provider** صدا زده شود |

**هرگز locale را با country قاطی نکن.** کاربر ایرانی ممکن است locale=`en` انتخاب کرده باشد — هنوز به Provider ایرانی می‌رود. کاربر مهاجر در آمریکا با locale=`fa` به OpenAI/Gemini می‌رود اما پرامپت فارسی می‌گیرد.

**مسئولیت API Route:**
هر API Route که `invokeAI()` صدا می‌زند **باید** countryCode را از header استخراج کند و در ctx بفرستد:

```typescript
import { getCountryFromHeaders } from "@/lib/utils/geo";

const clientCountry = getCountryFromHeaders(request.headers);
const result = await invokeAI("role-id", input, {
  userId: user.userId,
  locale: user.locale ?? "fa",
  clientCountry,
});
```

**در dev:** header `x-dev-country: US` (یا هر کشور) برای شبیه‌سازی routing.

### نقش‌ها همگن نیستند — هر نقش input/output خودش را دارد

- معماری Registry با generic `AIRole<TInput, TOutput>` ساخته شده — هر نقش schema مخصوص خودش را تعریف می‌کند
- نمونه‌ها:
  - `weekly-report`: input = یک هفته داده، output = خلاصه + completionRate + highlights + reflection
  - `chat-companion` (همدم، DECISION-031): input = messages history + context snapshot، output = reply
  - `goal-companion` (همراه، DECISION-082): input = هدف + استوری‌ها + تعهدهای اخیر + سیگنال هفتگی + چتِ اخیر، output = reflection + observations + suggestions (Pro، روزِ ۳ تا قبل از پایان، روزی یک‌بار)
  - `plan-suggestion` (آینده): input = پلن فعال + تعهدهای اخیر، output = پیشنهاد تعهد روزانه
- هر نقش schema خود، prompt خود، meta خود را دارد — هیچ‌گاه «یک schema کلی» برای همه نقش‌ها نیست
- چت‌بات یک نقش ساختاری است (مثل گزارش هفتگی)، نه یک سرویس جداگانه — به همان معماری وصل می‌شود

### چت‌بات همسو (DECISION-031)
- نقش `chat-companion` — همدل، نه assistant عمومی، نه ChatGPT
- در همه صفحات authenticated با FAB شناور در دسترس
- rate limit ساختاری: حداکثر N پیام در روز per plan (در سرور enforce می‌شود)
- خط قرمزها در پرامپت: بدون «همیشه در دسترسم»، بدون ایموجی، بدون تشویق برای بازگشت
- جزئیات کامل: DECISION-031 + TASK-AI-CHAT

### Observability
- در dev: `DevAIInspector` (تب 🧠 در DevDataPanel) آخرین ۵۰ فراخوانی + system/user prompt + raw/parsed output + tokens + latency را نشان می‌دهد
- در prod: فقط metadata (provider، model، tokens، latency) — هیچ prompt یا output ثبت نمی‌شود (حریم خصوصی)

---

## ۹. احراز هویت (Auth Strategy)

### فاز اول (MVP)
- ورود با شماره موبایل ایران + OTP
- OTP در فاز تست: کد ثابت یا log شده (بدون SMS واقعی)
- معماری: `SMSAdapter` Interface — Provider ندارد اما Interface کامل است

### فاز بعدی
- اتصال به SMS Provider واقعی (Kavenegar، Melipayamak، یا مشابه)
- فقط Implementation عوض می‌شود، Interface ثابت می‌ماند

```typescript
interface SMSAdapter {
  sendOTP(phone: string, code: string): Promise<boolean>;
}
```

---

## ۱۰. فازهای توسعه

### فاز ۰ — Setup (جاری)
- [ ] راه‌اندازی پروژه Next.js + TypeScript
- [ ] تنظیم Prisma + PostgreSQL
- [ ] ساختار پوشه‌ها
- [ ] فایل‌های مستندات پایه

### فاز ۱ — MVP Core
- [ ] Auth (شماره موبایل + OTP تستی)
- [ ] ثبت تعهد روزانه
- [ ] بازخورد تعهد قبلی
- [ ] مدیریت فاصله غیرفعالی
- [ ] تاریخچه ساده
- [ ] گزارش هفتگی (AI)

### فاز ۲ — Polish & Expand
- [ ] SMS Provider واقعی
- [ ] یادآوری‌های اختیاری
- [ ] پلن‌ها و محدودیت‌ها
- [ ] اشتراک‌گذاری خروجی‌ها

### فاز ۳ — Growth
- [ ] موبایل (PWA یا React Native)
- [ ] چت‌بات همراه
- [ ] قابلیت‌های اجتماعی (همسوگرام)

---

## ۱۱. محیط و تنظیمات

```env
# .env.local (نمونه — هرگز commit نکن — در .gitignore)
NEXT_PUBLIC_APP_MODE="development"  # یا "production" — منبع حقیقت Mode (§۱۳)
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="..."

# AI Services — دیگر env-محور نیست (DECISION-039 + DECISION-048)
# سرویس‌ها (آدرس/کلید/مدل) در پنل ادمین تعریف و در DB (AiService) ذخیره می‌شوند.
# «mock» کاملاً حذف شده — فقط سرویس واقعی. GAPGPT_*/OPENAI_* فقط لگاسی‌اند.

# SMS
SMS_PROVIDER="mock"
SMS_API_KEY=""

# Business rules
OTP_EXPIRY_MINUTES=5
ENTRY_EDIT_WINDOW_HOURS=2
```

**قاعده روتینگ سرویس AI (DECISION-039 + DECISION-048):**
- منطقهٔ کاربر از country IP: `IR` ↔ بقیه/null → `INTL`.
- ترتیب resolve: اتصال صریح بخش→سرویس → سرویس پیش‌فرضِ منطقه → **پیش‌فرض سراسری** (تنها سرویس فعال) → خطای واضح (دیگر هیچ mockی نیست).
- آدرس/کلید/مدل از ردیف `AiService` می‌آید (نه env). تغییر از پنل ادمین، بلافاصله (با invalidate cache) اعمال می‌شود.

**برای dev:** کشور تشخیص داده نمی‌شود (null) → منطقهٔ `INTL` → چون سرویس مخصوص INTL نیست، fallback سراسری به تنها سرویس فعال (GapGPT). با header `x-dev-country: IR` می‌توان منطقهٔ IR را شبیه‌سازی کرد.

---

## ۱۲. چک‌لیست قبل از هر commit

- [ ] TypeScript بدون error compile می‌شود؟
- [ ] هیچ API key یا secret در کد نیست؟
- [ ] تغییرات معماری در DECISIONS.md ثبت شده‌اند؟
- [ ] TASKS.md آپدیت شده؟
- [ ] اصول طراحی (بخش ۲) نقض نشده‌اند؟
- [ ] هر فیچر dev-only فقط از طریق لایه‌های §۱۳ پیاده شده؟ (نه `if (NODE_ENV)` خام)

---

## ۱۳. قانون Dev/Prod Mode — معماری اجباری

> این بخش از DECISION-016 و DECISION-021 سرچشمه می‌گیرد. **هیچ فیچر dev-only بدون استفاده از این لایه‌ها نوشته نمی‌شود.**

### چرا؟
ما در حین توسعه نیاز داریم بدون SMS واقعی، بدون payment gateway واقعی، بدون AI واقعی، و بدون انتظار زمان واقعی کار کنیم — اما UI همان UI پروداکشن باشد. راه‌حل: یک پرچم متمرکز + لایه‌های جداسازی که هم راحت‌اند و هم تضمین می‌کنند چیزی در بسته prod نشت نکند.

### منبع حقیقت
متغیر محیطی **`NEXT_PUBLIC_APP_MODE`** تنها مرجع تعیین حالت است.
- مقادیر مجاز: `"development"` | `"production"`
- هر چیز دیگر (یا خالی) → `production` (fail-safe)
- چرا `NEXT_PUBLIC_*`؟ Next.js این متغیرها را در build به literal تبدیل می‌کند، پس کد dev از bundle prod حذف می‌شود (tree-shaking).

### لایه‌های معماری

| لایه | فایل/کامپوننت | کاربرد |
|------|---------------|--------|
| ۱. منبع حقیقت | `src/lib/env.ts` | export های `APP_MODE`, `IS_DEV_MODE`, `IS_PROD_MODE` |
| ۲. محافظ UI | `<DevOnly>` در `src/components/dev/DevOnly.tsx` | wrap هر UI dev-only |
| ۳. محافظ API | `devOnlyPayload()` در `src/lib/utils/dev-response.ts` | فیلدهای dev-only در JSON response |
| ۴. نشانگر بصری | `<DevModeBadge>` در `src/components/dev/DevModeBadge.tsx` | badge «DEV» گوشه پایین-چپ |
| ۵. منبع زمان | `getNow()` در `src/lib/dev/time.ts` | جایگزین `new Date()` در سرور — قابل override در dev |
| ۶. ابزارهای دیتا | `<DevDataPanel>` در `src/components/dev/DevDataPanel.tsx` | time-travel + seed data — در layout root نصب |

### قوانین استفاده

#### ✅ همیشه
- برای چک حالت، از `IS_DEV_MODE` / `IS_PROD_MODE` (از `@/lib/env`) استفاده کن.
- برای UI: `<DevOnly>...</DevOnly>` بپوش.
- برای API: کلیدهای dev-only را با `...devOnlyPayload({ ... })` spread کن.
- برای پنل‌های dev مخصوص یک فیچر: کامپوننت اختصاصی در `src/components/dev/` بساز.
- دفاع در عمق: داخل پنل dev هم یک چک `if (!IS_DEV_MODE) return null` بگذار — حتی اگر بیرونی فراموش شد.
- هر route در `/api/dev/*` باید اول `if (!IS_DEV_MODE) return 404` چک کند.
- مسیر `/api/dev` باید در `PUBLIC_PATHS` میدلور باشد (چون route handler خودش گارد دارد).
- **هر کد سرور که به «الان» نیاز دارد**: از `getNow()` (نه `new Date()`) استفاده کن.

#### ❌ هرگز
- `process.env.NODE_ENV === "development"` در کد فیچر چک نکن.
- `process.env.NEXT_PUBLIC_APP_MODE` را مستقیماً جای دیگری از `src/lib/env.ts` نخوان.
- پیلود dev-only را با `if (isDev)` دستی شرطی نکن — همیشه از `devOnlyPayload()`.
- در پاسخ‌های error یا log سرور، اطلاعات حساس را با چک dev نشت نده.
- `new Date()` یا `Date.now()` مستقیم در کد سرور — همیشه `getNow()` / `nowMs()`.

### قانون فیچرهای زمان‌محور
> هر فیچر **زمان‌محور** (بازخورد فردا، گزارش هفتگی، فاصله، یادآوری) یا وابسته به **کاربر دیگر** (شبکه اجتماعی، چالش) باید قبل از merge، حداقل یک ساب‌تسک «Dev tooling» داشته باشد که اجازه می‌دهد بدون انتظار واقعی، کل جریان فیچر تست شود.

**ابزارهای موجود در `<DevDataPanel>` (تب ⏰ / تب 🌱):**
- `POST /api/dev/time/set { offsetDays: -7 }` — رفتن به ۷ روز پیش
- `POST /api/dev/time/set { targetIso: "..." }` — رفتن به تاریخ دقیق
- `POST /api/dev/time/reset` — بازگشت به زمان واقعی
- `POST /api/dev/seed/entries { days: 7 }` — ۷ تعهد گذشته
- `POST /api/dev/seed/feedback` — بازخورد برای تعهدهای موجود
- `POST /api/dev/seed/full-week` — یک هفته کامل (تعهد + بازخورد)
- `POST /api/dev/reset/me` — پاک کردن همه داده‌های seed + ریست زمان

### الگوی کامل (مرجع — جریان OTP)

**API** — `src/app/api/auth/request-otp/route.ts`:
```typescript
import { devOnlyPayload } from "@/lib/utils/dev-response";
return NextResponse.json({
  ok: true,
  ...devOnlyPayload({ devCode: code }),
});
```

**UI** — `src/app/login/page.tsx`:
```tsx
import { DevOnly } from "@/components/dev/DevOnly";
import { DevOtpPanel } from "@/components/dev/DevOtpPanel";

<DevOnly>
  <DevOtpPanel code={devCode} onFill={handleDevAutoFill} />
</DevOnly>
```

### تست قبل از merge هر فیچر dev-only
- [ ] `NEXT_PUBLIC_APP_MODE=production npm run build && npm start` — هیچ اثری از UI/payload dev دیده نمی‌شود
- [ ] همه `/api/dev/*` در prod → 404 (تأیید شده در TASK-DEV-DATA-08)
- [ ] `NEXT_PUBLIC_APP_MODE=development npm run dev` — همه ابزارهای dev فعال‌اند
- [ ] Badge «DEV» در dev دیده می‌شود، در prod نه

### وقتی فیچر جدید dev-only نیاز داشت
1. اگر فقط چند خط است: `<DevOnly>` کافیست
2. اگر پنل کامل می‌خواهد: یک کامپوننت `Dev<Feature>Panel.tsx` در `src/components/dev/` بساز
3. اگر API باید چیزی برگرداند: `devOnlyPayload({ ... })` استفاده کن
4. اگر منطق سرور باید متفاوت باشد: `IS_DEV_MODE` در سرور هم در دسترس است (هرگز validation امنیتی را dev-only نکن)
5. اگر فیچر زمان‌محور است: از `getNow()` استفاده کن — time-travel خودکار کار می‌کند
6. اگر نیاز به داده تاریخی دارد: از `POST /api/dev/seed/*` استفاده کن (یا ساب‌تسک seed جدید بساز)

---

*آخرین بروزرسانی: ۲۰۲۶-۰۵-۲۷ — گسترش §۱۳ با DECISION-021 (time-travel + seed + DevDataPanel)*
*این فایل با هر تصمیم مهم باید بروزرسانی شود.*
