# DECISIONS.md — تصمیمات معماری پروژه همسو

> هر تصمیم مهم فنی یا معماری در اینجا ثبت می‌شود.
> هدف: شفافیت کامل درباره «چرا» تصمیم گرفتیم، نه فقط «چه» تصمیمی گرفتیم.

---

## فرمت ثبت تصمیم

```
### DECISION-NNN | عنوان تصمیم
- **تاریخ:** YYYY-MM-DD
- **وضعیت:** ✅ تأیید شده | ⏳ در بررسی | ❌ رد شده | 🔄 جایگزین شده
- **زمینه:** چرا این تصمیم لازم بود؟
- **گزینه‌ها:** چه گزینه‌هایی بررسی شدند؟
- **تصمیم:** چه انتخابی شد؟
- **دلیل:** چرا این گزینه انتخاب شد؟
- **پیامدها:** چه چیزی تغییر می‌کند یا باید رعایت شود؟
```

---

## تصمیمات ثبت‌شده

### DECISION-001 | انتخاب Next.js App Router به عنوان فریمورک اصلی
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **زمینه:** نیاز به فریمورک وب فول‌استک با SSR، API Routes، و TypeScript کامل
- **گزینه‌ها:**
  - Next.js 14+ App Router
  - Remix
  - SvelteKit
- **تصمیم:** Next.js 14+ App Router
- **دلیل:** اکوسیستم بزرگ‌تر، پشتیبانی بهتر از TypeScript، API Routes داخلی، سهولت توسعه و استقرار
- **پیامدها:** استفاده از App Router (نه Pages Router)؛ Server Components پیش‌فرض هستند

---

### DECISION-002 | Adapter Pattern برای AI و SMS
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **زمینه:** پروژه باید مستقل از هر Provider خاص باشد (OpenAI، Gemini، Kavenegar، و غیره)
- **گزینه‌ها:**
  - استفاده مستقیم از SDK هر Provider
  - Adapter Pattern با Interface مشترک
- **تصمیم:** Adapter Pattern اجباری برای تمام سرویس‌های خارجی
- **دلیل:** اصل استقلال از Provider — تعویض Provider نباید نیاز به تغییر منطق کسب‌وکار داشته باشد
- **پیامدها:** هر سرویس خارجی باید Interface داشته باشد؛ کد کسب‌وکار فقط با Interface کار می‌کند

---

### DECISION-003 | SQLite + Prisma ORM (در فاز MVP)
- **تاریخ:** ۲۰۲۶-۰۵-۲۷ (به‌روزرسانی بر اساس تصمیم صاحب پروژه)
- **وضعیت:** ✅ تأیید شده
- **زمینه:** نیاز به دیتابیس رابطه‌ای با تایپ‌سیف بودن در TypeScript؛ نیاز به سرعت بالای توسعه در MVP بدون وابستگی به سرویس خارجی
- **گزینه‌ها:**
  - PostgreSQL + Prisma (نسخه قبلی این تصمیم)
  - SQLite + Prisma
  - Drizzle ORM
- **تصمیم:** SQLite + Prisma در فاز MVP — Migration به Postgres در صورت نیاز فاز ۲ یا ۳
- **دلیل:** صفر-پیکربندی، فایل دیتابیس درون پروژه (`prisma/dev.db`)، حذف وابستگی به نصب Postgres محلی، نگه‌داشتن سرعت اولیه توسعه. Prisma به‌خاطر لایه ORM امکان جابجایی Provider را با تغییر `provider` در `schema.prisma` می‌دهد.
- **پیامدها:**
  - فیلدهای SQLite ⟶ محدودیت تایپ‌ها (مثلاً `Enum` به‌صورت `String` ذخیره می‌شود؛ آرایه‌ها پشتیبانی مستقیم ندارند)
  - در طراحی Schema باید مراقب باشیم که چیزی خاص Postgres استفاده نکنیم (`JSONB`, `arrays`, …)
  - هر تغییر Schema حتماً از طریق Prisma Migration؛ هرگز دستکاری مستقیم فایل دیتابیس
  - `DATABASE_URL="file:./dev.db"` در `.env.local`
  - فایل `prisma/dev.db` در `.gitignore` قرار می‌گیرد

---

### DECISION-004 | Auth با OTP (بدون Password)
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **زمینه:** کاربر ایرانی؛ نیاز به ورود ساده و آشنا
- **گزینه‌ها:**
  - Email + Password
  - Social Login (Google)
  - شماره موبایل + OTP
- **تصمیم:** شماره موبایل ایران + OTP
- **دلیل:** مناسب کاربر ایرانی؛ بدون نیاز به email؛ آشنا و ساده؛ SMS Adapter امکان جایگزینی Provider را می‌دهد
- **پیامدها:** در MVP کد OTP به‌صورت Mock (ثابت یا log شده) است؛ در فاز بعدی به SMS Provider واقعی متصل می‌شود

### DECISION-005 | AI Provider فاز اول — Mock
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **تصمیم:** در MVP کامل از Mock AIAdapter استفاده می‌شود
- **دلیل:** صاحب پروژه تأیید کرده؛ Provider واقعی در فاز بعدی
- **پیامدها:** AIAdapter Interface کامل پیاده‌سازی می‌شود اما Implementation موقتاً Mock است

### DECISION-006 | State Management — Zustand
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **تصمیم:** Zustand برای global state
- **دلیل:** ساده، lightweight، بدون boilerplate

### DECISION-007 | نمایش تاریخچه — صفحه مستقل
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **تصمیم:** صفحه مستقل `/history`
- **دلیل:** فضای سکوت بیشتر، UX بهتر برای تاریخچه طولانی

### DECISION-008 | OTP تستی — Console Log
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **تصمیم:** کد OTP در log سرور نمایش داده می‌شود
- **دلیل:** واقعی‌ترین شبیه‌سازی بدون SMS واقعی

### DECISION-009 | زبان گزارش هفتگی — فارسی کامل
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **تصمیم:** گزارش هفتگی کاملاً فارسی، اعداد هم به فارسی (۱،۲،۳)
- **دلیل:** هویت ایرانی محصول — اعداد فارسی: `toLocaleString('fa-IR')`

### DECISION-010 | پلن‌ها — بعد از پیاده‌سازی کامل
- **تاریخ:** فاز ۰
- **وضعیت:** ✅ تأیید شده
- **تصمیم:** فعلاً همه فیچرها بدون محدودیت پلن پیاده‌سازی می‌شوند
- **دلیل:** تصمیم پلن‌بندی بعد از دیدن همه فیچرها گرفته می‌شود
- **پیامدها:** Schema باید `plan` field داشته باشد اما enforcement فعلاً غیرفعال است

### DECISION-011 | پورت Landing Page به Next.js
- **تاریخ اولیه:** ۲۰۲۶-۰۵-۲۷ | **به‌روزرسانی:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** 🔄 جایگزین شده — پورت کامل به Next.js انجام شد
- **زمینه:** صفحه Landing از پیش با HTML خام + Tailwind CDN + فونت Pelak ساخته شده بود. صاحب پروژه تصمیم گرفت که جریان صحیح UX این است: `/` (لندینگ) → CTA → `/login` → `/dashboard`. بنابراین پورت کامل انجام شد.
- **تصمیم نهایی:** پورت کامل `landing.html` به `src/app/page.tsx` (Next.js Server Component)
- **دلیل:**
  - جریان UX درست: لندینگ اول، لاگین بعد (با CTA)
  - یک codebase: نه HTML خام جدا از Next.js
  - بهینه‌سازی‌های Next.js: Image optimization، font loading، SEO metadata
  - امکان استفاده از design tokens و globals.css مشترک
- **پیاده‌سازی:**
  - `src/app/page.tsx` — Server Component با تمام بخش‌های لندینگ
  - `src/components/features/landing/LandingEffects.tsx` — Client Component برای scroll reveal + parallax
  - CSS های landing اضافه‌شده به `src/app/globals.css` (بخش جدید «Landing Page»)
  - Middleware آپدیت شد: `/` در `PUBLIC_PATHS` اضافه شد؛ کاربر logged-in از `/` به `/dashboard` ریدایرکت می‌شود
  - CTA های «شروع کن» به `/login` لینک می‌دهند (از `#` تغییر کردند)
  - `public/landing.html` به عنوان مرجع نگه‌داشته شده (archive)

---

### DECISION-012 | محدودیت‌های SQLite در Schema
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **زمینه:** SQLite برخی تایپ‌ها / فیچرها را که در Postgres طبیعی است پشتیبانی نمی‌کند. این محدودیت‌ها باید در طراحی Schema رعایت شوند تا migration به Postgres در آینده ساده باشد.
- **تصمیم:** قواعد زیر در `prisma/schema.prisma` رعایت می‌شوند:
  - **Enum:** SQLite/Prisma از enum پشتیبانی ندارد → فیلدهای enum-like به‌صورت `String` ذخیره می‌شوند. مقادیر مجاز در `src/constants/` تعریف می‌شوند:
    - `User.plan` → `src/constants/plans.ts` (`FREE` | `PLUS` | `PRO`)
    - `EntryFeedback.status` → `src/constants/feedback.ts` (`DONE` | `NOT_DONE`)
  - **JSON:** Prisma+SQLite بدون پشتیبانی native `Json` → `WeeklyReport.aiContent` به‌صورت `String` (JSON serialized) ذخیره می‌شود؛ parse در application layer انجام می‌گیرد.
  - **Array:** پشتیبانی نمی‌شود — در صورت نیاز از مدل join استفاده می‌شود.
  - **cuid()** به‌جای uuid() برای `id` (پیش‌فرض Prisma).
- **پیامدها:**
  - تمام type-guard ها در `src/constants/*.ts` نوشته می‌شوند (نه در runtime DB)
  - هنگام migration به Postgres در فاز ۲/۳: اگر تصمیم گرفته شد، می‌توان enum و Json native اضافه کرد بدون شکستن داده‌ها

---

### DECISION-013 | Prisma 6.x (نه 7.x)
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **زمینه:** هنگام نصب اولیه، `npm install prisma` نسخه `7.8.0` را نصب کرد. Prisma 7 یک breaking change بزرگ دارد: فیلد `url` در datasource حذف شده و باید از `prisma.config.ts` با driver adapter استفاده شود.
- **گزینه‌ها:**
  - الف) ماندن روی Prisma 7 + پیاده‌سازی `prisma.config.ts` + `@prisma/adapter-better-sqlite3`
  - ب) Downgrade به Prisma 6.x (LTS)
- **تصمیم:** Prisma 6.19.3 (آخرین 6.x)
- **دلیل:** workflow سنتی، document بهتر، سادگی برای MVP، سازگاری با CLAUDE.md (که `datasource { url = env(...) }` فرض گرفته)
- **پیامدها:**
  - `package.json` → `prisma: ^6, @prisma/client: ^6`
  - اگر در فاز ۲/۳ تصمیم به upgrade Prisma 7 گرفته شد، باید `prisma.config.ts` نوشته شود و PrismaClient با adapter ساخته شود.

---

### DECISION-014 | Session Management — JWT در HTTP-only Cookie
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **زمینه:** نیاز به مدیریت session برای auth OTP-based بدون NextAuth
- **گزینه‌ها:**
  - NextAuth.js
  - JWT در localStorage
  - JWT در HTTP-only Cookie با jose
- **تصمیم:** JWT امضاشده با HS256 (کتابخانه `jose`) — ذخیره در HTTP-only Cookie به نام `hamsoo-session`
- **دلیل:** بدون وابستگی به NextAuth (که برای OAuth طراحی شده)؛ `jose` در Edge runtime (middleware) کار می‌کند؛ HTTP-only cookie از XSS مصون است؛ simple و قابل کنترل
- **پیامدها:**
  - `NEXTAUTH_SECRET` در env به عنوان JWT secret استفاده می‌شود
  - cookie: `httpOnly, secure(prod), sameSite:strict, maxAge:30d`
  - middleware با `jose.jwtVerify` token را در Edge runtime بررسی می‌کند

---

### DECISION-015 | Phone Normalization — فرمت ذخیره +98XXXXXXXXXX
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **تصمیم:** همه شماره‌ها قبل از ذخیره در DB به فرمت `+98XXXXXXXXXX` نرمال می‌شوند
- **دلیل:** جلوگیری از duplicate user با فرمت‌های مختلف (09, 9, +98); DB unique constraint روی phone
- **پیامدها:** `normalizeIranPhone()` در `src/lib/utils/otp.ts` — قبل از هر کوئری DB باید فراخوانی شود

---

### DECISION-016 | جداسازی Dev/Prod با Mode Layer (معماری ۴ لایه)
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **زمینه:** در حین توسعه نیاز داریم بدون SMS واقعی، Provider واقعی AI، و پرداخت واقعی کار کنیم — اما UI باید مثل پروداکشن باشد. این الگو در طول پروژه برای ده‌ها فیچر تکرار خواهد شد، پس نیاز به یک معماری استاندارد داریم که هم راحت باشد و هم تضمین کند کد dev در bundle پروداکشن نشت نمی‌کند.
- **گزینه‌ها:**
  - الف) `if (process.env.NODE_ENV === 'development')` در هر فیچر — پراکنده، خطاپذیر، تست‌سخت
  - ب) فقط استفاده از Mock Adapter ها — کافی نیست؛ UI/UX هم باید تفاوت داشته باشد (مثل نمایش OTP)
  - ج) معماری ۴ لایه‌ای: env.ts منبع حقیقت + `<DevOnly>` + `devOnlyPayload()` + `<DevModeBadge>`
- **تصمیم:** گزینه (ج) — معماری ۴ لایه با متغیر `NEXT_PUBLIC_APP_MODE` به عنوان منبع حقیقت
- **دلیل:**
  - **یک منبع حقیقت:** فقط `src/lib/env.ts` حالت را تعیین می‌کند؛ بقیه از آن می‌خوانند
  - **Tree-shaking:** Next.js متغیر `NEXT_PUBLIC_*` را در build inline می‌کند → `if (IS_DEV_MODE)` در prod به `if (false)` تبدیل و حذف می‌شود
  - **Fail-safe:** هر چیز غیر از `"development"` → `production` (اگر کسی .env را فراموش کرد، حالت امن)
  - **دفاع در عمق:** هم API پیلود dev را حذف می‌کند، هم UI آن را پنهان می‌کند، هم خود پنل دفاعاً چک می‌کند
  - **توسعه‌پذیر:** افزودن staging در آینده فقط با گسترش type union و یک سطر منطقی
- **پیامدها:**
  - متغیر جدید: `NEXT_PUBLIC_APP_MODE` در `.env.example` و `.env.local`
  - فایل‌های جدید:
    - `src/lib/env.ts` — منبع حقیقت
    - `src/lib/utils/dev-response.ts` — `devOnlyPayload()` helper
    - `src/components/dev/DevOnly.tsx` — wrapper UI
    - `src/components/dev/DevModeBadge.tsx` — نشانگر بصری (در root layout نصب شده)
    - `src/components/dev/DevOtpPanel.tsx` — پنل dev برای OTP (اولین مصرف‌کننده الگو)
  - قانون جدید در CLAUDE.md §۱۳ — اجباری برای هر فیچر dev-only
  - DECISION-008 (OTP در console log) همچنان معتبر است اما اکنون با لایه UI تکمیل شده

---

### DECISION-017 | State Management — Zustand
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده (Q-002)
- **زمینه:** نیاز به global state برای اشتراک داده بین کامپوننت‌های client-side در فاز ۱+
- **گزینه‌ها:** Zustand | React Context | Jotai
- **تصمیم:** Zustand
- **دلیل:** سبک، بدون boilerplate، API ساده، مستقیم با TypeScript — صاحب پروژه تأیید کرده (Q-002)
- **پیامدها:** `npm install zustand` هنگام اولین نیاز واقعی به global state؛ local state (`useState`) کافی باشد → از Zustand استفاده نشود

---

### DECISION-018 | نمایش تاریخچه — صفحه مستقل
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده (Q-003)
- **زمینه:** TASK-008 نیاز به تعریف نحوه نمایش تاریخچه دارد
- **گزینه‌ها:** صفحه مستقل `/history` | Modal | Drawer
- **تصمیم:** صفحه مستقل در مسیر `/history`
- **دلیل:** فضای سکوت بیشتر، UX بهتر برای تاریخچه طولانی، جدایی واضح از داشبورد — صاحب پروژه تأیید کرده (Q-003)
- **پیامدها:** Route جدید `/history` در فاز TASK-008 ساخته می‌شود

---

### DECISION-019 | تاریخ شمسی — jalaali-js
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **زمینه:** اپلیکیشن فارسی — نمایش و منطق تاریخ باید بر اساس تقویم جلالی باشد. تعهد «یک روز» نیز بر اساس روز شمسی تعریف می‌شود.
- **گزینه‌ها:** `jalaali-js` | `date-fns-jalali` | پیاده‌سازی custom
- **تصمیم:** `jalaali-js`
- **دلیل:** سبک‌ترین گزینه (فقط تبدیل Gregorian ↔ Jalali + فرمت‌بندی)؛ برای MVP کاملاً کافی است؛ صاحب پروژه انتخاب کرد
- **پیامدها:**
  - `npm install jalaali-js` + `@types/jalaali-js` — ✅ نصب شد
  - ابزارهای تاریخ در `src/lib/utils/date.ts` — timezone ایران (UTC+3:30) در نظر گرفته می‌شود
  - اگر در آینده نیاز به عملیات پیچیده‌تر (مقایسه، اضافه/کم کردن روز شمسی) بود → `date-fns-jalali` ارزیابی می‌شود

---

### DECISION-020 | AI Architecture — Registry + Orchestrator
- **تاریخ:** ۲۰۲۶-۰۵-۲۷ | **به‌روزرسانی:** ۲۰۲۶-۰۵-۲۸ (DECISION-030)
- **وضعیت:** ✅ تأیید شده — معماری از همان TASK-009 پیاده می‌شود
- **زمینه:** AI «قلب تپنده» همسوست (مرجع: memory project-ai-as-heart). AIAdapter فعلی (TASK-003) برای یک نقش (گزارش هفتگی) کافی است، اما با اضافه شدن چت‌بات، پیشنهاد پلن، تحلیل الگو و ... به سرعت تبدیل به spaghetti می‌شود.
- **گزینه‌ها:**
  - الف) ادامه با AIAdapter ساده + هر نقش به‌صورت ad-hoc در API route ها
  - ب) Registry/Orchestrator با AI Role های type-safe، prompt نسخه‌پذیر، observability
  - ج) ساخت Registry از همین حالا (قبل از TASK-009)
- **تصمیم:** گزینه (ب) — Registry/Orchestrator با ۴ لایه. **timing:** بلافاصله بعد از TASK-009 (گزارش هفتگی) — تا یک نقش عملی به‌عنوان مرجع داشته باشیم. تأیید صاحب پروژه: ۲۰۲۶-۰۵-۲۷
- **دلیل:**
  - Single Responsibility برای هر نقش — قابل تست/تغییر مستقل
  - Provider-agnostic باقی می‌ماند (AIAdapter زیر همه چیز)
  - Prompt versioning + observability از روز اول
  - اضافه کردن نقش جدید = ۵ دقیقه، بدون لمس بقیه
- **پیامدها:**
  - سند معماری کامل در `docs/features/ai-architecture.md`
  - TASK-AI-ARCH (با ۸ ساب‌تسک) به TASKS.md اضافه شد
  - TASK-009 با AIAdapter ساده انجام می‌شود؛ سپس به Registry مهاجرت می‌کند (TASK-AI-ARCH-04)
  - CLAUDE.md §۸ بعد از TASK-AI-ARCH-08 با pattern «افزودن نقش جدید» آپدیت می‌شود

---

### DECISION-021 | Dev Data Generation — گسترش §۱۳
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **زمینه:** فیچرهای زمان‌محور (بازخورد فردا، گزارش هفتگی، فاصله، یادآوری) و فیچرهای چندکاربره (شبکه اجتماعی، چالش) بدون فریم‌ورک time-travel/seed قابل تست نیستند. memory project-dev-data-generation این نگرانی را cross-cutting می‌داند.
- **گزینه‌ها:**
  - الف) seed-on-demand: هر فیچر اسکریپت seed خود را داشته باشد
  - ب) فقط override timezone در dev
  - ج) فریم‌ورک یکپارچه: Time Source + Seed API + UI Panels + Data Markers (همان pattern §۱۳)
- **تصمیم:** گزینه (ج) — `src/lib/dev/time.ts` + `/api/dev/*` + `<DevDataPanel>` + ستون `_devSeed`
- **دلیل:**
  - همان pattern §۱۳ (که موفق ثابت شد) را به time و seed گسترش می‌دهد
  - دفاع در عمق: tree-shake + API guard + UI guard + DB marker
  - هیچ‌گاه به prod نشت نمی‌کند
  - هر فیچر زمان‌محور یک ساب‌تسک «dev tooling» اجباری دارد (قانون §۱۳ جدید)
- **پیامدها:**
  - سند کامل در `docs/features/dev-data-generation.md`
  - TASK-DEV-DATA، TASK-DEV-MOCK-USERS، TASK-DEV-AI-INSPECTOR ایجاد شدند
  - CLAUDE.md §۱۳ بعد از TASK-DEV-DATA-09 با قانون «هر فیچر زمان‌محور = یک ساب‌تسک dev» آپدیت می‌شود

---

### DECISION-022 | i18n Strategy — فارسی default، انگلیسی secondary
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ⏳ در بررسی (تعارض با §۲ «فارسی اصیل»)
- **زمینه:** صاحب پروژه افزودن انگلیسی به اپ را خواسته. مانیفست §۲ بر «فارسی اصیل» تأکید دارد. این تنش باید با طراحی دقیق حل شود.
- **گزینه‌ها:**
  - الف) فقط فارسی (وفاداری مطلق به مانیفست)
  - ب) فارسی default + انگلیسی secondary (i18n با Locale routing، فارسی محصول کانونیک)
  - ج) دو محصول جدا (hamsoo.app برای فارسی، en.hamsoo.app برای انگلیسی)
- **تصمیم پیشنهادی:** گزینه (ب) — فارسی همیشه default، تمام content/prompt های AI ابتدا به فارسی، انگلیسی ترجمه ثانوی
- **بند سازگاری با مانیفست:** فارسی همیشه canonical است. متن انگلیسی هرگز کیفیت یا تجربه را تعریف نمی‌کند — فقط دسترسی‌پذیری اضافه می‌کند. اگر بین کیفیت فارسی و کامل بودن انگلیسی تضاد بود، فارسی برنده است.
- **دلیل:**
  - بازار اولیه ایرانی — فارسی always
  - مخاطب ثانوی (مهاجر، فارسی‌زبان غیر بومی، کنجکاو خارجی) از انگلیسی بهره می‌برد
  - هرچه دیرتر شروع شود، migration گران‌تر است — پس زیرساخت i18n باید قبل از انباشت متن فارسی بیشتر آماده شود
- **پیامدها:**
  - TASK-I18N-* در TASKS.md (فاز ۲ زیرساخت، فاز ۳ ترجمه)
  - کتابخانه پیشنهادی: `next-intl` (App Router-native) — تصمیم نهایی در زمان شروع
  - تمام prompt های AI به فارسی نوشته می‌شوند؛ نقش‌های روزی که خروجی انگلیسی لازم باشد، نسخه `-en` در Registry اضافه می‌کنند
  - LTR/RTL handling برای UI انگلیسی

---

### DECISION-023 | Notification Strategy — چندلایه، opt-in، ضدفشار
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ⏳ در بررسی (تعارض با §۲ «بدون فشار»)
- **زمینه:** کاربر سیستم نوتیفیکیشن خواسته. مانیفست §۲ بر «بدون فشار، بدون قضاوت» تأکید دارد. نوتیف بد طراحی شده می‌تواند مستقیماً تبدیل به فشار شود.
- **گزینه‌ها:**
  - الف) بدون نوتیفیکیشن (وفاداری مطلق)
  - ب) نوتیف اختیاری، کاربر خاموش‌کن
  - ج) نوتیف اختیاری + کنترل granular + لحن غیرقضاوتی + cooldown اجباری
- **تصمیم پیشنهادی:** گزینه (ج)
- **بند سازگاری با مانیفست:**
  - پیش‌فرض: **همه نوتیف‌ها خاموش** — کاربر باید صریحاً روشن کند
  - هیچ نوتیف «استریک شکسته!» یا «۳ روزه نیومدی» — فقط «حالت چطوره؟» با لحن همسو
  - حداکثر یک نوتیف در روز برای یک کاربر (cooldown اجباری در سرور)
  - گزینه «بدون نوتیف هرگز» همیشه در دسترس
- **گزینه‌های ارسال:**
  - In-app banner (همیشه ممکن)
  - Web Push (TASK-MOBILE-05)
  - SMS (TASK-NOTIF-SMS — هزینه دارد، محدود به critical events)
  - Email (فاز ۳، اگر کاربر email داد)
- **پیامدها:**
  - TASK-NOTIF-* در TASKS.md (فاز ۲)
  - `NotificationAdapter` مشابه AIAdapter (DECISION-002)
  - مدل `NotificationPreference` per کاربر، granular per type
  - DECISION-023 با review prompt هر نوتیف — هیچ متن قضاوتی مجاز نیست

---

### DECISION-024 | Planning System ≠ Task Manager
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** 🔄 جایگزین‌شده با DECISION-082 (۲۰۲۶-۰۶-۱۳) — اصلِ «برنامه‌ریزی ≠ Task Manager» و گاردهای ساختاری در DECISION-082 حفظ و عملی شد.
- **زمینه:** صاحب پروژه «سیستم برنامه‌ریزی» را خواسته (مثال: «این هفته ۳۰ صفحه کتاب بخوانم»). مانیفست §۱ صریحاً می‌گوید همسو Task Manager نیست. این مرز باید روشن باشد.
- **مرز کلیدی — تفاوت با Task Manager:**
  | Plan در همسو (✅) | Task Manager (❌ خط قرمز) |
  |-------------------|---------------------------|
  | یک هدف یا نیت در یک بازه («این هفته ۳۰ صفحه») | لیست تسک با ددلاین |
  | پشتوانه‌ای برای تعهد روزانه (AI پیشنهاد می‌دهد) | watch list تسک‌های روزانه |
  | تک‌سطحی، بدون sub-task، بدون priority | nested، با dependencies |
  | هیچ alarm/deadline قاطعی | due dates، escalation |
  | بازخورد توسط همان جریان روزانه | check-box تسک‌ها |
- **بند سازگاری با مانیفست:**
  - یک Plan در همسو فقط یک «نیت بازه‌ای» است که به تعهدهای روزانه context می‌دهد
  - هیچ‌گاه «Plan صد تسک دارد» اجازه داده نمی‌شود
  - AI نقش `plan-suggestion` فقط *پیشنهاد* تعهد روزانه از نیت می‌دهد — هیچ‌گاه «امروز باید X کنی» نمی‌گوید
- **تصمیم پیشنهادی:** پیاده‌سازی Plan با محدودیت‌های ساختاری:
  - یک Plan = یک عنوان + یک بازه + یک متریک ساده + یک یادداشت
  - هیچ sub-task، هیچ ddl دقیق، هیچ priority
  - فقط view به‌صورت «نیت در حال جریان»، نه backlog
- **پیامدها:**
  - TASK-PLAN-* در TASKS.md (فاز ۲)
  - Schema بسیار محدود (در TASK-PLAN-01)
  - نقش AI `plan-suggestion` در Registry با prompt محتاطانه
  - این تعارض هرگز «حل» نمی‌شود مگر صاحب پروژه مانیفست را تغییر دهد. تا آن زمان، طراحی محافظ ساختاری دارد.

---

### DECISION-025 | Social Network — همسویی، نه رقابت
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ⏳ در بررسی (تعارض صریح با §۱ «بدون استریک/امتیاز/رقابت»)
- **زمینه:** صاحب پروژه شبکه اجتماعی با چالش و اشتراک نمودار خواسته. مانیفست §۱ به‌صورت قاطع رقابت/استریک/مدال را رد می‌کند.
- **بند سازگاری با مانیفست:**
  - فلسفه: «همسویی، نه مسابقه» — رشد جمعی، حضور مشترک، نه پشت سر گذاشتن هم
  - چالش گروهی = «همه با هم به این موضوع نگاه می‌کنیم» نه «اول از همه که تموم کرد، برنده»
  - اشتراک نمودار = فقط نمودار **خود کاربر**، با لینک یک‌بار مصرف
  - هیچ leaderboard، هیچ badge، هیچ مقایسه نمایش داده نمی‌شود
- **محافظ معماری:** TASK-SOCIAL-CH-04 (آنتی-رقابت) به‌صورت ساختاری چیدمان دیتا را تضمین می‌کند که چنین UI ای قابل ساخت نباشد بدون شکستن schema
- **پیامدها:**
  - سند کامل در `docs/features/social-network.md`
  - TASK-SOCIAL-MVP در فاز ۲ (شروع با اشتراک گزارش، که کم‌خطرترین جزء است)
  - TASK-SOCIAL-FRIENDS و TASK-SOCIAL-CHALLENGES در فاز ۳ — مرور مانیفست قبل از شروع آن‌ها لازم است
  - هر دو طرف Friendship باید explicit accept کنند؛ بدون auto-suggest

---

### DECISION-026 | Admin Panel — Scope MVP در فاز ۲، Full در فاز ۳
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **زمینه:** پنل ادمین در عمل اندازه یک پروژه جدا دارد (۸ ساب‌سیستم). نمی‌توان همه را در یک TASK ریخت.
- **گزینه‌ها:**
  - الف) Admin کامل در فاز ۳
  - ب) MVP حداقلی در فاز ۲ + کامل در فاز ۳
  - ج) نسخه minimal همراه با launch
- **تصمیم:** گزینه (ب) — MVP در فاز ۲ شامل: مدیریت کاربران، تعریف پلن‌ها، audit log، monitoring integrations. باقی (داشبورد KPI، تیکتینگ، CMS، analytics پیشرفته، data backup) فاز ۳.
- **Auth Strategy:** Auth مشترک با کاربر عادی (OTP)؛ role روی User ذخیره می‌شود. MFA دوم (TOTP) برای OWNER/ADMIN در فاز ۳.
- **پیامدها:**
  - سند کامل در `docs/features/admin-panel.md`
  - TASK-ADMIN-MVP در فاز ۲؛ TASK-ADMIN-{DASHBOARD,SUPPORT,CMS,ANALYTICS,DATA,INTEG} در فاز ۳
  - TASK-011 (سیستم پلن‌ها) به TASK-ADMIN-MVP-06/07 + TASK-PAYMENT تجزیه می‌شود

---

### DECISION-028 | ProviderRouter — IP-Country Routing (locale و country مستقل)
- **تاریخ:** ۲۰۲۶-۰۵-۲۸ | **به‌روزرسانی:** ۲۰۲۶-۰۵-۲۸ (تفکیک locale از country)
- **وضعیت:** ✅ تأیید شده (با پیاده‌سازی Stub در فاز ۱)
- **زمینه:** صاحب پروژه دو نکته را شفاف کرد:
  1. کاربران ایران به Providerهای خارجی (OpenAI/Gemini) دسترسی ندارند و کاربران خارج به Provider ایرانی دسترسی ندارند — این **محدودیت زیرساختی** است
  2. کاربر در هر جای دنیا، **مستقل از مکان**، اختیار دارد بین فارسی/انگلیسی انتخاب کند — این **انتخاب کاربر** است
  پس locale و country دو محور **کاملاً مستقل** هستند.
- **گزینه‌ها:**
  - الف) یک Provider در env، تعویض دستی
  - ب) ProviderRouter بر اساس **locale**  ❌ (نسخه اولیه — اشتباه بود)
  - ج) ProviderRouter بر اساس **country IP** + locale جدا برای پرامپت  ✅
- **تصمیم:** گزینه (ج) — جداسازی کامل دو محور:

  | محور | منبع | مصرف‌کننده |
  |------|------|------------|
  | **locale** (fa \| en) | انتخاب کاربر، روی User ذخیره می‌شود (TASK-I18N) | PromptLoader — تعیین فایل پرامپت (`v1.fa.md` vs `v1.en.md`) |
  | **clientCountry** (IR \| US \| …) | استخراج از IP request (headers `x-vercel-ip-country` یا `cf-ipcountry`) | ProviderRouter — تعیین Adapter |

  ماتریس نمونه:
  ```
  ┌──────────────┬────────────┬─────────────────────────────────────────┐
  │ IP کشور      │ locale     │ نتیجه                                    │
  ├──────────────┼────────────┼─────────────────────────────────────────┤
  │ IR           │ fa         │ Provider ایرانی + پرامپت فارسی            │
  │ IR           │ en         │ Provider ایرانی + پرامپت انگلیسی          │
  │ US           │ fa         │ OpenAI/Gemini + پرامپت فارسی              │
  │ US           │ en         │ OpenAI/Gemini + پرامپت انگلیسی            │
  │ unknown      │ fa/en      │ Default Provider + locale انتخابی        │
  └──────────────┴────────────┴─────────────────────────────────────────┘
  ```

- **دلیل:**
  - زبان = انتخاب فرهنگی کاربر، نه دسترسی شبکه‌ای
  - country = دسترسی شبکه‌ای واقعی، تابع IP
  - این تفکیک از روز اول، migration به i18n را راحت می‌کند
  - یک کاربر ایرانی مهاجر در آمریکا می‌تواند فارسی استفاده کند بدون آنکه به Provider ایرانی محدود شود
- **پیامدها:**
  - فایل: `src/lib/ai/provider-router.ts` — signature: `getProviderForRequest({ userId, roleId, clientCountry, locale })`
  - فایل: `src/lib/utils/geo.ts` — `getCountryFromHeaders(headers)` با dev override `x-dev-country`
  - `AIInvocationContext` دو فیلد مستقل دارد: `locale` و `clientCountry`
  - **مسئولیت API Route:** هر API Route که `invokeAI()` صدا می‌زند، باید `clientCountry` را از `getCountryFromHeaders(request.headers)` بخواند و در ctx بفرستد
  - متغیر env آینده: `AI_PROVIDER_IRAN`, `AI_PROVIDER_INTL`, `AI_PROVIDER_DEFAULT` — در TASK-AI-PROVIDERS
  - User schema (TASK-I18N): فقط `locale?: "fa" | "en"` — هیچ‌گاه country روی User ذخیره نمی‌شود (متغیر است)
  - **حریم خصوصی:** country از headers است (نه IP خام) — هیچ‌جا IP کاربر لاگ نمی‌شود

---

### DECISION-029 | Prompt Storage — پوشه `/prompts` در ریشه پروژه
- **تاریخ:** ۲۰۲۶-۰۵-۲۸
- **وضعیت:** ✅ تأیید شده
- **زمینه:** AI «قلب تپنده» همسوست. پرامپت‌ها نه فقط متن‌اند — اثر هنری برندند. باید:
  - بدون deploy کد قابل ویرایش باشند (در آینده، بعد از hot-reload یا CDN-cached load)
  - نسخه‌پذیر باشند (v1, v2, …) — هرگز پرامپت قبلی پاک نمی‌شود تا A/B test ممکن باشد
  - locale-aware باشند (`v1.fa.md`, `v1.en.md`)
  - قابل مرور توسط non-engineer (designer, content strategist)
  - از کد TypeScript مستقل باشند تا change pattern های متفاوت باشد
- **گزینه‌ها:**
  - الف) Template strings درون TypeScript
  - ب) فایل `.md` کنار کد نقش (`src/lib/ai/roles/<name>/prompt.v1.md`)
  - ج) پوشه جدا `prompts/` در ریشه پروژه با ساختار `prompts/<role>/v<n>.<locale>.md`
- **تصمیم:** گزینه (ج) — پوشه `/prompts` در ریشه پروژه
- **دلیل:**
  - جداسازی کامل از کد فیچر — content team بدون درگیر شدن با src/ ویرایش می‌کند
  - URL-friendly path برای آینده (CDN-cached, hot-reloaded)
  - structure هر فایل `.md` با frontmatter (yaml) — قابل پارس
  - فرمت‌بندی markdown قابل مرور
- **ساختار:**
  ```
  prompts/
  ├── README.md                       ← قرارداد placeholder و frontmatter
  └── weekly-report/
      ├── v1.fa.md                    ← فعال
      └── (آینده) v1.en.md, v2.fa.md
  ```
- **قرارداد فایل پرامپت:**
  ```markdown
  ---
  role: weekly-report
  version: 1.0.0
  locale: fa
  jsonMode: true
  ---

  ## SYSTEM
  متن نقش — لحن، شخصیت، خط قرمزها، خروجی JSON expected schema

  ## USER
  داده ورودی با placeholder ها مثل {{INPUT_JSON}}، {{WEEK_START}}، ...
  ```
- **پیامدها:**
  - فایل جدید: `src/lib/ai/prompt-loader.ts` — می‌خواند، frontmatter parse می‌کند، sections را جدا می‌کند، placeholder ها را substitute می‌کند
  - placeholder syntax: `{{VARIABLE_NAME}}` — هر متغیر unknown → خطا (fail-fast)
  - در dev: prompt-loader هر بار از disk می‌خواند → ویرایش instant
  - در prod: cache در memory بعد از اولین خواندن
  - متغیر جدید env (اختیاری): `PROMPTS_DIR` — default `<root>/prompts`

---

### DECISION-030 | ادغام TASK-009 با TASK-AI-ARCH
- **تاریخ:** ۲۰۲۶-۰۵-۲۸
- **وضعیت:** ✅ تأیید شده (به‌روزرسانی DECISION-020 timing)
- **زمینه:** DECISION-020 گفته بود: TASK-009 با AIAdapter ساده انجام شود، سپس TASK-AI-ARCH معماری Registry را بسازد و migration کند. اما صاحب پروژه با اطلاعات جدید (چندنقشی، چندپرووایدر locale-aware، پرامپت جدا) درخواست کرد معماری از همان ابتدا درست چیده شود.
- **گزینه‌ها:**
  - الف) ادامه با طرح اولیه DECISION-020 (ساده → migration)
  - ب) ترکیب TASK-009 و TASK-AI-ARCH — معماری از روز اول
- **تصمیم:** گزینه (ب) — یک TASK ترکیبی که هم زیرساخت می‌سازد و هم اولین مصرف‌کننده است
- **دلیل:**
  - حذف دوبارکاری — همان کد دو بار نوشته نمی‌شود
  - واقعی بودن طراحی — وقتی همزمان زیرساخت و مصرف‌کننده ساخته می‌شود، طراحی روی dogfooding اصلاح می‌گیرد
  - تأخیر کم — فاز ۱.۵ بدون TASK-AI-ARCH عملاً تمام نمی‌شود
- **پیامدها:**
  - DECISION-020 نسخه ۲: timing «هم‌زمان با TASK-009» به‌جای «بعد از TASK-009»
  - ساب‌تسک‌های TASK-AI-ARCH-01..04 درون TASK-009 ادغام می‌شوند
  - ساب‌تسک‌های TASK-AI-ARCH-05..08 (نسخه‌پذیری advanced، DevAIInspector، تست e2e، docs §۸) جداگانه باقی می‌مانند برای فاز ۱.۵
  - TASKS.md آپدیت می‌شود

---

### DECISION-031 | Chat-Companion — همدل، محدود، Globally Accessible
- **تاریخ:** ۲۰۲۶-۰۵-۲۸
- **وضعیت:** ⏳ در بررسی (تعارض با §۱ «بدون وابستگی») / ✅ الزامات شفاف
- **زمینه:** صاحب پروژه شفاف کرد که چت‌بات همسو **نباید یک چت عمومی** مثل ChatGPT باشد. باید نقشی خاص داشته باشد: همدل و همراه. همچنین:
  1. در همه صفحات پروژه (با آیکون شناور پایین صفحه) در دسترس باشد
  2. محدودیت روزانه (rate limit) داشته باشد تا به وابستگی منجر نشود
  3. خروجی هر نقش AI متفاوت است — چت context-aware اما تکراری نیست
- **تصمیم پیشنهادی برای نقش `chat-companion`:**

  **شخصیت (در پرامپت):**
  - همدل، آرام، صادق — مثل یک دوست خردمند که می‌نشیند و می‌شنود
  - نه مربی، نه ناصح، نه روان‌شناس، نه task assistant
  - مرز روشن با ChatGPT: همسو سؤال عمومی پاسخ نمی‌دهد، فقط در مورد مسیر شخصی کاربر صحبت می‌کند
  - اگر کاربر سؤال خارج از حوزه پرسید (کد، اخبار، …) → با لحن مهربان به نقش خودش برمی‌گردد

  **محدودیت‌ها:**
  - حداکثر N پیام در روز (به ازای plan: FREE=10، PLUS=50، PRO=200 — مقدار نهایی در TASK-PAYMENT)
  - حداکثر طول پیام: ~۲۰۰۰ کاراکتر (جلوگیری از abuse)
  - حداکثر طول session: ~۲۰ تبادل (بعد از آن کاربر می‌تواند session جدید بسازد)
  - cooldown نرم بعد از ۵ پیام پشت سر هم — یک پیام «این فکر می‌خواهی یا حال؟ گاهی فقط نوشتنش کافی است» — اختیاری

  **Context Injection:**
  - آخرین ۷ تعهد و بازخوردهایشان
  - گزارش هفته اخیر (اگر باشد)
  - پلن‌های فعال (اگر باشد، فاز ۲)
  - **هیچ‌گاه** اطلاعات کاربران دیگر در context

  **UI — Globally Accessible:**
  - یک آیکون شناور (FAB — Floating Action Button) در گوشه پایین-چپ یا راست همه صفحه‌های authenticated
  - تپ → drawer/modal چت باز می‌شود
  - بسته شدن drawer → session نگه‌داشته می‌شود (در همین صفحه ادامه چت)
  - در `/login` و `/` (landing) نمایش داده **نمی‌شود**
  - در dev: کنار DevDataPanel — تداخل نکند

  **خط قرمزها:**
  - ❌ هیچ پیام «من اینجام برای کمک»، «هر سؤالی داری بپرس»، «همیشه در دسترسم»
  - ❌ هیچ ایموجی، هیچ پیام تأیید
  - ❌ هیچ ارجاع به ChatGPT یا «هوش مصنوعی»
  - ❌ هیچ تشویق برای استفاده بیشتر («فردا هم بیا»، «امیدوارم بازم...»)
  - ✅ پاسخ کوتاه به سؤال کوتاه. عمق به سؤال عمیق.
  - ✅ سکوت جزء پاسخ است — همسو نباید همیشه «بیشتر بنویسد»

  **بند سازگاری با مانیفست §۱ «بدون وابستگی»:**
  - rate limit ساختاری در سرور (نه فقط UI)
  - پیام rate-limit به‌جای ارور: «امروز به اندازه کافی نوشتیم. فردا دوباره اینجاست.»
  - **هرگز** notification از طرف چت ارسال نشود («یک هفته نیومدی!»)
  - دکمه «پاک کردن تاریخچه» و «خروج» همیشه در دسترس

  **شکل ورودی/خروجی:**
  - input: `{ messages: ChatMessage[], userId, contextSnapshot: { recentEntries, latestReport, ... } }`
  - output: `{ reply: string, suggestedExit?: string | null }` — JSON valid
  - چت streaming نیست در فاز اول (TASK-AI-CHAT-03 ساده شروع می‌شود؛ streaming بعداً)

- **دلیل:**
  - مرز روشن با چت عمومی → جلوگیری از scope creep
  - rate limit ساختاری → جلوگیری از وابستگی
  - context محدود به کاربر خودش → حریم خصوصی + رابطه شخصی
- **پیامدها:**
  - مدل DB جدید: `ChatSession`، `ChatMessage`، `ChatRateLimit` — schema در TASK-AI-CHAT-01
  - نقش جدید `chat-companion` در Registry — پرامپت در `prompts/chat-companion/v1.fa.md`
  - کامپوننت جدید: `<ChatFAB>` در `src/components/features/chat/` — در `src/app/(authenticated)/layout.tsx` یا root layout با گارد
  - دو endpoint: `POST /api/chat/messages` و `GET /api/chat/messages?sessionId=...`
  - TASK-AI-CHAT subtasks در فاز ۲.۵ به‌روزرسانی می‌شوند
  - برای dev: `<DevChatBypass>` در DevDataPanel — bypass rate limit برای تست

---

### DECISION-032 | OpenAI-Compatible Adapter — یک کلاس، چند instance
- **تاریخ:** ۲۰۲۶-۰۵-۲۸
- **وضعیت:** ✅ تأیید شده
- **زمینه:** GapGPT (Provider خریداری‌شده ایران) با OpenAI SDK سازگار است — همان `openai` package، فقط `baseURL` و `apiKey` متفاوت. OpenAI واقعی (فاز ۲) هم همین رابط را دارد. بسیاری از Provider های مدرن (Together، Mistral، Groq، …) نیز سازگار با OpenAI هستند.
- **گزینه‌ها:**
  - الف) هر Provider یک کلاس جدا (GapGPTAdapter، OpenAIAdapter، …)
  - ب) یک کلاس generic سازگار با OpenAI + instance های پیکربندی‌شده
- **تصمیم:** گزینه (ب) — `OpenAICompatibleAdapter` با config object
  - فایل: `src/lib/adapters/openai-compatible.adapter.ts`
  - config: `{ id, displayName, supportedLocales, baseURL, apiKey, defaultModel, timeoutMs }`
  - factory `getAIAdapterByName()` در `src/lib/adapters/index.ts` به‌ازای هر نام، instance مناسب می‌سازد و cache می‌کند
- **دلیل:**
  - حذف duplication: یک کلاس به‌جای ۵ کلاس مشابه برای هر Provider سازگار
  - افزودن Provider جدید سازگار = یک case در switch + متغیر env — صفر کد adapter جدید
  - تنوع: اگر در آینده Provider غیرسازگار (مثل Gemini با schema متفاوت) اضافه شد، کلاس جدا برای آن (مثل GeminiAdapter) ساخته می‌شود — هر دو از interface AIAdapter ارث می‌برند
- **امنیت:**
  - apiKey فقط از env خوانده می‌شود — `requireEnv()` در factory
  - constructor خطای صریح می‌دهد اگر apiKey خالی باشد
  - `sanitizeError()` در adapter: هیچ `sk-...` token در پیام خطا لو نمی‌رود
- **پیامدها:**
  - متغیرهای جدید env (در `.env.example`):
    - `AI_PROVIDER_IRAN`, `AI_PROVIDER_INTL`, `AI_PROVIDER_DEFAULT`
    - `GAPGPT_BASE_URL`, `GAPGPT_API_KEY`, `GAPGPT_MODEL`
    - `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` (آینده)
  - factory قدیمی `getAIAdapter()` به‌عنوان deprecated alias حفظ شد (backward compat — هیچ کد فعلی نمی‌شکند)
  - `ProviderRouter` اکنون از Stub خارج شد: IR → `AI_PROVIDER_IRAN`، non-IR → `AI_PROVIDER_INTL`
  - نصب dependency: `openai` (~3.5MB) — قبلاً نبود

---

### DECISION-027 | Mobile Strategy — PWA-first
- **تاریخ:** ۲۰۲۶-۰۵-۲۷
- **وضعیت:** ✅ تأیید شده
- **زمینه:** مانیفست §۱۰ فاز ۳ گفته بود «PWA یا React Native». تصمیم به این مرحله موکول بود.
- **گزینه‌ها:** PWA | Capacitor (Hybrid) | React Native | Flutter
- **تصمیم:**
  - فاز ۳-A: PWA کامل (manifest + Service Worker + Web Push + offline)
  - فاز ۳-B (اختیاری): Capacitor wrapper برای App Store / Bazaar
  - فاز ۴+ (در صورت نیاز): RN ارزیابی شود
- **دلیل:**
  - ایران ⇒ store ها محدود؛ PWA با URL در دسترس‌تر
  - یک codebase، صرفه‌جویی منابع
  - Adapter pattern موجود انتقال به RN را اگر لازم شد ساده می‌کند
- **پیامدها:**
  - سند کامل در `docs/features/mobile.md`
  - TASK-MOBILE-PWA در فاز ۳
  - از همین حالا UI همه فیچرها mobile-first طراحی شوند (که الان هم رعایت می‌شود)

---

### DECISION-033 | Avatar Strategy — Preset Colors (نه File Upload)
- **تاریخ:** ۲۰۲۶-۰۵-۲۹
- **وضعیت:** ✅ تأیید شده
- **زمینه:** پروفایل کاربر نیاز به آواتار داشت. گزینه‌های file upload vs preset بررسی شدند.
- **گزینه‌ها:**
  - الف) file upload: عکس شخصی کاربر — نیاز به storage (S3/local)، resize، CDN
  - ب) preset colors: ۱۲ دایره رنگی از پالت brand — بدون storage، بدون امنیت فایل
- **تصمیم:** ۱۲ preset رنگی از palette brand — ذخیره به عنوان `avatarPreset Int @default(0)` در User
- **دلیل:** MVP نیاز به پیچیدگی storage ندارد. Preset ها کافی و زیبا هستند. Upload در فاز ۲.۵ اضافه می‌شود.
- **پیامدها:**
  - `src/lib/profile/avatarPresets.ts` — تعریف ۱۲ preset
  - `avatarPreset` و `bio` به schema اضافه شدند (migration: `20260529104525_add_profile_fields`)
  - Upload در TASK-PROFILE-FULL (فاز ۲.۵) انجام خواهد شد

### DECISION-034 | Profile Page Architecture — Independent Sections
- **تاریخ:** ۲۰۲۶-۰۵-۲۹
- **وضعیت:** ✅ تأیید شده
- **زمینه:** پروفایل به بخش‌های مستقل (آواتار، اطلاعات، همدم، حساب) نیاز داشت.
- **تصمیم:** هر بخش یک Client Component مستقل با state و API call مخصوص خودش. Server Component صفحه فقط داده اولیه را توزیع می‌کند.
- **دلیل:** هر بخش می‌تواند بدون تأثیر روی بقیه توسعه یا تغییر یابد. بخش‌های آینده (notifications) با اضافه کردن یک component جدید اضافه می‌شوند.
- **پیامدها:**
  - `AvatarSection` — auto-save با کلیک
  - `PersonalInfoSection` — displayName + bio
  - `CompanionSection` — companionName همدم
  - Layout: web-first با grid دو ستونی روی صفحات بزرگ (max-w-5xl)

### DECISION-035 | Chat Companion Name — همدم (نه همدل)
- **تاریخ:** ۲۰۲۶-۰۵-۲۹
- **وضعیت:** ✅ تأیید شده
- **زمینه:** نام پیش‌فرض دستیار از «همدل» به «همدم» تغییر داده شد.
- **تصمیم:** نام پیش‌فرض `companionName` = «همدم» — در API route و ChatWindow hardcode شده
- **دلیل:** انتخاب صاحب پروژه

---

### DECISION-036 | Admin RBAC — Granular Permissions + AdminUser جدا
- **تاریخ:** ۲۰۲۶-۰۵-۲۹
- **وضعیت:** ✅ تأیید شده (صاحب پروژه)
- **زمینه:** DECISION-026 برای پنل ادمین یک RBAC ساده (۳ نقش روی همان `User`، auth مشترک) پیشنهاد داده بود. اما صاحب پروژه مشخص کرد: کاربران زیادی از پنل استفاده می‌کنند (پشتیبان، تولیدکننده محتوا، پاسخ‌دهنده تیکت، …)، نقش‌های آینده اضافه می‌شوند، و کنترل کامل و حرفه‌ای در کلاس جهانی لازم است.
- **گزینه‌ها:**
  - الف) enum ساده روی `User` (DECISION-026 اصلی) — افزودن نقش = migration، بدون granularity
  - ب) نقش ثابت + permission به‌صورت JSON — میانه‌رو
  - ج) **RBAC کامل granular** — جداول `AdminUser` + `AdminRole` + `AdminPermission` + join
- **تصمیم:** گزینه (ج). این بخش از DECISION-026 (RBAC ساده + role روی User + auth مشترک) را **جایگزین (supersede)** می‌کند. باقی DECISION-026 (scope ماژول‌ها، فازبندی، audit log، حریم خصوصی) معتبر می‌ماند.
- **جزئیات:**
  - **هویت ادمین جدا از کاربر نهایی:** جدول `AdminUser` مستقل. کارمندان کاربر اپ نیستند → سطح حمله جدا، نشت داده غیرممکن، login مستقل.
  - **نقش‌های پایه (isSystem=true، غیرقابل حذف):** `owner`، `admin`، `content`، `support`. permissionهای هر نقش قابل ویرایش است؛ نقش جدید بدون migration فقط با داده اضافه می‌شود.
  - **permission به‌صورت کلید گروه‌بندی‌شده:** `users.read`، `users.plan.write`، `ai.manage`، … . کاتالوگ منبع‌حقیقت در `src/lib/admin/permissions.ts`.
  - **auth ادمین:** OTP با همان `SMSAdapter` ولی روی route جدا (`/admin/login`)؛ کوکی session جدا `hamsoo-admin-session` با payload `{ adminId, roleKey }`. permissionها در هر request از DB resolve می‌شوند (همیشه تازه).
  - **اولین OWNER:** با seed idempotent از env `ADMIN_OWNER_PHONE` ساخته می‌شود.
- **بند سازگاری با DECISION-026:** فیلد `role` روی `User` که در ۰۲۶ پیش‌بینی شده بود **اضافه نمی‌شود**؛ به‌جای آن `AdminUser` جدا. `isBanned` روی `User` (برای ban از پنل) طبق ۰۲۶ باقی می‌ماند.
- **پیامدها:**
  - schema: ۵ مدل جدید (`AdminUser`, `AdminRole`, `AdminPermission`, `AdminRolePermission`, `AdminAuditLog`) + `User.isBanned`
  - زیرساخت: `src/lib/admin/` (permissions catalog، session، auth-server guard، audit)
  - سند کامل: `docs/features/admin-panel.md` §۴ و §۵ بازنویسی شد

### DECISION-037 ✅ | AI Config — لایه Override در DB روی منبع فایل/env
- **تاریخ:** ۲۰۲۶-۰۵-۲۹ | **پیاده‌سازی:** ۲۰۲۶-۰۵-۳۰
- **وضعیت:** ✅ پیاده‌سازی شد (TASK-ADMIN-AI)
- **پیاده‌سازی نهایی:**
  - schema: `AiPromptOverride` (نسخه‌دار per roleKey/locale، یکی isActive) + `AiConfig` (کلید-مقدار) — migration `20260530082643_ai_config_override`
  - resolver: `src/lib/ai/config.ts` (`getAiConfig*` با fallback الزامی + cache ۱۰ث؛ هیچ‌گاه throw نمی‌کند) و `src/lib/ai/admin-catalog.ts` (کاتالوگ نقش‌ها/placeholderها/کلیدها + اعتبارسنجی)
  - نقاط override: `prompt-loader` (override فعال → فایل)، `provider-router` (روتینگ، async)، `orchestrator` (مدل + temperature + maxTokens)، `chat route` (نام پیش‌فرض همدم + سقف per-plan + متن welcome)
  - **محافظ ساختاری محقق‌شده:** نبود override → رفتار دقیقاً مثل امروز؛ خطای DB یا override نامعتبر → fallback خودکار به فایل/env. اعتبارسنجی placeholder هنگام ذخیره (placeholder ناشناخته رد می‌شود) تا runtime نشکند.
  - پرامپت نسخه‌دار: هر ذخیره = نسخهٔ جدید، نسخه‌های قبلی می‌مانند، «بازگشت به فایل» همیشه ممکن است.
  - هم‌ترازی: سقف چت per-plan (FREE/PLUS/PRO) اصلاح شد (قبلاً برای همه ۱۰ بود — باگ نسبت به مانیفست/صفحهٔ پلن‌ها).
- **(طراحی اولیه — ⏳ ۲۰۲۶-۰۵-۲۹):**
- **زمینه:** صاحب پروژه خواست هر چیزی که الان در سورس است (مدل‌های AI، system prompt، انتخاب provider) از طریق ادمین پنل قابل مدیریت باشد — بدون دست‌زدن به سورس. این مستقیماً با معماری فایل‌محور §۸ CLAUDE.md و DECISION-029 (`/prompts` فایل‌محور) و env-based بودن مدل‌ها تعارض دارد.
- **گزینه‌ها:**
  - الف) مهاجرت کامل به DB — شکستن کامل معماری فعلی + از دست رفتن fallback امن
  - ب) **لایه override در DB روی منبع فعلی** — فایل/env = پیش‌فرض و fallback؛ DB = override زنده
  - ج) فعلاً فقط سورس — رد درخواست
- **تصمیم:** گزینه (ب).
- **بند سازگاری (الزامی — feedback-manifest-conflict-pattern):**
  - فایل‌های `/prompts/<role>/vN.<locale>.md` و env (`GAPGPT_MODEL`، `AI_PROVIDER_*`) **منبع پیش‌فرض و fallback باقی می‌مانند**. §۸ و DECISION-029 نقض نمی‌شوند — فقط یک لایه override بالای آن‌ها اضافه می‌شود.
  - **محافظ ساختاری:** اگر هیچ override فعالی در DB نباشد، رفتار سیستم **دقیقاً** مثل امروز است (مسیر فایل/env). اگر DB در دسترس نباشد یا override نامعتبر باشد → fallback خودکار به فایل/env. هیچ‌گاه یک override نامعتبر نباید AI را از کار بیندازد.
  - تغییرات از طریق `prompt-loader` و `provider-router` خوانده می‌شوند (نقطه واحد override)، نه پراکنده در کد فیچر.
- **طراحی schema (در این migration نمی‌آید — هنگام ساخت ماژول AI):**
  ```
  AiConfig         { key @unique, value, updatedAt, updatedById }   // "provider.gapgpt.model", "role.weekly-report.activeVersion"
  AiPromptOverride { roleKey, version, locale, content, isActive, updatedAt, @@unique([roleKey,version,locale]) }
  ```
- **پیامدها:** TASK-ADMIN-AI (جدید) در `admin-panel.md`. تا زمان ساخت، رفتار AI بدون تغییر است.

---

### DECISION-038 | Admin Auth — نام کاربری/رمز عبور (نه OTP)
- **تاریخ:** ۲۰۲۶-۰۵-۲۹
- **وضعیت:** ✅ تأیید شده (صاحب پروژه)
- **زمینه:** DECISION-036 ورود ادمین را با OTP (همان SMSAdapter) طراحی کرده بود. صاحب پروژه تصمیم گرفت ورود پنل ادمین **فقط** با نام کاربری و رمز عبور باشد — حرفه‌ای‌تر برای پنل مدیریتی و مستقل از SMS (که هنوز فعال نیست). این بخشِ «Auth ادمین» در DECISION-036 را **جایگزین** می‌کند؛ بقیه ۰۳۶ (RBAC granular، AdminUser جدا، permissionها) معتبر می‌ماند.
- **تصمیم و جزئیات:**
  - **هویت ورود:** `username` (نه phone). فیلد `phone` روی AdminUser اختیاری شد (فقط تماس). route‌های OTP ادمین حذف شدند.
  - **hashing:** scrypt داخلی `node:crypto` (بدون وابستگی بیرونی، salt مجزا). قالب: `"salt:hash"` hex. رمز هرگز plain ذخیره نمی‌شود.
  - **سیاست پیچیدگی:** حداقل ۱۰ کاراکتر + حداقل ۳ از ۴ دسته (بزرگ/کوچک/رقم/نماد). منبع‌حقیقت: `src/lib/admin/password.ts`.
  - **مالک اول:** با seed از env `ADMIN_OWNER_USERNAME`/`ADMIN_OWNER_PASSWORD` (در `.env` که gitignore است). `mustChangePassword=false` (رمز را خودش انتخاب کرده).
  - **سایر ادمین‌ها (آینده — UI مدیریت ادمین‌ها):** owner نام کاربری می‌سازد، سیستم رمز پیچیده auto-generate می‌کند (`generatePassword()`)، `mustChangePassword=true`؛ کاربر در ورود اول مجبور به تعیین رمز جدید است.
  - **اجبار تغییر رمز:** `(panel)/layout` اگر `mustChangePassword` باشد به `/admin/change-password` redirect می‌کند (این صفحه بیرون از گروه panel است → بدون حلقه).
  - **محافظت brute-force:** ۵ تلاش ناموفق → قفل ۱۵ دقیقه‌ای (`failedLoginAttempts`/`lockedUntil` روی AdminUser)؛ قفل در AuditLog ثبت می‌شود.
  - **session:** بدون تغییر — همان کوکی `hamsoo-admin-session` (۱۲ ساعت) که پس از تأیید رمز صادر می‌شود.
- **پیامدها:**
  - schema: `username`/`passwordHash`/`mustChangePassword`/`failedLoginAttempts`/`lockedUntil` + `phone` optional (migration `20260529190507_admin_username_password`)
  - فایل جدید `src/lib/admin/password.ts`؛ route‌های `/api/admin/auth/{login,change-password,logout}`
  - صفحات `/admin/login` (username/password) و `/admin/change-password`

---

### DECISION-039 ✅ | AI — مدل سرویس‌محور با Bind بخش‌ها (جایگزین تک-Provider per-region)
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۵-۳۰
- **وضعیت:** ✅ پیاده‌سازی شد — migration `20260530132345_add_ai_services`
- **زمینه:** DECISION-028/037 فرض می‌کرد هر منطقه (IR/INTL) فقط **یک** Provider دارد (`routing.IR`/`routing.INTL` یک نام provider را برمی‌گرداند و همهٔ نقش‌ها مجبور به استفاده از همان بودند). صاحب پروژه خواست بتواند برای هر منطقه **چند سرویس** بسازد (متنی + تصویری، حتی از چند provider) و **هر بخش سیستم را به سرویس دلخواه Bind کند**. این مدل تک-Provider را منسوخ می‌کند.
- **تصمیم (سه سؤال ویژوال از مالک — همه طبق پیشنهاد):**
  1. **ذخیره‌سازی:** جدول `AiService` (نه JSON در config) — اصولی، مقیاس‌پذیر، قابل ممیزی. مالک مجوز مهاجرت داد.
  2. **تصویر:** فقط زیرساخت آماده شد (kind=`image` در داده‌مدل و UI قابل‌ساخت است) اما **اجرای** تولید تصویر هنوز پیاده نشده — `getAIAdapterForService` برای kind=image گارد می‌دهد (هیچ نقش تصویری فعلاً وجود ندارد).
  3. **دسترسی:** مدیریت سرویس‌ها با `ai.manage`؛ مشاهده/ویرایش **کلید API فقط Owner** (`isOwner` بر اساس key نقش، نه permission).
- **معماری نهایی:**
  - **داده‌مدل:** `AiService { label, region(IR|INTL), kind(text|image), providerType(openai-compatible|mock), baseURL?, apiKey?, model, isActive, isDefault, sortOrder, note }`. حداکثر یک سرویس `isDefault` per (region, kind).
  - **اتصال (Bind):** کلید config `bind.<roleKey>.<region>` = `AiService.id`. نبود اتصال → سرویس پیش‌فرض همان (region, kind).
  - **resolution (`src/lib/ai/services.ts`):** `resolveServiceForRole(role, region, kind)` → اتصال صریح → پیش‌فرض منطقه/نوع → null. منطقه از country IP: `IR` برای ایران، در غیر این صورت `INTL` (ناشناخته هم INTL). cache ۱۰ث + fallback؛ هرگز throw نمی‌کند.
  - **router/orchestrator:** `provider-router` حالا سرویس را resolve و آداپتر را با `getAIAdapterForService` می‌سازد؛ مدل از `service.model` می‌آید. **محافظ ساختاری:** سرویس نبود/کلید خالی/خطا → fallback به `mock`. پارامترهای نقش (temperature/maxTokens) مستقل از سرویس از config می‌آیند (DECISION-037 معتبر).
  - **prompt/role مستقل از مدل:** پرامپت‌ها فقط Role/Prompt را تعیین می‌کنند (DECISION-029/037)؛ مدل را Bind سرویس تعیین می‌کند.
- **بند سازگاری:**
  - بخش UI «روتینگ Provider (بر اساس کشور)» و کلیدهای `routing.*`/`provider.*.model|baseURL|apiKey` **حذف شدند** (به‌جایشان `AiService` + `bind.*`). صاحب پروژه صراحتاً گفت بخش روتینگ دیگر لازم نیست.
  - **حفظ رفتار:** seed idempotent دو سرویس پیش‌فرض متنی از env می‌سازد (IR=`AI_PROVIDER_IRAN`, INTL=`AI_PROVIDER_INTL`) تا رفتار فعلی routing عیناً منتقل شود. env (`GAPGPT_*`/`AI_PROVIDER_*`) همچنان مبنای seed اولیه است.
  - **امنیت کلید (تغییر نسبت به DECISION-037):** قبلاً کلید هرگز به UI برنمی‌گشت. حالا طبق خواست مالک: فقط Owner از مسیر `POST /api/admin/ai/services/[id]/key` مقدار خام را می‌بیند (UI: ماسک bullet + نمایش با نگه‌داشتن دکمه). سایر ادمین‌ها فقط وضعیت تنظیم‌شده/نشده. کلید جدید فقط جایگزین می‌شود؛ خالی = بدون تغییر. هر reveal در AuditLog ثبت می‌شود.
- **هم‌ترازی ادمین↔پروژه (پَریتی):** باگ رفع شد — `ChatWindow` فقط یک‌بار داده می‌گرفت؛ حالا در **هر باز شدن** متن خوش‌آمد و سقف پیام را از سرور تازه می‌کند تا تغییر پنل بلافاصله دیده شود.
- **پیامدها:**
  - schema: مدل `AiService` + بازنویسی کامنت `AiConfig`
  - lib: `src/lib/ai/services.ts` (جدید)، بازنویسی `provider-router.ts`، `getAIAdapterForService` در `adapters/index.ts`، `serviceKind` در `AIRoleMeta`، `isOwner` در `auth-server.ts`
  - API: `/api/admin/ai/services` (GET/POST)، `/services/[id]` (PATCH/DELETE)، `/services/[id]/key` (POST، Owner)، `/bindings` (POST). پاک‌سازی `/config` از کلیدهای provider/routing.
  - UI: `AiServicesManager` + `AiBindingsForm` (جدید)؛ `AiSettingsForm` و `/admin/ai/page` بازنویسی (حذف routing/providers)
  - seed: دو سرویس پیش‌فرض از env

---

### DECISION-040 ✅ | مدیریت پلن‌ها — قیمت/امکانات/کد تخفیف کاملاً پویا
- **تاریخ:** ۲۰۲۶-۰۵-۳۰ | **وضعیت:** ✅ پیاده‌سازی شد — migration `20260530144654_add_plans`
- **پیاده‌سازی نهایی:**
  - schema: `Plan` + `PlanFeatureValue` + `PlanBullet` + `DiscountCode`
  - کاتالوگ امکانات `src/lib/plans/features.ts` (chat.dailyLimit=quota، weekly.reflection=boolean، support.ticketing/social.network=comingSoon) + `PLAN_DEFAULTS` (پلاس از مالک: ۶۹٬۰۰۰/۶۰۰٬۰۰۰)
  - resolver `src/lib/plans/access.ts` (`planAllows`/`planQuota`، cache ۱۰ث + fallback به کاتالوگ، `invalidatePlanCache`)
  - **فاز B parity:** chat route سقف را از `planQuota("chat.dailyLimit")` و weekly route تأمل را از `planAllows("weekly.reflection")` می‌خواند؛ کلید `chat.limit.*` و کارت سقف چت از بخش AI حذف شد
  - API: `/api/admin/plans/[key]` (PATCH: فیلد+ماتریس+bullet)، `/discounts` (CRUD)، عمومی `/api/plans/validate-discount`
  - UI پنل: `/admin/plans` + `PlansManager` + `DiscountManager`؛ nav «پلن‌ها» فعال شد
  - UI عمومی: `/plans` بازسازی پویا + `PlansPricing` (سوییچ ماهانه/سالانه + «معادل ماهانه» + کد تخفیف)
  - seed idempotent ۳ پلن + ماتریس ۴ امکان
  - `tsc` ✅ + `next build` ✅
- **(طراحی اولیه — ⏳):**
- **زمینه:** صاحب پروژه خواست همهٔ امکانات هر پلن، قیمت‌ها و کد تخفیف **کاملاً پویا از پنل** مدیریت شوند — هیچ هاردکدی. درگاه پرداخت هنوز نیست (ارتقای پلن دستی می‌ماند). صفحهٔ مقایسهٔ `/plans` باید از همین داده‌ها ساخته شود.
- **تصمیم‌ها (پاسخ ویژوال مالک — همه طبق پیشنهاد):**
  1. **مجموعهٔ پلن‌ها ثابت (FREE/PLUS/PRO)، محتوا پویا:** کلیدهای پلن ثابت می‌مانند (User.plan و گیت‌ها به آن‌ها وصل‌اند)؛ نام/توضیح/قیمت/امکانات/ترتیب پویا.
  2. **منبع حقیقت واحد:** همهٔ امکانات و محدودیت‌های پلن در «مدیریت پلن‌ها» متمرکز. سقف چت (`chat.limit.*` از DECISION-037) و گیت تب «تأمل» (Plus/Pro) از بخش AI/کد به این سیستم منتقل می‌شوند.
  3. **کد تخفیف:** مدیریت کامل در پنل (درصدی/مبلغی، سقف استفاده، انقضا، پلن‌ها/دوره‌های مشمول) + اعتبارسنجی و نمایش قیمت با تخفیف در `/plans`. هستهٔ «مصرف کد» آماده می‌ماند تا با درگاه پرداخت وصل شود (الان خرید واقعی نیست).
- **معماری پیشنهادی (جزئیات هنگام پیاده‌سازی نهایی می‌شوند — feedback-feature-questions-timing):**
  - **کاتالوگ امکانات در کد** (`src/lib/plans/features.ts`، مثل کاتالوگ permissions): هر امکان یک `key` + نوع (`boolean` روشن/خاموش یا `quota` عددی مثل سقف چت) + گروه + برچسب. هر امکان enforceable کد enforce خودش را دارد.
  - **DB (نیازمند migration):** `Plan { key(unique), label, description, order, monthlyPrice, annualPrice, currency="IRT", highlight?, isActive }` + ماتریس `PlanFeatureValue { planKey, featureKey, enabled?, value? }` + `PlanBullet { planKey, text, order }` (bullet متنی آزاد برای موارد «به‌زودی») + `DiscountCode { code(unique), kind(percent|fixed), value, plans[], cycles[], maxUses, usedCount, startsAt?, expiresAt?, isActive, note }`.
  - **enforcement تک‌نقطه:** `planAllows(plan, featureKey)` / `planQuota(plan, featureKey)` با cache+fallback (مثل ai/config) — جایگزین چک‌های پراکنده. سقف چت و گیت تأمل از این می‌خوانند.
  - **قیمت:** ماهانه + سالانهٔ یکجا؛ UI «معادل ماهانه» (annual/12) را نشان می‌دهد. واحد تومان.
  - **`/plans` بازسازی پویا:** جدول مقایسه از Plan+features+bullets، سوییچ ماهانه/سالانه، فیلد کد تخفیف (اعتبارسنجی سروری → نمایش قیمت با تخفیف)، دکمهٔ خرید در حالت «به‌زودی» (بدون درگاه).
  - **پنل `/admin/plans`:** ویرایش قیمت/برچسب/توضیح/ترتیب/highlight هر پلن، ماتریس روشن/خاموش امکانات + مقدار quotaها، مدیریت bulletها، مدیریت کدهای تخفیف. enforce: `plans.read`/`plans.write`.
- **هم‌ترازی ادمین↔پروژه:** هر امکان/محدودیت تعریف‌شده در پنل باید در اپ enforce شود (نه فقط نمایش). تغییر دستی پلن کاربر (که ساخته‌ایم) → امکانات همان پلن فعال.
- **بند سازگاری:** `chat.limit.*` (DECISION-037) به feature پلن (`quota`) منتقل می‌شود؛ کلید قدیمی منسوخ. صفحهٔ `/plans` فعلی (hardcode) با نسخهٔ پویا جایگزین می‌شود. سه پلن FREE/PLUS/PRO مطابق §۷ CLAUDE.md حفظ می‌شوند.
- **پیامدها:** TASK-ADMIN-PLANS (شکست‌خورده در TASKS.md). نیازمند migration (تأیید مالک هنگام شروع).

---

### DECISION-041 ✅ | مالک یکتا و غیرقابل‌انتساب + پروفایل شخصی ادمین
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۵-۳۰ | **وضعیت:** ✅ پیاده‌سازی شد — migration `20260530205213_admin_avatar`
- **زمینه:** دو خواست مالک، مکمل DECISION-036/038.
- **بخش ۱ — نقش «مالک سایت» یکتا و تغییرناپذیر:**
  - فقط حساب seedشده نقش `owner` را دارد؛ **هیچ‌کس دیگر** نباید owner شود.
  - گاردها: `POST /api/admin/admins` (ساخت) و `/admins/[id]/role` (تغییر نقش) → اگر `roleKey === "owner"` رد می‌شود؛ و حساب owner موجود را نمی‌توان از owner خارج کرد.
  - UI: نقش `owner` از فهرست نقش‌های قابل‌انتساب (`/admin/admins`) حذف شد؛ ردیف مالک به‌جای select/toggle، برچسب ثابت «مالک سایت — قفل» نشان می‌دهد. (گارد قبلیِ «آخرین owner فعال» معتبر می‌ماند.)
- **بخش ۲ — پروفایل شخصی هر ادمین (هر نقشی):**
  - فیلد `avatarPreset Int @default(0)` به `AdminUser` افزوده شد (۱۲ preset مشترک با کاربر — `lib/profile/avatarPresets`).
  - صفحهٔ `/admin/profile` (بدون نیاز به permission خاص؛ فقط ادمینِ لاگین‌شده): ویرایش نام نمایشی، **نام کاربری** (با چک یکتایی)، تلفن، آواتار + بخش تغییر رمز (همان endpoint `change-password`).
  - API: `PATCH /api/admin/profile` (به‌روزرسانی خودِ ادمین، audit `admin.profile.update`).
  - دسترسی: کارت کاربر در sidebar (`AdminShell`) حالا آواتار را نشان می‌دهد و لینک به `/admin/profile` است.
- **پیامدها:** `AdminContext.admin.avatarPreset` اضافه شد؛ layout پنل آن را پاس می‌دهد. هیچ تغییری در منطق session/permission.

---

### DECISION-042 ✅ | ارقام فارسی سراسری + نمایش امکانات پلن (فلگ‌محور)
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۵-۳۱ | **وضعیت:** ✅ پیاده‌سازی شد — migration `20260531050400_plan_feature_flags`
- **بخش ۱ — قانون قطعی ارقام فارسی:**
  - همهٔ اعداد در کل سیستم (پنل ادمین + سایت) باید با ارقام فارسی نمایش داده شوند.
  - **پیاده‌سازی سراسری و کم‌ریسک:** فیچر فونت `font-feature-settings: "ss01"` روی `body` فعال شد (همان مکانیزم کلاس `fa-num`؛ فونت PelakFA). ارقام لاتین خودکار فارسی رندر می‌شوند بدون تغییر مقدار واقعی (مهم برای `<input>`).
  - **استثنا:** کلاس `.num-latin` برای شناسه‌های فنی LTR که باید لاتین بمانند: نام مدل، baseURL، کلید API، نام کاربری، کد تخفیف. (تلفن طبق قرارداد قبلی فارسی می‌ماند.)
- **بخش ۲ — مدل فلگ‌محور امکانات پلن (جایگزین boolean ساده):**
  - هر امکانِ هر پلن سه وضعیت مستقل دارد: `visible` (نمایش/عدم‌نمایش — Radio)، `comingSoon` (خاکستری «به‌زودی»)، `disabled` (خط روی متن). به‌علاوه `value` (برای quota) و `label` (override متن امکان).
  - schema: ستون‌های `visible`/`comingSoon`/`disabled`/`label` به `PlanFeatureValue` اضافه شد؛ `enabled` به‌عنوان legacy باقی ماند. **normalization** در همان migration: `enabled=0` (boolean) → `disabled=1`؛ امکانات کاتالوگیِ comingSoon → `comingSoon=1`.
  - رندر عمومی (`/plans`): مخفی → حذف؛ `disabled` → خط‌خورده؛ `comingSoon` → خاکستری + نشان؛ وگرنه عادی (check). متن از `label` (در نبودش از کاتالوگ).
  - پنل (`PlansManager`): هر امکان → input متن (override) + (quota) عدد + سه کنترل نمایش/بزودی/غیرفعال؛ همه قابل ویرایش. API `PATCH /api/admin/plans/[key]` و seed به مدل جدید به‌روز شدند.
- **بند سازگاری:** کاتالوگ امکانات در کد (`features.ts`) و enforcement (`planAllows`/`planQuota`) دست‌نخورده‌اند — این تغییر فقط لایهٔ **نمایش/متادیتای** هر امکان per پلن است. `chat.dailyLimit` (quota) و enforcementش بدون تغییر.

#### تکمیل ۲۰۲۶-۰۵-۳۱ (بازخورد مالک) — دو اصلاح
- **اصلاح ۱ — ارقام فارسی در فرم‌کنترل‌ها:** کشف شد که `font-feature-settings` از `body` به `input/textarea/select` ارث نمی‌رسد (UA stylesheet ریست می‌کند) → ارقام داخل فیلدهای ورودی (تلفن، قیمت) لاتین می‌ماندند. **رفع:** قانون صریح `input, textarea, select { font-feature-settings: "ss01" on }` در globals.css. ضمناً `type="number"` حتی با ss01 هم فارسی نمی‌شود؛ این فیلدها (قیمت ماهانه/سالانه، quota، مقدار/سقف کد تخفیف، اعداد AI) به `inputMode="numeric|decimal"` روی input متنی تبدیل شدند و ورودی با `onlyDigits`/`toEnDigits` (helper جدید `src/lib/utils/digits.ts`) نرمال می‌شود. جهت همیشه LTR (رقم ربطی به زبان ندارد).
- **اصلاح ۲ — «افزودن قابلیت» با فلگ:** بخش «خط‌های متنی» به **«قابلیت‌های سفارشی»** ارتقا یافت؛ هر قابلیتِ افزوده‌شده دقیقاً مثل کاتالوگ سه کنترل دارد: نمایش (Radio)، به‌زودی، غیرفعال. **migration افزایشی `20260531082457_plan_bullet_flags`** سه ستون بولی `visible`/`comingSoon`/`disabled` را به `PlanBullet` افزود (افزایشی، بدون حذف داده — تأیید صریح مالک گرفته شد). رندر عمومی این قابلیت‌ها از همان مسیر `FeatureRow` می‌گذرد (مخفی → حذف، غیرفعال → خط‌خورده، به‌زودی → خاکستری). API `PATCH /api/admin/plans/[key]` فلگ‌های هر قابلیت را ذخیره می‌کند.

---

### DECISION-043 ✅ | لاگ ممیزی — لایهٔ خوانش (Audit Log Viewer)
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۵-۳۱ | **وضعیت:** ✅ پیاده‌سازی شد — بدون migration (مدل و نوشتن از قبل بودند)
- **زمینه:** لایهٔ **نوشتن** ممیزی از قبل کامل بود (`AdminAuditLog` + `logAdminAction`، ۲۷ کنش در ۲۳ route)، و permission `audit.read` و آیتم nav هم تعریف شده بودند (`ready:false`). تنها چیز غایب، **viewer** بود. این تصمیم فقط لایهٔ خوانش/نمایش را اضافه می‌کند — هیچ تغییری در schema یا منطق نوشتن نیست.
- **کاتالوگ کنش‌ها (`src/lib/admin/audit-actions.ts`):** منبع‌حقیقتِ کد-محور (هم‌الگوی `permissions.ts`/`features.ts`). هر کلید کنش → `{ label فارسی، category، tone }`. شش دسته: auth/admins/roles/users/plans/ai. پنج تون رنگی: create(سبز)/update(آبی)/security(طلایی)/danger(قرمز)/auth(خنثی). `describeAction()` برای کنش ناشناخته به‌صورت امن fallback می‌کند (خود کلید را نشان می‌دهد، crash نمی‌کند) — مقاوم در برابر کنش‌های آینده/قدیمی.
- **صفحهٔ `/admin/audit`** (Server Component، `force-dynamic`، enforce `audit.read`):
  - فیلترها (GET، بدون JS کلاینت): کنشگر (dropdown ادمین‌ها)، کنش (`<optgroup>` به‌تفکیک دسته)، بازهٔ تاریخ از/تا (مرز بازه به وقت تهران +۰۳:۳۰)، جستجوی شناسهٔ هدف. اعتبارسنجی سرور: کنش/کنشگر نامعتبر نادیده گرفته می‌شود.
  - جدول: زمان (fa-IR/Asia/Tehran)، کنشگر (نام + `@username` لاتین)، نشانِ تون‌دار کنش + کلید خام، هدف (کاربر → لینک به جزئیات؛ بقیه متن فنی)، متادیتای JSON در `<details>` بومی (بدون کامپوننت کلاینت).
  - صفحه‌بندی ۳۰‌تایی هم‌الگوی صفحهٔ کاربران.
- **اصول رعایت‌شده:** فقط-خواندنی (هیچ مسیر ویرایش/حذف)، تأکید بصری بر append-only بودن، ارقام فارسی (DECISION-042) + شناسه‌های فنی `num-latin`، RBAC از طریق `requirePermission`.
- **بند سازگاری/توسعه:** نوشتن لاگ دست‌نخورده ماند. کنش/هدف جدید فقط با افزودن یک ردیف به `AUDIT_ACTIONS` خوانا می‌شود. **پیشنهاد آینده (نیازمند migration + تأیید مالک):** افزودن `ip`/`userAgent` به `AdminAuditLog` و ثبتشان در همهٔ نقاط نوشتن، و خروجی CSV/JSON با فیلتر فعلی.

---

### DECISION-044 ✅ | دو قانون سراسری (بدون autofill + تاریخ جلالی) + سیستم تیکتینگ
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۵-۳۱ | **وضعیت:** ✅ — migration افزایشی `support_tickets` (تأیید مالک)

**۱) قانون سراسری بدون Autofill/Suggestion:**
- هیچ حبابِ پیشنهاد/autofill مرورگر در هیچ input/textarea (سایت + پنل) نباید ظاهر شود.
- مکانیزم واحد: کامپوننت `<DisableAutofill>` در `layout.tsx` ریشه — روی همهٔ فیلدها `autocomplete` را خنثی می‌کند (رمز→`new-password`، بقیه→`off`) + `MutationObserver` برای فیلدهای پویا (مودال‌ها). یک نقطه، پوششِ خودکارِ آینده. مدیر رمزِ افزونه‌ای مستقل از این کار می‌کند.

**۲) قانون سراسری تاریخ/زمان جلالی:**
- نمایش تاریخ‌ها از قبل جلالی بود (`fa-IR` خودش تقویم Persian می‌دهد + `formatJalali`). شکافِ باقی‌مانده، **تاریخ‌گزین‌های ورودی** (`type="date"` بومی، میلادی mm/dd/yyyy) بود.
- ساخته شد: `<JalaliDatePicker>` (در `@/components/ui`) با `jalaali-js` (بدون کتابخانهٔ جدید) — تقویم شمسی نشان می‌دهد ولی مقدار را «yyyy-mm-dd میلادی» نگه می‌دارد (سازگار با همهٔ downstreamها). دو حالت: فرم سروری (`name` + input مخفی) و کنترل‌شده (`value`/`onChange`). جایگزین در فیلتر لاگ ممیزی و انقضای کد تخفیف. helperهای تبدیل در `@/lib/utils/date`.

**۳) اصلاح زیرساختی — پیوند enforcement با پنل (مهم):**
- باگ نهفته از DECISION-042: `planAllows` هنوز ستون **لگاسی `enabled`** را می‌خواند، در حالی که پنل فلگ‌های `disabled`/`comingSoon` را ویرایش می‌کند → تغییر پنل روی دسترسی اثر نداشت.
- رفع: `loadPlanFeatures` اکنون `allowed = !disabled && !comingSoon` را از فلگ‌های زنده می‌سازد؛ fallback کاتالوگ هم `defaultBool && !defaultComingSoon`. **حالا روشن‌کردن هر امکان در پنل، بلافاصله دسترسی همهٔ کاربرانِ آن پلن را فعال می‌کند** (قاعدهٔ کلی مالک برای همهٔ امکانات پلن).

**۴) سیستم پشتیبانی و تیکتینگ:**
- **گیت دسترسی** کاملاً از امکانِ پلن `support.ticketing` می‌آید (هم‌ترازی پنل↔پروژه): الان فقط پرو، اما روشن‌کردنش برای هر پلن از پنل → دسترسی فوری همان پلن. `comingSoon` این امکان در migration خاموش شد (ساخته شده).
- **مدل داده:** `SupportTicket` (subject/category/priority/status/**channel**/lastMessageAt/closedAt) + `TicketMessage` (authorType user|admin + authorUserId/authorAdminId). فیلد `channel` (پیش‌فرض `ticket`) برای **توسعهٔ آیندهٔ چت آنلاین** روی همین مدل آماده است.
- **کاتالوگ کد-محور** `src/lib/support/tickets.ts`: دسته/اولویت/وضعیت/کانال + محدودیت‌ها + helperها (الگوی permissions/features). افزودن دسته/کانال = یک ردیف.
- **سمت کاربر:** `/support` (لیست + فرم تیکت جدید؛ پلن بدون دسترسی → CTA ارتقا) و `/support/[id]` (گفتگو + پاسخ). API: `POST /api/support/tickets`، `POST /api/support/tickets/[id]/messages` — همه گیت‌شده با `planAllows` + مالکیت. پاسخ کاربر → وضعیت «باز» (بازگشایی اگر بسته).
- **سمت ادمین:** `/admin/support` (فیلتر وضعیت/اولویت/دسته + جستجو + صفحه‌بندی) و `/admin/support/[id]` (گفتگو + پاسخ + کنترل وضعیت/اولویت + اطلاعات کاربر). API enforce `support.read`/`support.respond`. پاسخ پشتیبان → وضعیت «پاسخ داده شد». همهٔ اقدامات ادمین در **لاگ ممیزی** ثبت می‌شوند (`support.reply`/`support.status.change`/`support.priority.change` به کاتالوگ audit + دستهٔ «پشتیبانی» اضافه شد). nav «تیکت‌ها» فعال شد.
- **توسعه‌پذیری (خواست صریح مالک):** افزودن فیلد/دسته/کانال جدید بدون بازنویسی؛ چت آنلاینِ آینده روی همین مدل (channel="chat") و همین گیت پلن سوار می‌شود.

---

### DECISION-045 ✅ | جمع‌وجورسازی پروفایل + ورودی پشتیبانی + ارقام فارسیِ قابل‌اتکا
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۵-۳۱ | **وضعیت:** ✅ — بدون migration (UI + helper)
- **۱) ادغام «تنظیمات همدم» در «اطلاعات شخصی»:** بخش جداگانهٔ همدم حذف شد؛ فیلد «نام همدم» زیر بیوگرافی در `PersonalInfoSection` آمد و **یک دکمهٔ ذخیرهٔ واحد** هر سه (نام نمایشی + بیو + نام همدم) را با یک PATCH `/api/profile` ذخیره می‌کند (API از قبل هر سه را می‌پذیرفت). کامپوننت یتیم `CompanionSection` حذف شد.
- **۲) ورودی پشتیبانی از navbar به پروفایل (UX):** آیتم «پشتیبانی» از `AppNav` حذف و به‌جای بخش همدمِ قبلی، کارت «پشتیبانی» (لینک به `/support`) در صفحهٔ پروفایل نشست. صفحات/گیتینگ تیکتینگ بدون تغییر.
- **۳) ارقام فارسیِ قابل‌اتکا (تصحیح DECISION-042):** مشخص شد فیچر فونت `ss01` در PelakFA ارقامِ رشته‌های خام (مثل شماره موبایل) را جایگزین **نمی‌کند**؛ اعدادی که فارسی دیده می‌شدند همه از `toLocaleString("fa-IR")`/`formatJalali` (Unicode واقعی) بودند. رفع قطعی: رشته‌های خامِ شامل رقم با `toFaDigits()` (از `@/lib/utils/digits`) تبدیل می‌شوند. اعمال‌شده روی **همهٔ نمایش‌های شماره موبایل** (پروفایل، حساب/حذف حساب، ورود، کاربران ادمین، تیکت‌های ادمین). قاعدهٔ دائمی در CLAUDE.md §۵ اصلاح شد: مکانیزم قابل‌اتکا = تبدیل JS، نه صرفاً ss01.

---

### DECISION-046 ✅ | سیستم نوتیفیکیشن — دو لایه (toast گذرا + اعلان ماندگار)
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۶-۰۱ | **وضعیت:** ✅ — migration افزایشی `notifications` (تأیید مالک) | موج ۱ نقشهٔ راه
- **دامنه (تصمیم مالک):** فقط **زیرساخت + اعلان‌های رویدادی**. یادآوری‌های زمان‌محور («امروز تعهدت را ثبت نکردی») حساس به مانیفست («بدون فشار») و نیازمند تنظیمات کاربر + ارسال بیرونی‌اند → **موج ۲** (بعد از سرور). placeholder تنظیماتش در پروفایل به‌صراحت «به‌زودی».
- **State (تصمیم مالک):** `zustand` انتخاب شد (CLAUDE.md §۳ آن را به‌عنوان گزینه فهرست کرده بود) — اولین وابستگی state؛ برای state کلاینتیِ آینده هم می‌ماند.

**لایه ۱ — Toast (گذرا، client):**
- store: `src/lib/notifications/toast.ts` (Zustand) + API راحت `toast.success/error/info/neutral(...)` — از هر client component بدون hook قابل صدا زدن.
- رندر: `<ToastHost>` در `layout.tsx` ریشه → روی **سایت و پنل ادمین** کار می‌کند. حداکثر ۴ هم‌زمان (سکوت بصری)، حذف خودکار، تنِ مانیفستی (کارتِ آرام، بدون ایموجی/جشن).
- سیم‌کشی شد: ذخیرهٔ پروفایل، پاسخ تیکت کاربر، پاسخ پشتیبان (الگوی «یک اتفاق افتاد» با فلگ).

**لایه ۲ — Notification (ماندگار، DB):**
- **مدل:** `Notification` (userId/**type**/data JSON/linkUrl/**channel**/readAt/createdAt). `type` کلید کاتالوگ است → افزودن نوع جدید **بدون migration**. `channel` (پیش‌فرض `inapp`) برای ارسال بیرونیِ آینده (push/sms) بدون بازنویسی — همان الگوی channelِ تیکت. اعلان‌ها هرگز حذف نمی‌شوند (data-philosophy).
- **کاتالوگ کد-محور** `src/lib/notifications/catalog.ts`: هر `type` → `{tone, icon, describe(data)→{title,body,link}}`. ردیف ناشناخته → fallback امن (هرگز crash، مثل `describeAction`).
- **server helper** `src/lib/notifications/server.ts`: تنها درگاهِ ساخت `createNotification(...)` (قاعدهٔ طلایی مثل invokeAI) + list/unread/markRead/markAllRead. زمان از `getNow()` (§۱۳). خطای ساخت، جریان اصلی را نمی‌شکند.
- **API:** `GET /api/notifications` (لیست + unread)، `PATCH /api/notifications/[id]/read`، `POST /api/notifications/read-all` — همه با مالکیتِ userId.
- **UI:** `<NotificationBell>` در `AppNav` (badge خوانده‌نشده + dropdown + polling ۶۰ث) + صفحهٔ `/notifications` (لیست کامل) + کارت «یادآوری‌ها» در پروفایل. ردیف مشترک `<NotificationItem>` (کاتالوگ‌محور).

**producerهای موج ۱ (parity ادمین↔پروژه):**
- `support.replied` — پاسخ پشتیبان به تیکت → اعلان به صاحب تیکت.
- `plan.changed` — تغییر پلن کاربر توسط ادمین → اعلان به کاربر (نمونهٔ روشن parity: اقدام ادمین، بازتاب سمت کاربر).
- `report.ready` — در کاتالوگ تعریف شده اما producerش به موج بعد (نیازمند زمان‌بندی) موکول است.

- **توسعه‌پذیری (خواست صریح مالک):** افزودن نوع جدید = یک ردیف کاتالوگ. چت آنلاین/ارسال بیرونی روی همین مدل و همین درگاه سوار می‌شوند. ربط: [[project-data-philosophy]]، [[feedback-admin-project-parity]].

---

### DECISION-047 ✅ | بازطراحی گزارش هفتگی — تحلیلگر رفتار + متریک قطعی + هیستوگرام پویا
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۶-۰۱ | **وضعیت:** ✅ — **بدون migration** (خروجی JSON در `aiContent`؛ سازگاری عقب با v1/v2)
- **مسئله (سه ریشه در کد):**
  1. باگ «۱۰۰٪»: فرمول `completionRate = done/(done+notDone)` در **خودِ پرامپت** بود → روزهای خالی/گپ نادیده؛ کاربرِ ۲از۷ روز با ۲ DONE «۱۰۰٪» می‌گرفت.
  2. ورودی AI فقیر: مدل فقط روزهای تعهد را می‌دید — نه اسکلت ۷ روز، نه GapRecordها، نه تاریخچه → تحلیلِ «کل هفته» و استنتاج رفتاری ناممکن بود.
  3. mock خروجی v1 و همان باگ را تولید می‌کرد.
- **تصمیم‌های مالک (option-driven):** متریکِ سرآیند = **تصویر چندبعدی صادقانه** (روزهای فعال از ۷ · انجام از ثبت · گپ + نوار ۷‌خانه) · عمق تحلیل = **سیگنال ۴ هفتهٔ اخیر** · نمودار = **SVG/CSS دست‌ساز** (بومی دیزاین‌سیستم).
- **اصل معماری کلیدی:** **اعداد در کد محاسبه می‌شوند، نه AI.** AI فقط بخش کیفی (روایت + خوشه‌بندی + بینش) را می‌دهد → کلِ کلاسِ باگِ عددی حذف شد.
- **ورودی غنی (`build-input.ts`، مشترک گزارش/تأمل):** `days` (اسکلت کامل ۷ روز با state: done/not_done/pending/gap/empty) + `gaps` (GapRecordهای صریح با توضیح) + `history` (میانگین روزهای فعال/نرخ انجام/بسامد گپ/روند ۴ هفته) + `entries` شماره‌دار (ref).
- **پرامپت‌ها:** `weekly-report/v3.fa.md` نقش **«تحلیلگر رفتار»** — کلِ هفته را می‌خواند، گپ‌ها را بدون قضاوت تحلیل می‌کند (توضیح‌دار → بر مبنای توضیح؛ بی‌توضیح → استنتاج کم‌انرژی/پرمشغله/کم‌تعهد از history)، هفتهٔ کم‌تعامل را جشن نمی‌گیرد، categories را با `entryRefs` برمی‌گرداند. `weekly-reflection/v2.fa.md` عمیق‌تر + گره به روند تاریخی (تب پولی — Critical).
- **محاسبهٔ قطعی (`lib/reports/weekly-analysis.ts`):** `buildWeekSkeleton` (نوار ۷روز)، `computeMetrics`، `buildGapInputs`، `computeHistory` (گروه‌بندی ۴ هفته)، `expandCategories` (entryRefs → شمارش done/notDone قطعی از feedback واقعی).
- **UI (`WeeklyReportCard` v3):** تب خلاصه = سرآیند صادقانه + **نوار ۷روزِ** انیمیشنی (با راهنما) + **هیستوگرام دستهٔ پویا** (میله‌های SVG/CSS با سهم نسبی + بخش «انجام شد») + روایت. تب نکات و تب تأمل premium. گلس + `animate-fade-up` + `--ease-expo`. `normalize()` گزارش‌های قدیمی را بدون crash رندر می‌کند.
- **mock بازنویسی شد:** خروجی v3 (summary/categories-refs/insights)، کلِ‌هفته‌آگاه، گپ‌آگاه، تاریخ‌آگاه، بدون باگ ۱۰۰٪ + شاخهٔ `weekly-reflection`.
- **تأیید:** `tsc --noEmit` ✅ · `next build` ✅. ربط: [[project-ai-as-heart]]، [[project-data-philosophy]].

---

### DECISION-048 ✅ | حذف کامل Mock از لایهٔ AI + رفع باگ روتینگ سرویس
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۶-۰۱ | **وضعیت:** ✅ — بدون migration (حذف داده + کد)
- **باگ (ریشه):** در dev/هر request بدونِ header کشور، `getCountryFromHeaders=null` → `regionFromCountry(null)=INTL` → سرویس پیش‌فرضِ INTL = **Mock** → همهٔ سرویس‌ها (همدم، گزارش، تأمل) به Mock می‌رفتند، صرف‌نظر از اینکه پیش‌فرضِ IR را GapGPT کرده بودیم. چت همدم در Mock نقشی نداشت → JSON خامِ `{"ok":true,"mock":true,...}` به‌عنوان پاسخ نشت کرد. در prod هم کاربر غیرایرانی همین‌طور می‌شکست.
- **تصمیم مالک:** Mock کاملاً حذف شود (چون API واقعی خریداری شده و قابل‌استفاده است) + رفع کامل باگ، بدون side-effect.
- **راهبرد منطقه (تصمیم مالک — گزینهٔ پیشنهادی):** **Fallback سراسری** — یک سرویس GapGPT کافی است؛ اگر منطقه‌ای سرویس مخصوص نداشت، به پیش‌فرضِ سراسریِ همان نوع (تنها سرویس فعال) می‌افتد. معماری IR/INTL حفظ شد.
- **حذف Mock (۷ نقطه + DB):**
  - `lib/adapters/mock-ai.adapter.ts` حذف شد.
  - `adapters/index.ts`: case `mock` در `buildAdapter`، شاخهٔ mock در `getAIAdapterForService`، `mock` از `AIProviderName`، و `getAIAdapter()` لگاسی (env `AI_PROVIDER`) حذف شدند.
  - `provider-router.ts`: هر دو `fallback به mock` حذف؛ نبودِ سرویس یا نقص کلید → **خطای واضح throw** (نه پاسخ جعلی پنهان).
  - `services.ts`: `getGlobalDefaultService` + مرحلهٔ ۳ fallback سراسری در `resolveServiceForRole`.
  - admin API (`services` + `[id]`): `mock` از `PROVIDER_TYPES` و شرط‌های خاص حذف.
  - `AiServicesManager.tsx`: گزینه/منطق/برچسبِ Mock از UI حذف.
  - `chat route`: `try/catch` دور `invokeAI` → پیام محترمانهٔ ۵۰۳ (چون دیگر mockِ نجات‌دهنده نیست).
  - DB: دو ردیف `AiService` با `providerType="mock"` حذف شدند (اسکریپت یک‌بارمصرف). تنها سرویس باقی‌مانده: GapGPT (IR، پیش‌فرض، کلید ✓).
  - env/docs: `AI_PROVIDER_*`/`AI_PROVIDER` و mock از `.env.example`/`.env.local`/CLAUDE.md (§۸ و §۱۱) پاک شد. (SMS mock دست‌نخورده — Provider واقعی پیامک بعد از سرور.)
- **تأیید واقعی:** تست end-to-end با لاگین dev → `POST /api/chat/messages` → پاسخِ واقعیِ GapGPT (۳.۶s، نه JSON موک). `tsc` ✅ · `next build` ✅. ربط: [[project-ai-provider-locale-split]]، [[project-ai-as-heart]].

---

### DECISION-049 ✅ | چت آنلاین پشتیبانی (کانال زندهٔ انسانی، PRO-only)
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۶-۰۱ | **وضعیت:** ✅ — **با migration** `support_live_chat` (تأیید صریح مالک گرفته شد)
- **چه چیزی:** یک کانال ارتباطی **سوم** و مستقل (جدا از همدم/AI و تیکت): گفتگوی زندهٔ متنی کاربر با پشتیبان انسانی، فقط در ساعات کاری، فقط برای پلن حرفه‌ای.
- **چهار تصمیم معماری (همه با پیشنهاد من، تأیید مالک):**
  1. **مدل داده:** مدل‌های **مستقل** `SupportChatSession` (یک سشن = یک روزِ ایران، `dayKey`) + `SupportChatMessage` — نه بازاستفاده از `SupportTicket` (workflow موضوع/دسته/اولویت/وضعیت با چت زنده ناهمخوان بود).
  2. **ورود کاربر:** کارت «پشتیبانی آنلاین» در پروفایل + پنجرهٔ کشویی هم‌خانوادهٔ همدم (نه FAB دوم — سکوت بصری).
  3. **Real-time:** **polling تطبیقی** پشت لایهٔ نازک `chat-transport` (سرور realtime نداریم؛ قابل‌ارتقا به WebSocket بدون لمس UI — فلسفهٔ Adapter). پنجره ~۳ث، کارت ~۲۰ث، با توقف هنگام مخفی‌شدن tab.
  4. **presence:** برند «پشتیبانی همسو» + نقطهٔ سبز (نه هویت تک‌تک پشتیبان‌ها). آنلاین = ادمینِ دارای `support.respond` با `lastSeenAt<۶۰ث` **و** داخل ساعت کاری.
- **چرخهٔ حیات:** سشن امروز = زنده؛ روزهای قبل = هیستوری read-only و زیبا در همان باکس (archived **محاسبه‌ای** با مقایسهٔ `dayKey` — بدون cron).
- **soft-delete کاربر:** watermark `User.supportChatHiddenUntil`. کاربر «پاک کردن» → watermark=الان؛ فقط پیام‌های بعد از آن را می‌بیند. **پنل همه‌چیز را نگه می‌دارد** و خط «کاربر تا این‌جا را نزد خود مخفی کرد» را در تایم‌لاین نشان می‌دهد (فلسفهٔ داده — هیچ حذف واقعی).
- **اعلانِ پاسخ:** طبق خواستهٔ مالک **بدون نوتیفیکیشن** — فقط **badge** شمارش پیام‌های خوانده‌نشدهٔ پشتیبان روی آیکون کارت (`/api/support/chat/unread`، بدون side-effect).
- **تنظیمات (AppSetting، نه AiConfig):** مدل کلید-مقدارِ **عمومی جدید** `AppSetting` + resolver `settings/app-settings.ts` (cache+fallback مثل ai/config). کلیدها: `support.chat.enabled`/`welcome`/`hours`. متن خوش‌آمد با `{{NAME}}`، ساعات کاری (پیش‌فرض شنبه–پنجشنبه ۹–۱۷) — همه از پنل قابل‌تغییر، اعمال فوری (invalidate cache).
- **گیت پلن:** کلید کاتالوگ `support.liveChat` در `plans/features.ts` (FREE/PLUS:false، PRO:true) — هم‌ترازی پنل↔پروژه، بدون migration، خودکار در `/plans`.
- **پنل:** کنسول `/admin/livechat` (namespace مستقل از `/admin/support` تا با مسیر `[id]` تیکت تداخل نکند) — صفِ گفتگوها + نمای زنده + پاسخ + heartbeat؛ تنظیمات در `/admin/livechat/settings`. گیت: `support.read` (دیدن) / `support.respond` (پاسخ + تنظیمات). audit: `livechat.settings.set`.
- **استقلال ساختاری:** نقاط تماس کنترل‌شده فقط: یک کلید پلن، یک آیتم در کارت پروفایل، یک آیتم nav پنل، یک آیکون، `AdminUser.lastSeenAt`. همدم و تیکت دست‌نخورده.
- **سازگاری مانیفست:** هم‌سو — ساعات کاری محدود **خلاف «همیشه در دسترسم»** است و مرز سالم می‌گذارد. بدون استریک/امتیاز/جشن/ایموجی.
- **تأیید:** `tsc --noEmit` ✅. ربط: [[project-data-philosophy]]، [[feedback-admin-project-parity]]، [[project-roadmap-waves]].

---

### DECISION-050 ✅ | رادارِ «نقشهٔ زندگی» روی ۶ بُعدِ ثابت + دو بهبود پشتیبانی
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۶-۰۲ | **وضعیت:** ✅ — بدون migration
- **۱) رادار همیشه ۶‌محور (تصمیم اصلی، انتخاب مالک):** منطق سه‌حالتهٔ قبلی (`≥۳ دسته → رادار`، `۱–۲ → میله`، `۰ → متن`) **کاملاً حذف شد**. مالک خواست رادار «در هر شرایطی، چه هفته پر باشد چه خلوت» همان فرم را داشته باشد.
  - **ریشهٔ مشکل:** رادار با کمتر از ۳ محور هندسهٔ منحط می‌سازد → به‌همین‌خاطر قبلاً به میله سوییچ می‌شد (سه حالتِ ناهمگون).
  - **حل ریشه‌ای (پیشنهاد من، تأیید مالک):** ۶ **بُعدِ ثابتِ زندگی** (`work/health/relationships/learning/calm/growth`) در `src/lib/reports/life-dimensions.ts`. رادار همیشه روی همین ۶ محور رسم می‌شود — متقارن و قابل‌مقایسه بین هفته‌ها.
  - **نگاشت:** AI برای هر دستهٔ پویا یک `dimension` می‌دهد (فیلد جدید در `aiCategorySchema` + پرامپت v3). `mapToDimensions()` دسته‌ها را به ۶ بُعد تجمیع می‌کند؛ اگر `dimension` نبود (گزارش قدیمی) → کلیدواژهٔ برچسب → fallback پایدار. **سازگار با همهٔ گزارش‌های قدیمی، بدون migration.**
  - **تفکیک نقش‌ها:** هیستوگرامِ تب خلاصه **همان دسته‌های پویا** را نگه می‌دارد (توصیف دقیق)، رادارِ تب تأمل **۶ بُعد ثابت** (نقشهٔ تعادل). بهترینِ هر دو.
  - رادارِ هفتهٔ خالی = شبکهٔ ۶‌ضلعیِ خالی + متن ظریف «این هفته فعالیتی برای نقشه ثبت نشد» (فرم رادار همیشه حفظ). برچسب تب «نقشهٔ دسته‌ها» → «نقشهٔ زندگی».
- **۲) تیکتِ بسته‌شده توسط پشتیبان دیگر قابل پاسخ نیست:** route `POST /api/support/tickets/[id]/messages` حالا `status==="closed"` → ۴۰۹ (پیش‌تر کاربر با پاسخ، تیکت را بازگشایی می‌کرد). UI `/support/[id]` فرم پاسخ را پنهان و به «باز کردن تیکت تازه» هدایت می‌کند.
- **۳) badge سایدبار پنل:** آیتم‌های «تیکت‌ها» و «چت آنلاین» در `AdminShell` شمارِ زنده نشان می‌دهند: تیکت‌های باز (غیر-closed) + سشن‌های چتِ دارای پیام خوانده‌نشدهٔ کاربر. منبع واحد `getSupportNavCounts()` (مقدار اولیه از layout، poll هر ۲۰ث از `/api/admin/nav-counts`، گیت `support.read`).
- **تأیید:** `tsc --noEmit` ✅ · `next build` ✅. صفحهٔ dev `/dev/charts` با ۳ سناریو (پر/خلوت/خالی) به‌روز شد. ربط: [[project-data-philosophy]]، DECISION-047.

---

### DECISION-051 ✅ | ریفکتور UI/UX سراسریِ اپِ کاربر — اتمسفر و متریالِ کلاس‌جهانی (web-first)
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۶-۰۲ | **وضعیت:** ✅ — بدون migration (فقط presentational)
- **منبع:** خواست مالک: «کلاس برتر جهانی، حساسیتِ مدیر خلاقِ Pentagram؛ ملاک = حرفِ مالک، بعد مانیفست؛ زیبایی بصری بسیار مهم (شیشه، گرادیانِ نرم، موشن)».
- **سه تصمیم جهت‌دهنده (همه با پیشنهاد من، تأیید مالک):**
  1. **جهت:** «ارتقای اتمسفر و متریال با حفظ مینیمالیسم» — نه افزایش چگالی. زیبایی از عمق/نور/متریال/موشن می‌آید، نه از شلوغی (سازگار با «سکوت بصری» مانیفست).
  2. **روش:** پایلوتِ داشبورد → تأیید مالک → تعمیم سیستماتیک.
  3. **دامنه:** فقط اپِ کاربر (پنل ادمین ابزاری/جدا).
- **لایهٔ اتمسفر (مشترک):** `AmbientField` (سه blobِ گرادیانِ بسیار نرمِ sage/mist/gold با drift کند + وینیِت ملایم) — نرم‌تر/کندتر از لندینگ، زیر `prefers-reduced-motion` ساکن. کلاس‌های `.app-stage`/`.app-blob-*`/`.app-vignette`/`.stagger` در globals.
- **قالبِ مشترک `AppShell`:** میدانِ اتمسفر + AppNav + لایه‌بندیِ z. صفحات `bg-paper`ِ تختشان را کنار گذاشتند و روی canvasِ زنده نشستند (کارت‌های `glass`/frosted روی گرادیان = لوکِ کلاس‌جهانی). بدون "use client" → در صفحاتِ سرور و کلاینت قابل‌استفاده.
- **ارتقای AppNav (shell سراسری):** اندیکاتورِ active به خطِ زیرینِ انیمیشنی (رشد از مرکز، `ease-expo`) + hover تمیزتر.
- **پاسِ کرافت:** حذف ایموجی‌ها از کارت تعهد (🔒/🌿 → گلیفِ خطیِ SVG، مطابق مانیفست) + فاصله‌گذاریِ عمودیِ دسکتاپ (`sm:py-*`) + `animate-fade-up` ورودِ صفحات + شیشه‌ای‌کردنِ کارت‌های مردهٔ گزارش (هفتهٔ جاری/ghost).
- **صفحاتِ پوشش‌داده‌شده:** dashboard، history، reports/weekly، plans، settings/profile، settings/account، notifications، support، support/[id]، login (login بدون nav → فقط AmbientField).
- **تأیید:** `tsc --noEmit` ✅ · `next build` ✅ (۴۴/۴۴ صفحه). ربط: [[feedback-webapp-not-mobile]]، DECISION (brand book §12 Warm Paper).

---

---

### DECISION-052 ✅ | اشتراک‌گذاری گزارش هفتگی — صفحهٔ عمومیِ `/share/[id]`
- **تاریخ/پیاده‌سازی:** ۲۰۲۶-۰۶-۰۲ | **وضعیت:** ✅ — بدون migration (`isShared` از قبل در schema بود)
- **خواستِ مالک:** کاربر بتواند گزارش هفتگی را در یک چینشِ زیبا به اشتراک بگذارد؛ همه محتوا در یک scroll (بدون tab).
- **تصمیم‌های کلیدی:**
  1. **URL = `/share/[reportId]`** — از CUID موجود استفاده می‌کند (opaque، بدون جدول جداگانه).
  2. **محتوا = همه چیز** — متریک‌ها، نوارِ هفته، خلاصه، هیستوگرام، نکات، تأملِ شخصی + نمودارها (اگر PLUS/PRO باشد). اطلاعات خصوصی (شماره، plan، توکن) صفر.
  3. **حریم خصوصی:** صفحه فقط اگر `isShared=true` نمایش داده می‌شود — در غیر این صورت ۴۰۴. هیچ فهرست/index عمومی نیست.
  4. **Toggle API:** `POST /api/reports/weekly/[id]/share` با ownership check (فقط صاحبِ گزارش می‌تواند تغییر دهد).
  5. **UX:** دکمهٔ share در headerِ `WeeklyReportCard`؛ کلیک اول = فعال‌سازی + کپیِ لینک به clipboard؛ «کپی لینک» جداگانه هنگام shared؛ کلیک دوباره = لغو.
- **فایل‌های جدید:** `src/app/api/reports/weekly/[id]/share/route.ts`، `src/app/share/[id]/page.tsx`، `src/components/features/reports/SharedReportView.tsx`.
- **فایل‌های تغییریافته:** `WeeklyReportCard.tsx` (ShareToggle در header)، `reports/weekly/page.tsx` (بهبود UI کارت هفتهٔ جاری + GhostCard).
- **تأیید:** `tsc --noEmit` ✅. ربط: DECISION-047، [[project-data-philosophy]].

#### تکمیل (۲۰۲۶-۰۶-۰۲) — مودال + OG + لینکِ مهاجرت‌پذیر (خواست مالک)
- **مودالِ شیشه‌ای (`ShareModal.tsx`):** کلیکِ دکمهٔ اشتراک یک مودالِ glass با پس‌زمینهٔ محو باز می‌کند (هم‌خانوادهٔ پنجرهٔ چت)، «همان لحظه» لینک را فعال می‌کند و امکانِ انتشار مستقیم در **توییتر/لینکدین/تلگرام** + **کپی برای اینستاگرام** (اینستاگرام از وب لینک‌گذاری ندارد → کپی + toast راهنما) را می‌دهد. targetها به‌صورت **آرایهٔ توسعه‌پذیر** تعریف شده‌اند تا «شبکهٔ همسو» در آینده یک عضوِ جدید باشد.
- **لینکِ مهاجرت‌پذیر (`lib/utils/app-url.ts`):** لینکِ کلاینت از `window.location.origin` ساخته می‌شود (صفر-پیکربندی)؛ متادیتای سرور (`metadataBase`) از env `NEXT_PUBLIC_APP_URL`. مهاجرت local→server **بدون دستکاری سورس** — فقط env.
- **OG image پویا (`share/[id]/opengraph-image.tsx`):** کارتِ ۱۲۰۰×۶۳۰ با فونتِ فارسیِ PelakFA (از دیسک، runtime=nodejs) + بازهٔ هفته + ۳ متریک. لینک در شبکه‌ها کارتِ زیبا نشان می‌دهد. گزارشِ خصوصی → کارتِ برندِ عمومی (بدون نشت).
- **تأییدِ تصویری:** رِندِرِ standalone (next/og → satori) به PNG و بازبینیِ چشمی ✅. `next build` کامل (روت‌های `/share/[id]` و OG ساخته شدند) ✅.

---

### DECISION-053 ✅ | قاعدهٔ سراسری: متنِ دکمه ثابت، بازخوردِ اکشن با toast + رفعِ ریشه‌ایِ رادار
- **تاریخ:** ۲۰۲۶-۰۶-۰۲ | **وضعیت:** ✅ — بدون migration | **منبع:** خواست مالک («بسیار حساس، مخصوصاً پنل ادمین»).
- **قاعده (مکملِ DECISION-046):** هنگام هر اکشن، **متنِ دکمه هرگز عوض نمی‌شود** (نه «در حال ذخیره…»، نه «ذخیره شد ✓»، نه «کپی شد ✓»). حینِ کار فقط `<Spinner>` (در `components/ui/Spinner.tsx`) کنارِ متنِ ثابت نشان داده می‌شود؛ نتیجه (موفق/خطا) فقط با `toast` اعلام می‌شود. استثناها: toggleهای **حالت** (بستن/باز، فعال/غیرفعال، create/edit) که متنشان وضعیت را بازتاب می‌دهد، نه پیشرفتِ اکشن.
- **دامنه:** کلِ پنل ادمین (۱۲ کامپوننت: ChangePasswordForm، AdminProfileForm، AdminsManager، RolesManager، LiveChatSettings، PlansManager، DiscountManager، AiServicesManager، AiSettingsForm، PromptEditor، AdminReplyForm، TicketControls) + دکمهٔ تولید گزارش کاربر. حالت‌های inlineِ `error`/`saved` به toast منتقل شدند.
- **gating تولید گزارش (تأیید مالک):** بررسی شد که گزارش **فقط** با کلیکِ `GenerateReportButton` ساخته می‌شود؛ هیچ auto-generationی در لیست/داشبورد نیست. هیچ پرامپتی پیش از کلیک به AI نمی‌رود. ✅
- **رفعِ ریشه‌ایِ رادار (تکمیلِ DECISION-050):** دو ایرادِ تأییدشده با تستِ تصویری (رِندِرِ SVG→PNG با رنگ‌های واقعی):
  1. **کلیپِ برچسب‌های کناری:** viewBox ۳۲۰×۳۲۰ بود و برچسب‌های فارسیِ چپ/راست بریده می‌شدند → viewBox به **۳۶۰×۳۰۰** عریض شد + **برچسب‌های کوتاهِ تک‌مفهومی** (`short` در `life-dimensions.ts`: کار/سلامت/روابط/یادگیری/آرامش/خلاقیت).
  2. **فروپاشی به «سوزن»:** در هفتهٔ تک‌بُعدی چندضلعی به یک خط از مرکز تبدیل می‌شد → **کفِ حداقلیِ شعاع (`FLOOR=0.12`)** تضمین می‌کند چندضلعی همیشه «شکل» باشد. نقاطِ داده فقط روی محورهای فعال‌اند (صداقتِ خواندن حفظ).
- **تأیید:** تستِ تصویریِ ۳ سناریو (پر/خلوت/متوازن) ✅ · `tsc --noEmit` ✅ · `next build` ✅. ربط: DECISION-046، DECISION-050.

---

### DECISION-054 ✅ | بازطراحیِ اشتراک‌گذاری گزارش هفتگی — مودالِ کلاس‌جهانی + تصویرِ قابل‌دانلود (کارت/پوستر)
- **تاریخ:** ۲۰۲۶-۰۶-۰۲ | **وضعیت:** ✅ — بدون migration | **منبع:** خواست مالک (مودالِ قبلی «مبتدی، نازیبا و با نمایشِ غلط» بود؛ یک سمپلِ HTMLِ تأییدشده به‌عنوان مرجعِ افکت/استایل ارائه شد — [[reference-share-card-sample]]).
- **خواستِ مالک:** مودالِ اشتراک‌گذاری حداقل هم‌سطحِ سمپل (همهٔ افکت/انیمیشن‌ها) باشد؛ تصویرِ قابل‌دانلود مثلِ سمپل اما شاملِ محتوای گزارش (خلاصه/نکات/نمودارهای تأمل) در یک چینشِ زیبا.
- **تصمیم‌های کلیدی:**
  1. **مودال = پورتِ وفادارِ سمپل** به توکن‌های همسو (`globals.css` بخش «Share modal»): overlayِ محو با گرادیانِ شعاعی، پنلِ شیشه‌ای با ورودِ `scale/translate`، ورودِ پلکانیِ بلوک‌ها (`.sm-rise`)، دکمهٔ بستنِ گرد با چرخشِ ۹۰°، sweepِ shimmer روی پیش‌نمایش، لیفتِ کاشی‌ها. فقط تمِ روشن (اپ dark mode ندارد).
  2. **دو تصویر از یک خط لولهٔ `next/og`/Satori** (`lib/reports/share-image.tsx`): `CompactCard` ۱۲۰۰×۶۳۰ + `Poster` ۱۰۸۰×۲۰۴۰ (متریک‌ها، نوارِ هفته، خلاصه، نکات، **دونات + رادارِ نقشهٔ زندگی کنار هم**، نقل‌قولِ تأمل، فوتر). قاعدهٔ فنی: «شکلِ» نمودارها = SVGِ **بدون متن** به‌صورت `<img>` (resvg رَستر می‌کند، بدونِ فونت)؛ متن/اعداد/برچسب‌ها با **Satori** (فونتِ PelakFA از دیسک) تا فارسی درست رندر شود. رنگ‌ها hex صریح (نه `var()`؛ نه backdrop-filter).
  3. **مسیرِ تصویر:** `GET /share/[id]/image?format=card|poster` — زیرِ درختِ عمومیِ `/share` (هم‌خانهٔ صفحه و `opengraph-image`)، گِیت‌شده با `isShared` (خصوصی/ناموجود → کارتِ برند). `opengraph-image.tsx` هم به همین `CompactCard` ریفکتور شد (DRY، یک منبعِ حقیقت).
  4. **اجزای مودال (همه، طبق تأییدِ مالک):** سوییچِ فرمت (کارت/پوستر، toggleِ حالت) + پیش‌نمایشِ زنده + **دانلودِ PNG** + کپیِ لینک + **QR زنده** (`qrcode`) + X/لینکدین/تلگرام/اینستاگرام + **اشتراکِ سیستمی** (Web Share L2 — تلاش برای اشتراکِ فایلِ تصویر، سپس لینک، سپس کپی).
  5. **متنِ تأمل:** فقط یک **نقل‌قولِ کوتاه** در پوستر (تصمیم مالک) — نه کلِ متن. (صفحهٔ عمومیِ `/share` مطابق DECISION-052 کلِ متن را دارد.)
- **رفعِ دو باگِ نهفته (حین کار کشف شد):**
  - **`/share` عمومی نبود** → بازدیدکنندهٔ بدونِ لاگین به `/login` ریدایرکت می‌شد و کلِ اشتراک‌گذاری برای مخاطبِ واقعی شکسته بود. `/share` به `PUBLIC_PATHS` میدلور اضافه شد (گارد `isShared` در خودِ هندلر).
  - **جداکنندهٔ سال:** ICUِ Node عددِ ۴‌رقمیِ سال را گروه‌بندی می‌کرد (`۱٬۴۰۴`) برخلافِ مرورگر؛ در پایپ‌لاینِ تصویر `noGroup()` اعمال شد (هم کارت/پوستر هم OG).
- **gating تولید گزارش (تأییدِ مجددِ مالک):** تحلیل فقط پس از کلیکِ `GenerateReportButton` نمایش داده می‌شود؛ هیچ auto-generation/auto-display نیست (بدون تغییر — تأییدِ DECISION-053 پابرجاست).
- **وابستگیِ جدید:** `qrcode` (+ `@types/qrcode`).
- **فایل‌های جدید:** `src/lib/reports/share-image.tsx`، `src/app/share/[id]/image/route.tsx`، `docs/ui/share-modal-reference.md`.
- **تغییریافته:** `ShareModal.tsx` (بازنویسیِ کامل)، `opengraph-image.tsx` (DRY)، `globals.css` (بخش Share modal)، `middleware.ts` (`/share` عمومی).
- **تأیید:** `tsc --noEmit` ✅ · `next build` ✅ · **تأییدِ تصویریِ card + poster** (رِندِرِ PNG از مسیرِ واقعی + بازبینیِ چشمی — سال بدونِ جداکننده، نمودارها/نقل‌قول/فوتر درست) ✅. ربط: DECISION-051، DECISION-052، DECISION-047، [[reference-share-card-sample]].

---

### DECISION-055 ✅ | پاک‌کردن چت همدم — watermark سروری (chatClearedAt)
- **تاریخ:** ۲۰۲۶-۰۶-۰۴
- **وضعیت:** ✅ تأیید شده (تأیید صریح مالک)
- **زمینه:** وقتی کاربر چت را پاک می‌کند، باید پیام‌های قبلی را در هیچ سشنی (روز بعد، مرورگر دیگر) نبیند. اما داده‌ها باید در DB حفظ شوند (برای AI context و نگه‌داری داده کاربر).
- **گزینه‌ها:**
  - الف) فیلد `chatClearedAt DateTime?` روی User — watermark (پیام‌های قبلش پنهان)
  - ب) expiresAt = now (داده از بین می‌رود پس از cleanup)
  - ج) ذخیره در AiConfig (hacky)
- **تصمیم:** گزینه (الف) — مالک گزینه migration را صریحاً تأیید کرد.
- **دلیل:** داده‌ها کاملاً در DB محفوظ می‌مانند (برای AI context قابل استفاده در POST)؛ فقط GET آن‌ها را فیلتر می‌کند. این الگو دقیقاً مشابه `supportChatHiddenUntil` است که قبلاً در DECISION-049 برای پشتیبانی آنلاین پیاده شده.
- **پیامدها:**
  - `schema.prisma`: `chatClearedAt DateTime?` روی `User` اضافه شد + `db push` اعمال شد
  - `POST /api/chat/clear`: watermark = `getNow()` روی User ثبت می‌کند
  - `GET /api/chat/messages`: فقط پیام‌های `createdAt > chatClearedAt` برمی‌گرداند
  - `ChatWindow.tsx`: clear button → API call + `setMessages([])` + `hasLoaded.current = false` (reload از سرور در باز شدن بعدی)
  - داده‌های قبل از `chatClearedAt` همچنان در POST برای AI context در دسترس هستند (AI تاریخچه می‌خواند مستقیم از DB بدون فیلتر chatClearedAt)

---

---

### DECISION-056 ✅ | آواتار تصویری + پیش‌فرض سبز + بازطراحی پروفایل کاربر
- **تاریخ:** ۲۰۲۶-۰۶-۰۴
- **وضعیت:** ✅ تأیید شده (تأیید صریح مالک در درخواست)
- **زمینه:** صفحه پروفایل فاقد آپلود تصویر، رنگ پیش‌فرض آواتار تاریک (ink) بود، طراحی به‌اندازه کافی web-first و زیبا نبود.
- **گزینه‌ها:**
  - الف) ذخیره تصویر در فایل‌سیستم (نیاز به CDN/Storage)
  - ب) ذخیره base64 JPEG فشرده در DB (ساده، بدون dependency خارجی)
  - ج) استفاده از کتابخانه‌های crop مثل react-image-crop
- **تصمیم:** گزینه (ب) — base64 JPEG ≤400px @ 0.78 quality (Canvas API بومی مرورگر، ~۲۰–۴۰KB حجم) + پیش‌فرض رنگ = sage (index 3) که با `--color-sage` برند همخوانی دارد.
- **دلیل:** Canvas API بدون dependency خارجی، حجم معقول برای SQLite، کاربر UX ساده دارد (کلیک روی آواتار، انتخاب تصویر، فشرده‌سازی خودکار).
- **پیامدها:**
  - `schema.prisma`: `avatarImage String?` روی `User` و `AdminUser` + `@default(3)` روی `User.avatarPreset`
  - `prisma db push` اعمال شد
  - `/api/profile` و `/api/admin/profile`: اعتبارسنجی `avatarImage` (فرمت data:image + حداکثر ۱۵۰,۰۰۰ کاراکتر)
  - `AvatarSection.tsx`: بازنویسی کامل — hover overlay + file input + Canvas compress + preview آنی + حذف عکس + گرید ۴ ستونی رنگ با «پیش‌فرض» زیر sage
  - `PersonalInfoSection.tsx`: رفع نقض DECISION-053 (متن دکمه ثابت + Spinner)
  - `settings/profile/page.tsx`: بازطراحی کامل — hero رنگی‌شده با رنگ آواتار کاربر + halo محیطی + نوار آمار (تعهدها/گزارش‌ها/روزهای همراهی) + گرید کارت‌های ساختاریافته
  - `AdminProfileForm.tsx`: آپلود تصویر (همترازی ادمین↔پروژه)
  - `admin/profile/page.tsx`: ارسال `avatarImage` به فرم
- **محافظ:** فرمت اشتباه → 422؛ حجم بیش از ۱۵۰ کیلوکاراکتر → 422؛ حذف تصویر → null ذخیره می‌شود.
- **خارج از scope:** crop/rotate تصویر در client (فاز بعدی اگر مالک بخواهد).

---

### DECISION-057 ✅ | آواتار تک‌رنگِ ثابت (طلایی) + انتخاب‌گرِ تصویر با کراپ
- **تاریخ:** ۲۰۲۶-۰۶-۰۴
- **وضعیت:** ✅ تأیید شده (تأیید صریح مالک + پاسخ به سوالات ویژوال)
- **زمینه:** پالتِ ۱۲ رنگیِ DECISION-056 برای کاربر سرریزِ انتخاب بود (نقضِ اصلِ «کمترین انتخاب»). همچنین انتخابِ تصویرِ ساده (input file + فشرده‌سازی) فاقدِ کراپ و مبتدی بود.
- **تصمیم:**
  - **حذفِ کاملِ پالت.** آواتارِ بدون‌عکس همیشه رنگِ ثابتِ طلاییِ برند (`gold` #C19A4A) را دارد. کاربر فقط عکس می‌گذارد؛ با حذفِ عکس دوباره همان طلایی را می‌بیند.
  - **انتخاب‌گرِ مدرنِ کراپ‌دار** با کتابخانهٔ سبکِ `react-easy-crop` (تنها وابستگیِ جدید). خروجی: مربعِ ۵۱۲×۵۱۲، JPEG کیفیت ۰.۸۵ (کیفیتِ بالا، حجمِ کنترل‌شده).
  - **دامنه: سایت + پنل ادمین** (یکدست‌سازیِ کامل تجربه — انتخابِ مالک).
- **دلیل:** تک‌رنگِ ثابت = سکوتِ بصری و حذفِ تصمیم بی‌ارزش. کراپِ دایره‌ای با کیفیت بالا تجربهٔ حرفه‌ای می‌دهد بدون آنکه حجمِ ذخیره‌سازی (base64 در DB) از کنترل خارج شود.
- **پیامدها:**
  - `avatarPresets.ts`: بازنویسی — `AVATAR_COLOR` + `getAvatarColor()` جایگزینِ `AVATAR_PRESETS`/`getPreset`.
  - **بدونِ migration:** ستونِ `avatarPreset` در schema حفظ شد (حذف = پرریسک) اما در نمایش نادیده گرفته و در UI انتخاب نمی‌شود؛ فقط کامنتِ schema به‌روز شد.
  - `AvatarCropModal.tsx` (جدید): مودالِ glass با کراپ دایره‌ای + اسلایدرِ زوم/چرخش + Canvas render؛ مشترکِ سایت و پنل.
  - `AvatarSection.tsx` و `AdminProfileForm.tsx`: حذفِ گریدِ رنگ، اتصال به `AvatarCropModal`، متنِ دکمه «تغییر/آپلود عکس».
  - `/api/profile` و `/api/admin/profile`: حذفِ پذیرشِ `avatarPreset`؛ سقفِ تصویر به ۲۵۰٬۰۰۰ کاراکتر افزایش یافت (۵۱۲px@0.85).
  - نقاطِ نمایش (LiveChatConsole، AdminShell، profile page): `getPreset(...)` → `AVATAR_COLOR`.

---

### DECISION-058 ✅ | احراز هویتِ چندگانه — ایمیل/پسورد + نام‌کاربری (در کنارِ موبایل/OTP)
- **تاریخ:** ۲۰۲۶-۰۶-۰۴
- **وضعیت:** ✅ تأیید شده (تأیید صریح مالک برای migration + پاسخ به سوالات ویژوال)
- **زمینه:** تا امروز تنها راهِ ورود موبایل+OTP بود. برای زیرساختِ شبکهٔ اجتماعیِ آیندهٔ همسو، کاربر باید بتواند با ایمیل+پسورد ثبت‌نام/ورود کند و نام‌کاربری داشته باشد. **فقط سایت — پنل ادمین درگیر نیست.**
- **تصمیم:**
  - **ثبت‌نامِ ایمیلی با تأییدِ کد** (پاسخِ مالک): الگوی دقیقِ OTP اما برای ایمیل، با `EmailAdapter` (Adapter Pattern) و `MockEmailAdapter` (کد در dev از طریقِ `devOnlyPayload`؛ سرویسِ واقعی فاز بعد).
  - ورودِ بعدی با **(ایمیل یا نام‌کاربری) + پسورد**.
  - نام‌کاربری **فعلاً اختیاری**؛ با راه‌اندازیِ شبکهٔ اجتماعی اجباری می‌شود.
  - کاربرِ موبایلیِ موجود می‌تواند از `/settings/account` ایمیل/نام‌کاربری/پسورد اضافه کند.
- **دلیل:** جداسازیِ کانال‌ها پشتِ Adapter (مثل SMS/AI)؛ پسوردِ معلق تا لحظهٔ تأیید در `EmailCode` نگه داشته می‌شود تا کاربرِ تأییدنشده در DB ساخته نشود.
- **پیامدها (migration با `db push` — به‌خاطرِ driftِ موجود از DECISION-056، بدونِ data-loss):**
  - `schema.prisma` (`User`): `phone` → اختیاری (`String?`)، افزودنِ `email`, `passwordHash`, `username` (هر سه `@unique`)، `emailVerifiedAt`.
  - مدلِ جدید `EmailCode` (آینهٔ `OtpCode`): `purpose` ("signup"|"add-email")، `passwordHash` معلق، `userId` برای add-email.
  - **session:** `phone` در `SessionPayload`/`AuthUser` اختیاری شد؛ کلیدِ هویت همیشه `userId` ( `verifySessionToken` دیگر نبودِ phone را رد نمی‌کند).
  - لایهٔ Adapter: `EmailAdapter` + `MockEmailAdapter` + `getEmailAdapter()` در `adapters/index.ts`.
  - ماژول‌ها: `lib/auth/password.ts` (scryptِ مشترک + سیاستِ ملایمِ ۸ کاراکتری)، `lib/auth/credentials.ts` (نرمال‌سازی/اعتبارسنجیِ ایمیل و نام‌کاربری + کدِ امن).
  - APIها: `POST /api/auth/email/request-code`, `/api/auth/email/verify`, `/api/auth/login-password`؛ و برای کاربرِ واردشده: `PATCH/GET /api/account/credentials`, `POST /api/account/email/{request-code,verify}`.
  - UI: بازطراحیِ `login` با تبِ «موبایل» / «ایمیل-نام‌کاربری» (ورود/ثبت‌نام)؛ بخشِ «امنیت و ورود» در `settings/account` (`CredentialsSection`).
  - سازگاری: صفحاتِ ادمین/پروفایل/حذف‌حساب برای `phone` nullable مقاوم شدند (نمایشِ ایمیل/«—» وقتی موبایل نیست). `DELETE /api/account` با `confirm` که با موبایل **یا** ایمیل match می‌شود.
- **امنیت:** پیامِ خطای ورود عمومی (ضدِ enumeration)؛ تأییدِ مالکیتِ ایمیل با کد؛ scrypt timing-safe؛ گیتِ `isBanned` در ورودِ پسوردی.
- **خارج از scope (فاز بعد):** «فراموشیِ رمز» (نیازمندِ ایمیلِ واقعی)، اجباری‌شدنِ نام‌کاربری، ادغامِ خودکارِ حسابِ موبایلی و ایمیلیِ هم‌شخص.

---

### DECISION-059 ✅ | پالایشِ احراز هویت/پروفایل + کراپرِ اختصاصیِ همسو (بازخوردِ مالک)
- **تاریخ:** ۲۰۲۶-۰۶-۰۴
- **وضعیت:** ✅ تأیید شده (ترِیسِ مشترک + پاسخ به سوالات ویژوال)
- **زمینه:** پس از DECISION-057/058، مالک ایراداتی را ترِیس کرد: (۱) کاربر باید هویتِ مکمل را هم تکمیل کند (ایمیلی→موبایل، موبایلی→ایمیل)، (۲) فضاهای خالیِ کارت‌های پروفایل UX را خراب کرده بود (به‌ویژه کارتِ آواتار پس از حذفِ پالت و کارتِ «اطلاعات حساب»)، (۳) نام‌کاربری باید `@username` نمایش داده شود (پایهٔ تگ/منشن)، (۴) پنل ادمین باید همهٔ دیتای کاربر را — حتی خالی — نشان دهد، (۵) کراپِ react-easy-crop رضایت‌بخش نبود؛ zoom/rotate نمی‌خواهد، فقط برشِ ساده با کیفیت/حجمِ مناسب.
- **تصمیم‌ها (پاسخِ سوالاتِ ویژوال):**
  - **کارتِ یکپارچهٔ «هویت و ورود» در صفحهٔ پروفایل** (نه settings/account): چهار ردیفِ موبایل/ایمیل/نام‌کاربری/رمز با وضعیت و ویرایشِ inline (فقط یک ردیف هم‌زمان باز). جایگزینِ کارتِ کم‌محتوای «اطلاعات حساب».
  - **کراپرِ اختصاصیِ همسو** بدونِ کتابخانه: کادرِ مربعیِ قابل‌جابه‌جایی + قابل‌تغییراندازه از گوشه‌ها روی تصویرِ کامل (بدونِ zoom/rotate). خروجی تا ۵۱۲px، JPEG ۰.۹. `react-easy-crop` حذف شد.
- **پیامدها:**
  - **افزودنِ موبایل با OTP** برای کاربرِ ایمیلی: `POST /api/account/phone/{request-code,verify}` (آینهٔ افزودنِ ایمیل؛ OtpCode بازاستفاده شد، بدونِ تغییرِ schema).
  - `IdentityCard.tsx` (جدید): کارتِ یکپارچه با چهار فلوِ inline (افزودنِ موبایل/ایمیل با کد، تنظیم/تغییرِ نام‌کاربری و رمز). `CredentialsSection.tsx` حذف شد.
  - `EditableAvatar.tsx` (جدید): آواتارِ قابل‌ویرایش در heroِ پروفایل (کلیک → کراپ → آپلود). کارتِ مجزای `AvatarSection.tsx` حذف شد → رفعِ فضای خالی.
  - بازچیدمانِ `settings/profile`: hero با `@username` و آواتارِ ویرایش‌پذیر · ردیفِ «اطلاعات شخصی | هویت و ورود» (دو کارتِ متوازن) · کارتِ یادآوری‌ها افقی و تمام‌عرض.
  - `settings/account`: فقط «حذف حساب» (مدیریتِ هویت به پروفایل منتقل شد).
  - `@username` در hero پروفایل و پنل ادمین نمایش داده می‌شود (LTR، `num-latin`).
  - **پنل ادمین — صفحهٔ کاربر:** بخشِ «هویت و ورود» همهٔ فیلدها را نشان می‌دهد حتی خالی‌ها (موبایل/ایمیل/نام‌کاربری/رمز با «ثبت نشده»).
  - `AvatarCropModal.tsx`: بازنویسیِ کامل به کراپرِ سفارشی (pointer events، box-shadow برای تیره‌کردنِ بیرونِ کادر، دستگیره‌های داخلِ کادر).
- **اعتبارسنجی:** `tsc` ✅ · `next build` ✅.
- **خارج از scope:** تغییرِ موبایل/ایمیلِ ثبت‌شده (فعلاً فقط افزودن)؛ موارد قبلیِ DECISION-058 (فراموشیِ رمز و…).

---

### DECISION-060 ✅ | اتصال SMS Provider واقعی — sms.ir (sandbox → production)
- **تاریخ:** ۲۰۲۶-۰۶-۰۶
- **وضعیت:** ✅ پیاده‌سازی شد (sandbox فعال؛ آمادهٔ سوییچ به production)
- **زمینه:** مالک یک پنل sms.ir راه‌اندازی کرده (فعلاً کلید sandbox) و خواست اتصال واقعی SMS با احتیاط و پس از تست امن انجام شود.
- **تصمیم:**
  - آداپتر `SmsIrAdapter` (`src/lib/adapters/smsir-sms.adapter.ts`) که `SMSAdapter` را پیاده می‌کند — مطابق Adapter Pattern (هیچ کد فیچری مستقیم Provider را صدا نمی‌زند؛ همه از `getSMSAdapter()`).
  - endpoint «کد تأیید»: `POST {baseURL}/send/verify`، header `x-api-key`، body `{ mobile, templateId, parameters:[{name,value}] }`؛ موفقیت = `status === 1`.
  - **sandbox و production یک endpoint دارند** — برای محیط واقعی فقط `SMSIR_API_KEY` (و در صورت لزوم `SMSIR_TEMPLATE_ID`) عوض می‌شود. هیچ تغییر کدی لازم نیست.
  - پیکربندی **env-محور** (مثل الگوی فعلی SMS در CLAUDE.md §۱۱)، نه DB/پنل ادمین — تا migration و ریسک لازم نباشد. انتقال به پنل ادمین (مثل AiService، DECISION-039) به‌عنوان فاز بعدیِ اختیاری ثبت شد.
  - opt-in: پیش‌فرض `getSMSAdapter()` همچنان `mock` است؛ فقط با `SMS_PROVIDER="smsir"` فعال می‌شود → سیستم فعلی دست‌نخورده.
- **جزئیات پیاده‌سازی:**
  - تبدیل خودکار شمارهٔ نرمال‌شدهٔ همسو (`+989…`) به فرمت sms.ir (`09…`) داخل آداپتر.
  - `sendOTP` هرگز throw نمی‌کند؛ نتیجهٔ structured (`{success,error}`) برمی‌گرداند تا جریان OTP نشکند؛ AbortController timeout ۱۵s؛ کلید در پیام خطا لو نمی‌رود.
  - `SMSIR_PARAM_NAME` (پیش‌فرض `Code`) برای تطبیق با placeholder قالب.
- **اعتبارسنجی (تست امن):** اتصال به `api.sms.ir` از این سیستم برقرار است (برخلاف GapGPT). تست منفی: کلید نامعتبر → `status:10`؛ قالب اشتباه → `status:113`. تست موفق با قالب واقعی 240766 → `status:1 موفق`. تست مسیر کامل کد (normalizeIranPhone→adapter) ✅. `tsc` ✅.
- **خارج از scope / باقی‌مانده:** تأیید نام پارامتر داخل قالب 240766 برای production (sandbox آن را چک نمی‌کند)؛ کلید/قالب production؛ انتقال اختیاری به پنل ادمین.

---

### DECISION-061 ✅ | مدیریت پنل پیامک + observability (انتقال SMS از env به DB)
- **تاریخ:** ۲۰۲۶-۰۶-۰۶
- **وضعیت:** ✅ پیاده‌سازی شد (آینهٔ AiService — DECISION-039؛ ادامهٔ DECISION-060)
- **زمینه:** پس از فعال‌شدن sms.ir روی env (DECISION-060)، مالک خواست (۱) سرویس پیامک از پنل ادمین مدیریت شود (بدون دست‌زدن به کد/env، مخصوصاً برای سوییچ sandbox→production)، و (۲) ابزاری برای **اطمینان** که ورودِ OTPِ سایت واقعاً از مسیر sms.ir می‌گذرد نه mock.
- **تصمیم‌های تأییدشدهٔ مالک:** جدول `SmsService` چندردیفی مثل AI · هر سه ابزار اطمینان (لاگ + بنر + دکمهٔ تست) · انتقال خودکار env فعلی به DB · تأیید صریح تغییر دیتابیس (`db push`).
- **معماری (هم‌ترازی):**
  - **منبع‌حقیقت واحد:** ردیف‌های `SmsService` در DB. سایت و پنل هر دو از همین می‌خوانند/می‌نویسند.
  - دو مدل جدید (`db push`): `SmsService` (provider/apiKey/templateId/paramName/baseURL/isSandbox/isActive/isDefault) و `SmsLog` (provider/serviceId/purpose/phoneMasked/success/status/messageId/error/isSandbox/createdAt).
  - **resolver** `src/lib/sms/services.ts` (آینهٔ `ai/services.ts`): cache کوتاه + `getDefaultSmsService()`؛ هرگز throw نمی‌کند.
  - **مسیر مرکزی** `src/lib/sms/send.ts → sendVerificationSms(phone, code, purpose)` — قاعدهٔ طلایی مثل invokeAI: تنها نقطهٔ ارسال. resolve: **DB پیش‌فرض → env (legacy) → mock** (fallback امن). لاگ best-effort. هر دو caller (`request-otp`, `account/phone/request-code`) به این وصل شدند؛ `getSMSAdapter()` قدیمی حذف شد.
  - **API ادمین** (آینهٔ `ai/services`): `/api/admin/sms/services` (GET/POST)، `/[id]` (PATCH/DELETE)، `/[id]/key` (POST، فقط Owner)، `/test` (POST، sms.send)، `/logs` (GET).
  - **UI:** صفحهٔ `/admin/sms` با بنر «سرویس فعال» + `SmsServicesManager` + `SmsTestSender` + `SmsDeliveryLog`. nav از «به‌زودی» به فعال. permissionهای `sms.read/send/manage` از قبل بودند.
  - **seed:** بلوک idempotent — اگر `SmsService` خالی بود، از env یک ردیف می‌سازد (انتقال خودکار env→DB).
- **اطمینان (پاسخ به نیاز اصلی):** هر ارسال در `SmsLog` با provider/sandbox/status/messageId ثبت می‌شود؛ بعد از ورود در سایت، رکورد تازه در `/admin/sms` ثابت می‌کند مسیر smsir بوده نه mock. بنر «سرویس فعال» هم وضعیت لحظه‌ای را نشان می‌دهد.
- **حریم خصوصی/امنیت:** کد OTP هرگز لاگ نمی‌شود؛ شماره ماسک می‌شود (`0935***3500`)؛ apiKey فقط Owner می‌بیند (POST `/key`).
- **عدم‌شکست:** resolver با fallback؛ لاگ best-effort؛ env قبلی به fallback تبدیل شد (بازگشت‌پذیر). `isSandbox` فقط برچسب نمایشی (sandbox/prod یک endpoint).
- **اعتبارسنجی:** `db push` ✅ · `seed` ✅ · `tsc` ✅ · `next build` ✅ · تست end-to-end (ورود سایت → رکورد smsir در لاگ پنل) ✅.

---

### DECISION-062 ✅ | کیف‌پول کاربری + شارژ کارت‌به‌کارت + پلن مدت‌دار (راهکار موقتِ هم‌زیست با درگاه)
- **تاریخ:** ۲۰۲۶-۰۶-۰۷
- **وضعیت:** ✅ پیاده‌سازی شد
- **زمینه:** اعطای درگاه پرداخت طولانی شده. به‌جای پرداختِ مستقیمِ کارت‌به‌کارت برای هر پلن (پیش‌نویسِ ردشده)، مدیر فروش راهکارِ بهترِ **کیف‌پول** را پیشنهاد داد که **حتی پس از راه‌اندازی درگاه هم حفظ می‌شود**: خریدِ پلن همیشه از موجودیِ کیف‌پول است؛ شارژِ کیف‌پول امروز کارت‌به‌کارت و فردا با درگاه — بدون بازنویسی/تداخل.
- **جریان:** کاربر کارتِ پرداختش را در `/wallet` ثبت می‌کند → درخواست شارژ با مبلغ دلخواه → **شناسهٔ یکتا `HM-hhmmdd-xxxx`** (تاریخِ جلالی + ۴ رقم) + کارتِ مرجع نمایش داده می‌شود → کارت‌به‌کارت → ادمینِ پرداخت با تطبیقِ **شناسهٔ یکتا + کارتِ ثبت‌شدهٔ کاربر** تأیید (با مبلغِ قابل‌اصلاح) → کیف‌پول اتمیک شارژ + اعلان `wallet.topup.approved` + **رسیدِ canvas قابل‌دانلود** → کاربر در `/plans` با موجودی، پلن می‌خرد.
- **تصمیم‌های مالک:** پلن **مدت‌دار + تمدید هوشمند** · رسید **تصویرِ canvas** (html-to-image، آینهٔ Share*Canvas) · مبلغِ شارژ را کاربر وارد و ادمین تأیید/اصلاح می‌کند · کیف‌پول **فقط شارژ و خرجِ پلن** (بدون برداشت/بازگشت).
- **مدلِ پلنِ مدت‌دار:** ستونِ `User.planExpiresAt` افزوده شد. ماهانه=۳۰ روز، سالانه=۳۶۵ روز. خریدِ هم‌پلنِ فعال→تمدید (افزودن به انقضا)؛ ارتقا/منقضی/FREE→از حالا با مدتِ کامل. **اعطای دستیِ ادمین = بدون انقضا (permanent).**
- **هستهٔ هم‌ترازی — پلنِ مؤثر:** `src/lib/plans/effective.ts → getEffectivePlan/getEffectivePlanKey` تنها مرجعِ «پلنِ فعلیِ کاربر» برای گیت‌هاست؛ اگر منقضی شده باشد **lazy-downgrade** به FREE می‌کند (DB به‌روز می‌ماند → خواندن‌های موجودِ `user.plan` نمی‌شکنند) + اعلان `plan.expired`. وصل‌شده به: چت (`api/chat/messages`)، گزارش/تأمل (`api/reports/weekly`)، تیکتینگ (`lib/support/server`)، صفحهٔ `/plans`.
- **schema (db push):** `User.{walletBalance,paymentCardNumber,planExpiresAt}` + مدلِ `BankCard` (کارتِ مرجع، مدیریت از پنل، آینهٔ SmsService) + مدلِ `WalletTransaction` (دفترِ کل: topup/purchase/adjust؛ مبلغِ علامت‌دار + balanceAfter؛ refCode یکتا). بدون relationِ پریزما (مثل SmsLog).
- **درستیِ مالی:** هر تغییرِ موجودی فقط داخلِ `prisma.$transaction` با re-readِ موجودی + ثبتِ balanceAfter؛ مبلغ همیشه server-side با `applyDiscount` (بازاستفاده)؛ تأیید/خرید idempotent؛ کدِ تخفیف هنگام خرید `usedCount++`.
- **API:** کاربر `/api/wallet/{topup,purchase,receipt/[id]}` + `/api/wallet` + `/api/account/payment-card`؛ ادمین `/api/admin/payment/{cards,cards/[id],topups,topups/[id]/approve,topups/[id]/reject}`.
- **UI:** صفحهٔ `/wallet` (موجودی + کارتِ من + شارژ + تاریخچه + رسید) + آیتم nav؛ `/plans` دکمهٔ «خرید/تمدید با کیف‌پول» + مودالِ خرید با چکِ موجودی؛ پنلِ `/admin/payment` (کارت‌ها + شارژها) با badgeِ در-انتظار. permissionهای `payment.read/manage` از قبل بودند.
- **هم‌زیستی با درگاه:** کیف‌پول = منبعِ خرید؛ درگاهِ آینده فقط منبعِ دیگرِ شارژ خواهد بود → بدون تداخل و بدون دورریختن.
- **اعتبارسنجی:** `db push` ✅ · `seed` (کارتِ مرجع از env) ✅ · `tsc` ✅ · `next build` ✅ · تستِ end-to-end.

---

### DECISION-063 ✅ | اصلاحات UI — مسیریابی صفحات عمومی + کارت پشتیبانی + رسید + ارقام سال
- **تاریخ:** ۲۰۲۶-۰۶-۰۸
- **وضعیت:** ✅ پیاده‌سازی شد
- **زمینه:** چهار مشکل UI گزارش شده توسط مالک؛ یک باگ مسیریابی بحرانی.
- **تصمیم‌ها:**

  **۱. مسیریابی صفحات عمومی (src/proxy.ts):**
  صفحه‌های `/forgot-password`، `/reset-password`، `/verify-email` در `PUBLIC_PATHS` میدلور نبودند → کاربر ناشناس به `/login` ریدایرکت می‌شد. افزوده شدند.

  **۲. کارت اول کیف‌پول (ProfileWalletSection.tsx):**
  `CardSlotRow` وقتی کارتی ثبت نشده بود `null` برمی‌گرداند → کاربر جدید هیچ راهی برای افزودن اولین کارت نداشت. دکمهٔ دَش‌دار «+ افزودن کارت بانکی» اضافه شد.

  **۳. سال شمسی بدون جداکننده هزارتایی (src/lib/utils/date.ts):**
  `toFa(n)` از `n.toLocaleString("fa-IR")` استفاده می‌کرد که ۱۴۰۵ را به ۱٬۴۰۵ تبدیل می‌کند. تابع `faYear(y)` با جایگزینی ارقام (نه locale) اضافه شد و در `formatJalali` و `formatJalaliFromISO` برای جزءِ سال به‌کار رفت. اثر سراسری: داشبورد، تاریخچه، گزارش هفتگی، پنل ادمین.

  **۴. کارت ترکیبی پشتیبانی (SupportSection.tsx — جدید):**
  دو کارت جداگانهٔ «تیکت» و «چت آنلاین» ادغام شدند. دکمه‌ها بر اساس `planAllows()` فعال/غیرفعال می‌شوند (بدون آیکون قفل، grayed-out). هم‌ترازی کامل: تغییر در پنل ادمین → ظرف ۱۰ ثانیه (cache invalidation) در سایت منعکس می‌شود.

  **۵. رسید بدون scroll (WalletReceiptModal.tsx):**
  `transform: scale(0.62)` روی ابعاد layout اثر نمی‌گذاشت → ارتفاع wrapper معادل canvas کامل (~۷۰۰px) بود → scrollbar. جایگزینی با `zoom: 0.58` که ابعاد layout را هم کوچک می‌کند. `max-h` و `overflow-y-auto` حذف شدند.

- **اعتبارسنجی:** `tsc` ✅.

---

---

### DECISION-064 ✅ | Email Provider واقعی — Resend با DB-driven Adapter Pattern
- **تاریخ:** ۲۰۲۶-۰۶-۰۹
- **وضعیت:** ✅ پیاده‌سازی شد
- **زمینه:** MockEmailAdapter برای محیط production کافی نبود؛ نیاز به ارسال واقعی ایمیل (تأیید حساب، بازیابی رمز، ارسال تستی ادمین).
- **تصمیم‌ها:**

  **۱. Provider انتخابی: Resend**
  دلیل: API ساده (یک endpoint)، بدون SMTP، free tier کافی، SDK رسمی npm. کلید از `resend.com`؛ دامنهٔ فرستنده `noreply@hamsoo.app`.

  **۲. معماری آینه‌وارِ SMS (DECISION-061)**
  - `EmailService` + `EmailLog` در Prisma (آینهٔ `SmsService`/`SmsLog`) — `db push` بدون migration.
  - `src/lib/email/services.ts` — resolver با TTL cache 10s (آینهٔ `sms/services.ts`).
  - `src/lib/email/send.ts` — تنها نقطهٔ ارسال (Golden Rule — آینهٔ `sms/send.ts`).
  - `src/lib/adapters/resend-email.adapter.ts` — `ResendEmailAdapter` پشت `EmailAdapter` interface.
  - `getEmailAdapterForService()` در `src/lib/adapters/index.ts` — factory by service record.

  **۳. قانون طلایی ایمیل**
  هیچ کد فیچری مستقیماً `EmailAdapter` را صدا نمی‌زند؛ همیشه از `sendPasswordResetEmail / sendVerificationCodeEmail / sendVerificationLinkEmail` در `@/lib/email/send`.

  **۴. مسیرهای مهاجرت‌یافته (۵ route)**
  - `api/auth/email/request-code` → `sendVerificationLinkEmail`
  - `api/account/email/request-code` → `sendVerificationCodeEmail`
  - `api/account/reset-password/request` → `sendVerificationCodeEmail(..., "password-reset")`
  - `api/auth/forgot-password` → `sendPasswordResetEmail` (+ حذف شاخهٔ username)
  - `api/admin/users/[id]/send-password-reset` → `sendPasswordResetEmail`

  **۵. پنل ادمین `/admin/email`**
  بنر سرویس فعال (provider + fromAddress + وضعیت آماده) + CRUD سرویس‌ها (کلید API فقط Owner) + ارسال تستی + تاریخچهٔ ارسال (EmailLog). مجوزهای RBAC: `email.read` / `email.send` / `email.manage`.

  **۶. seed idempotent**
  اگر `EMAIL_RESEND_API_KEY` در env باشد → `EmailService` با provider `resend` ساخته می‌شود؛ در غیر این صورت `mock`. ۳ permission جدید (`email.*`) به catalog افزوده شد (بدون migration).

  **۷. بازیابی رمز — فقط ایمیل**
  `/forgot-password` فقط ایمیل می‌پذیرد (شاخهٔ username کاملاً حذف شد). `DECISION-064a`.

- **اعتبارسنجی:** `tsc` ✅ · `db push` ✅ · `seed` ✅ (24 permissions + EmailService Resend).

---

### DECISION-065 ✅ | بلاگ همسو — اولین ماژولِ CMS از پنل ادمین
- **تاریخ:** ۲۰۲۶-۰۶-۱۰
- **وضعیت:** ✅ پیاده‌سازی شد (فاز ۱ از CMS؛ فاز ۲ = Override محتوای سکشن‌های صفحات)
- **زمینه:** مالک خواست یک بلاگ حرفه‌ای و کلاس‌جهانی (web-first، دیزاین‌سیستم همسو) که از پنل ادمین کنترل شود؛ کامنت‌گذاری برای عموم (حتی غیرکاربر) با تأیید ادمین؛ و در گامِ بعد، کنترلِ سکشن‌های همهٔ صفحات. این تصمیم فقط **بلاگ** را پوشش می‌دهد (فازبندیِ توافق‌شده: اول بلاگ، بعد CMS سکشن‌ها).
- **تصمیم‌های معماری (با تأیید بصریِ مالک):**

  **۱. مدلِ Override، نه Page-Builder (برای فاز بعد)**
  سکشن‌های صفحات با مدلِ «کد=طراحی+پیش‌فرض، DB=override» مدیریت می‌شوند (هم‌راستا با `AiPromptOverride`/`AppSetting`) — نه بازنویسیِ صفحات به رندرِ جنریک. این تصمیم زیربنای فاز ۲ است؛ بلاگ خودش داده‌محورِ کامل است.

  **۲. مدل داده (۶ مدل، `db push` بدون migration history — پروژه dev با db push کار می‌کند)**
  `BlogPost` (slug + shortCode یکتا، status draft/published/archived، viewCount/likeCount/commentCount، isFeatured، meta SEO)، `BlogCategory`، `BlogTag` + `BlogPostTag` (m2m)، `BlogComment` (پاسخِ تودرتوی یک‌سطح با self-relation، status pending/approved/rejected، authorEmail خصوصی، isAdminReply)، `BlogLike` (یکتا per post+fingerprint).

  **۳. محتوا = Markdown با rendererِ امنِ خودنوشت**
  `src/lib/blog/markdown.ts` — صفر وابستگی، escape کامل (دفاع در عمق)، فقط URLهای امن. خروجی در `.prose-article` (globals.css). کامنت‌ها همیشه plain-text (نه markdown).

  **۴. لایک/بازدید بدونِ لاگین**
  لایک: `fingerprint = sha256(IP+UA)` با toggleِ اتمیک. بازدید: beaconِ کلاینت (`ViewBeacon`) یک‌بار per session تا با caching/پری‌فچ تداخل نکند.

  **۵. لینک کوتاه**
  `shortCode` ۷ نویسه‌ای یکتا → مسیر `/b/<code>` با redirect 308 به `/blog/<slug>`.

  **۶. کامنت‌ها — تأیید ادمین + پاسخِ تودرتو + «اعلان پنل»**
  ثبت با `status="pending"`؛ فقط approvedها در سایت. honeypot ضدِ ربات. «اعلان پنل» = badgeِ `pendingComments` در سایدبار (افزوده به `nav-counts` + `AdminShell` + layout — الگوی badgeهای تیکت/چت/پرداخت). پاسخِ ادمین = `BlogComment` با `isAdminReply` و تأییدِ خودکار. `commentCount` فقط با approvedها اتمیک نگه داشته می‌شود.

  **۷. RBAC — ۳ permission جدید**
  `blog.read` / `blog.write` / `blog.moderate` (گروهِ جدید `blog`)؛ به نقشِ «تولیدکننده محتوا» + owner/admin افزوده شد. seed اجرا شد → 27 permission.

  **۸. پنلِ `/admin/blog`**
  تب‌ها: مقالات (لیست + فیلترِ وضعیت + toggleِ سریعِ انتشار/شاخص از endpointِ سبکِ `flags`) · ویرایشگرِ مقاله (Markdown + پیش‌نمایشِ زنده + کاورِ canvas→base64 + برچسب‌چیپ + دسته + SEO) · دسته‌ها و برچسب‌ها · کامنت‌ها (تأیید/رد/حذف/پاسخ).

  **۹. هم‌ترازی (سایت ↔ پنل)**
  آیتمِ navِ «محتوا» (ready:false) دست‌نخورده برای فاز ۲ ماند؛ «بلاگ» آیتمِ جدید و فعال است. مسیرهای عمومی (`/blog`, `/b`, `/api/blog`) به `PUBLIC_PATHS` پروکسی افزوده شدند. لینکِ «بلاگ» در `LandingNav` + `LandingFooter`.

- **اعتبارسنجی:** `tsc` ✅ · `db push` ✅ · `seed` ✅ (27 permissions) · `build` ✅.

---

### DECISION-066 ✅ | CMS سکشن‌های صفحات — مدلِ Override (فاز ۲)
- **تاریخ:** ۲۰۲۶-۰۶-۱۰
- **وضعیت:** ✅ زیرساخت + **هر ۵ صفحه** (لندینگ، درباره، داستان، تماس، حریم خصوصی) تحتِ کنترلِ CMS. اثباتِ «درباره» تأیید شد و سپس به بقیه تعمیم یافت.
- **زمینه:** ادامهٔ فازبندیِ DECISION-065. مالک خواست همهٔ سکشن‌های صفحات از پنل کنترل شوند (ویرایش + نمایش/مخفی + ترتیب + افزودن/حذف + **اندازهٔ فونت**)، با جریانِ پیش‌نویس/پیش‌نمایش/انتشار، و بدونِ هیچ اثرِ مخرب روی صفحاتِ زیبا (هم‌ترازی).
- **تصمیم‌های معماری (با تأیید بصریِ مالک):**

  **۱. مدلِ Override، نه Page-Builder**
  کد = طراحی + محتوای پیش‌فرض؛ DB = override (هم‌راستا با `AiPromptOverride`/`AppSetting`). هر نوعِ سکشن یک کامپوننتِ دست‌سازِ ثبت‌شده در رجیستری است؛ صفحاتِ زیبا بازنویسی نمی‌شوند.

  **۲. مدل داده (۲ مدل، `db push`)**
  `PageSection` = حالتِ **پیش‌نویس** (ردیف per سکشن: pageKey/type/order/isVisible/content-JSON). `PageContent` = **عکسِ منتشرشده** per صفحه (publishedJson). `content` JSON = `{ fields, styles }` که styles فعلاً `fontSize` per فیلد دارد.

  **۳. قاعدهٔ طلاییِ هم‌ترازی (fallback به کد)**
  سایتِ زنده فقط `PageContent` منتشرشده را می‌خواند؛ اگر صفحه‌ای **هرگز منتشر نشده** → `getDefaultSections` از رجیستری → رندرِ **دقیقاً مثلِ نسخهٔ دست‌سازِ قبلی**. هیچ صفحه‌ای نمی‌شکند، حتی اگر DB خالی باشد. typeِ ناشناخته در PageRenderer بی‌صدا رد می‌شود.

  **۴. رجیستریِ سکشن (الگوی AI Registry)**
  `src/lib/cms/registry.ts` + `src/components/cms/sections/*`. هر `SectionDef` = { type, label, pages, fields[], defaults, defaultStyles, Component }. افزودنِ نوعِ جدید = یک ردیف، بدون migration. `src/lib/cms/pages.ts` صفحاتِ فعال + ترتیبِ پیش‌فرض را تعریف می‌کند (فعلاً فقط `about` فعال).

  **۵. اندازهٔ فونتِ قابل‌ویرایش**
  هر فیلدِ متنی `defaultFontSize` دارد؛ ادمین می‌تواند per نمونه override کند (`content.styles[key].fontSize`). accessor: override → سبکِ پیش‌فرض → defaultFontSize.

  **۶. جریانِ پیش‌نویس/پیش‌نمایش/انتشار**
  ادمین `PageSection` (پیش‌نویس) را ویرایش می‌کند. **پیش‌نمایش** = صفحهٔ `/admin/content-preview/[page]` (بیرونِ گروهِ `(panel)` → تمام‌صفحه، بدونِ سایدبار، با chromeِ واقعیِ سایت از `CmsPageShell`) که `getPageForPreview` (پیش‌نویس → fallback) را رندر می‌کند. **انتشار** = عکسِ پیش‌نویس → `PageContent`. **بازگردانی** = حذفِ ردیف‌های پیش‌نویس → بازگشت به طراحیِ کد.

  **۷. هم‌ترازی (سایت ↔ پنل)**
  هر ۵ صفحه بازسیم‌کشی شدند تا از `CmsPageView` (dispatcherِ مشترکِ chrome + بدنه) استفاده کنند — همان کامپوننت در صفحهٔ زنده و در پیش‌نمایش = یک منبعِ واحد. آیتمِ navِ «محتوا» از `ready:false` به فعال تغییر کرد. مجوزهای موجودِ `content.read`/`content.write` و نقشِ «تولیدکننده محتوا» استفاده شدند (بدونِ permission جدید).

  **۸. سکشن‌های هر صفحه (بدونِ seed — fallbackِ کامل)**
  لندینگ ۷، درباره ۷، داستان ۱۳ (با factory برای بلوک‌های نثر/نقل‌قول + ornamentِ تکرارپذیر)، تماس ۳، حریم ۸. حریم بدنهٔ اختصاصی دارد (`PrivacyBody`: دو ستون + فهرستِ مطالبِ خودکار از `navTitle` + شمارهٔ پویا بر اساس ترتیب). کارت‌های دموی شناورِ لندینگ تزئینی و ثابت‌اند. لیست‌های «نیست/هست» و ردیف‌های جدول با کنوانسیونِ «عنوان — مقدار».

- **اعتبارسنجی:** `tsc` ✅ · `db push` ✅ · `build` ✅ (۷۷ مسیر) · smoke-testِ زنده ✅ — هر ۵ صفحه بدونِ هیچ داده‌ای در DB دقیقاً مثلِ نسخهٔ دست‌سازِ قبلی رندر شدند (fallback به کد).

---

### DECISION-067 ✅ | دارک مود «شبِ گرم» — سراسری (سایت + اپ + پنل ادمین)
- **تاریخ:** ۲۰۲۶-۰۶-۱۰
- **وضعیت:** ✅ پیاده‌سازی شد (تأیید بصری مالک: دامنه = کل پروژه؛ پالت = شبِ گرم)
- **زمینه:** مالک دارک مود خواست با تأکید بر ظرافت و هم‌خوانی با مانیفست (آرامش، بدون حس غم). تحقیق: هرگز مشکی خالص (#000) — smearing در OLED و کنتراست خشن؛ خاکستری سرد حس «فنی» می‌دهد؛ پالت زغالیِ گرم + اکسنت‌های کم‌اشباع = حس دعوت‌کننده.
- **تصمیم‌های معماری:**

  **۱. پالت «شبِ گرم» — ادامهٔ Warm Paper در شب**
  پس‌زمینه `#161310` (زغالی گرم)، سطح `#211D18`، متن `#EDE7DA` (استخوانی نرم، نه سفید)، اکسنت‌ها روشن‌تر/کم‌اشباع‌تر (sage→`#97A28A`، sage-deep→`#ACB89C` چون در دارک باید روشن‌تر باشد، ember→`#D08A68`، gold→`#CFAE63`).

  **۲. مکانیزم: فلیپِ توکن‌ها زیر `[data-theme="dark"]` — نه کلاس‌گذاری per کامپوننت**
  چون کل پروژه توکن‌محور است (`var(--color-*)` + utilityهای `text-ink`/`bg-paper`)، بازتعریفِ همان متغیرها زیر `[data-theme="dark"]` تقریباً همه‌چیز را خودکار فلیپ می‌کند. ترفند کلیدی: فلیپ `--color-white`/`--color-black` تیلویند → `bg-white/40` و `border-black/6` (سراسر پنل ادمین) خودکار دارک می‌شوند.

  **۳. توکن‌های RGB معنایی برای رنگ‌های inline آلفادار**
  `--rgb-card / --rgb-line / --rgb-paper / --rgb-bone` در `:root` + override دارک. همهٔ `rgba(255,255,255,…)`/`rgba(26,26,31,…)` سطح/بوردر در TSXها به `rgba(var(--rgb-*),a)` تبدیل شدند (۲۲ فایل، اسکریپتی). **استثنای عمدی:** سایه‌ها/اسکریم‌ها (آلفای ≥۰.۱۸) دارک می‌مانند؛ فایل‌های خروجی تصویر (share-image، Share*Canvas، WalletReceiptCanvas) و `.sharem-qr` همیشه روشن/برند می‌مانند (خروجی اشتراک‌گذاری نباید تابع تم باشد).

  **۴. سوییچ تم: ۳حالته (سیستم/روشن/تاریک) بدون فلش**
  `ThemeScript` (inline، blocking، اول `<body>`) قبل از paint اتریبیوت می‌گذارد؛ `suppressHydrationWarning` روی html. ترجیح در `localStorage("hamsoo-theme")`. `ThemeToggle` چرخه‌ای (استثنای toggleِ حالت در DECISION-053) در: LandingNav + AppNav + AdminShell (دسکتاپ و موبایل). در حالت system به تغییر زندهٔ OS گوش می‌دهد. گذار نرم با کلاس گذرای `html.theme-anim` (۴۲۰ms، با احترام به prefers-reduced-motion).

  **۵. ظرافت‌های دارک (در globals.css)**
  grain از `multiply` به `screen` با opacity کم؛ blob ها = نور محیطی کم‌رمق (opacity پایین‌تر)؛ glass ها = سطح زغالی نیمه‌شفاف + لبهٔ مهتابی ۶٪؛ btn-primary در دارک متنِ تیره روی sage روشن (کنتراست درست)؛ سایه‌ها عمیق‌تر؛ `color-scheme: dark` برای کنترل‌های بومی. `@custom-variant dark` تیلویند v4 برای `dark:` utilities آینده.

- **اعتبارسنجی:** `build` ✅ · smoke-test صفحات اصلی ✅.

---

### DECISION-068 ✅ | ری‌دیزاین بلاگ — سایدبار + جستجو + TOC چسبان + نوار پیشرفت
- **تاریخ:** ۲۰۲۶-۰۶-۱۰
- **وضعیت:** ✅ پیاده‌سازی شد (تأیید مالک: هر ۴ آیتم پیشنهادی)
- **زمینه:** مالک طراحی تک‌ستونهٔ بلاگ را نمی‌خواست؛ الگوی بلاگ‌های کلاس‌جهانی: سایدبار کاربردی، کارت شیشه‌ای، انیمیشن نرم، TOC و نوار پیشرفت برای مقالات بلند.
- **تصمیم‌ها:**
  - **لیست بلاگ:** گرید `1fr + 290px` (سایدبار چپ در RTL، sticky). سایدبار = ۴ کارت شیشه‌ای: جستجو (form GET → `?q=`، سروری و SSR-friendly)، دسته‌ها با شمارش، «خواندنی‌ترین‌ها» (۴ مقالهٔ پربازدید با شمارهٔ بزرگ فارسی)، ابرِ برچسب (`?tag=`). بنر وضعیت فیلتر/جستجو با «پاک کردن». صفحه‌بندی فیلترها را حفظ می‌کند. hero جمع‌وجور شد.
  - **کوئری‌ها:** `getPublishedPosts` فیلترهای `q` (contains روی title/excerpt/content) و `tagSlug` گرفت؛ `getPopularPosts` و `getPopularTags` جدید.
  - **صفحهٔ مقاله:** گرید `1fr + 260px` — سایدبار TOC چسبان (`ArticleToc`: scroll-spy با IntersectionObserver، هایلایت بخش فعال، h3 تورفته؛ زیر ۲ سرفصل → پیام آرام «یک‌نفس بخوان»). `ReadingProgress`: خط ۲.۵px بالای صفحه، گرادیان sage→mist، RTL از راست، rAF-throttled.
  - **لنگر سرفصل‌ها:** `renderMarkdown` به h1–h6 idِ فارسی‌سازگار و یکتا می‌دهد؛ `extractHeadings()` با همان الگوریتم h2/h3 را برای TOC درمی‌آورد (همیشه هم‌خوان).
  - برچسب‌های پای مقاله حالا به `?tag=` لینک می‌شوند (قبلاً span مرده بود).
- **اعتبارسنجی:** `build` ✅ · smoke-test (جستجو/سایدبار/TOC/progress در SSR) ✅ · تست id فارسی + یکتایی ✅.

---

### DECISION-069 ✅ | ادیتور حرفه‌ای مقاله — Tiptap با خروجی Markdown
- **تاریخ:** ۲۰۲۶-۰۶-۱۰
- **وضعیت:** ✅ پیاده‌سازی شد (تأیید مالک: گزینهٔ Tiptap→Markdown)
- **زمینه:** ادیتور قبلی textarea خام Markdown بود؛ مالک ادیتور حرفه‌ای WYSIWYG خواست.
- **تصمیم‌های معماری:**

  **۱. Tiptap v3 (ProseMirror) با ذخیرهٔ Markdown — هم‌ترازی کامل**
  WYSIWYG کامل اما در DB همان Markdown می‌ماند → مدل داده، rendererِ امن خودنوشت، و مقالات موجود دست‌نخورده. ورود: `renderMarkdown(md)` → HTML → سند Tiptap. خروج: سریالایزر خودنوشتِ بدون‌وابستگی `src/lib/blog/tiptap-markdown.ts` (ProseMirror JSON → همان زیرمجموعهٔ Markdownِ پشتیبانی‌شده در renderer). تست roundtrip ✅.

  **۲. `RichMarkdownEditor` (کلاینت، پنل ادمین)**
  تولبار چسبان: واگرد/ازنو، H2–H4، پررنگ/مورب/خط‌خورده/کد، لینک (پاپ‌آور inline بدون prompt مرورگر)، نقل‌قول، فهرست‌ها، درج تصویر، بلوک کد، خط جدا. محتوای ادیتور با همان `.prose-article` سایت رندر می‌شود (WYSIWYG واقعی). RTL بومی. حالت «Markdown خام» برای ویرایش مستقیم (toggleِ حالت — استثنای DECISION-053). Placeholder از `@tiptap/extensions`.

  **۳. تصویر بدنه = base64 فشرده (همان الگوی کاور)**
  `compressImage` به `src/lib/utils/compress-image.ts` منتقل شد (مشترک کاور + بدنه). `safeImgUrl` در renderer فقط `data:image/(png|jpe?g|gif|webp|avif);base64,` را اضافه‌مجاز کرد (javascript:/data: دیگر همچنان مسدود).

  **۴. underline غیرفعال** (معادل Markdown ندارد)؛ heading فقط ۲–۴؛ لینک بدون openOnClick.

- **اعتبارسنجی:** `build` ✅ · تست سریالایزر (همهٔ نودها: عنوان/مارک‌ها/لینک/نقل‌قول/فهرست‌ها/کد/hr/تصویر/hardBreak) ✅.

---

### DECISION-070 ✅ | ری‌دیزاین تایپوگرافی صفحات استاتیک — مقیاس آرام‌تر
- **تاریخ:** ۲۰۲۶-۰۶-۱۰
- **وضعیت:** ✅ پیاده‌سازی شد
- **زمینه:** بازخورد مالک: «همه‌چیز خیلی بزرگ و غلوشده است» — هیروی ۹۲px، سکشن‌های ۵۲px، پدینگ‌های py-32.
- **تصمیم: مقیاس جدید (حدود ۳۵–۴۰٪ کوچک‌تر، سکوت بصری واقعی)**
  - Display (هیرو لندینگ): `clamp(40,6.5vw,92px)` → `clamp(32,4.8vw,56px)`؛ هیروی صفحات داخلی → `clamp(30,4.4vw,48px)`.
  - عنوان سکشن: `clamp(30,4.2vw,50px)` → `clamp(24,3.2vw,36px)`؛ نقل‌قول‌ها متناسب پایین آمدند.
  - بدنه: ۱۹/۱۸px → ۱۶px؛ کارت h3: ۲۴px → ۱۹px.
  - پدینگ سکشن‌ها: `py-24 lg:py-32` → `py-16 lg:py-20`؛ هیرو `pt-36/44` → `pt-28/36`؛ مارجین‌های داخلی یک پله جمع‌تر.
  - تزئینات: `ribbon-num` ۱۲۰→۷۶px، `step-num` ۴۸→۴۰px، `qmark` ۹۶→۶۴px، `btn-lg` کوچک‌تر.
  - دامنه: هر ۵ صفحهٔ CMS (سکشن‌های `src/components/cms/sections/*` — کد + `defaultFontSize`/`defaultStyles`) + هیروی بلاگ. `.btn` پایه دست‌نخورده (مصرف سراسری در اپ/پنل).
- **⚠️ نکتهٔ هم‌ترازی CMS:** اگر ادمین قبلاً fontSize را در پیش‌نویس/انتشار override کرده باشد، همان override مقدم است (طبق DECISION-066). برای دیدن مقیاس جدید در آن فیلدها → «بازگردانی به طراحی کد» از پنل محتوا.
- **اعتبارسنجی:** `build` ✅ · smoke-test لندینگ ✅.

---

### DECISION-071 ✅ | درگاه پرداخت آنلاین (زرین‌پال) برای شارژ کیف‌پول
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد (تأیید مالک: کانفیگ در DB+پنل، Mock در dev / واقعی در prod)
- **زمینه:** تا امروز شارژ کیف‌پول فقط کارت‌به‌کارتِ دستی بود (DECISION-062) و ادمین هر شارژ را دستی تأیید می‌کرد. درگاه زرین‌پال نهایی شد؛ کاربر باید بتواند آنلاین شارژ کند و موجودی **اتوماتیک** اضافه شود — همان‌طور که کامنتِ پنل پیش‌بینی کرده بود («درگاهِ آینده هم همین کیف‌پول را شارژ می‌کند — بدون تداخل»). یعنی درگاه = شارژِ موجودی، نه خرید مستقیم پلن.
- **تصمیم‌های معماری:**

  **۱. Adapter Pattern (قاعدهٔ طلایی) — آینهٔ SMS/Email**
  اینترفیس `PaymentAdapter` (`src/lib/adapters/payment.adapter.ts`) با دو متد `requestPayment`/`verifyPayment`. پیاده‌سازی‌ها: `ZarinpalAdapter` (واقعی، API v4) و `MockPaymentAdapter` (dev). هیچ کد فیچری مستقیم به درگاه وصل نمی‌شود — همیشه از طریق `getPaymentAdapterForGateway(gw)` در factory.

  **۲. کانفیگ در DB + پنل (نه env) — آینهٔ SmsService/EmailService (DECISION-061/064)**
  مدل `PaymentGateway` (provider/merchantId/isSandbox/isActive). `merchantId` فقط Owner می‌بیند/ویرایش می‌کند (قاعدهٔ apiKey). مدیریت در `/admin/payment` (بخش `PaymentGatewayManager`). resolver `getActivePaymentGateway()` با cache + fallback null (`src/lib/payment/gateway.ts`).

  **۳. انتخابِ config-محور + سندباکسِ واقعی (به‌روزرسانیِ ۲۰۲۶-۰۶-۱۲ — تأیید مالک)**
  نسخهٔ اولِ این تصمیم در dev همیشه Mock می‌گذاشت؛ تجربهٔ تست گیج‌کننده بود (آنی/نامرئی، بدونِ صفحهٔ درگاه). اصلاح شد: انتخابِ آداپتر **config-محور** است (نه اجبارِ `IS_DEV_MODE`):
  - `provider=mock` → `MockPaymentAdapter` (آنی، بدونِ شبکه — فقط CI/آفلاین).
  - `provider=zarinpal` + `isSandbox=true` → `ZarinpalAdapter` روی **`sandbox.zarinpal.com`** (همان API v4، فقط میزبان عوض می‌شود؛ authorityها با «S»؛ merchant_id هر UUID؛ **پولِ واقعی جابه‌جا نمی‌شود**). سندباکس بدونِ merchant_id → UUIDِ تستِ پیش‌فرض.
  - `provider=zarinpal` + `isSandbox=false` → تولید (`payment.zarinpal.com`)؛ بدونِ merchant_id خطای واضح.
  - **پیش‌فرضِ dev = سندباکس** (seed `isSandbox=true`) → کاربر صفحهٔ واقعیِ درگاه را می‌بیند.
  - **انحراف از §۱۳ (تأییدِ صریحِ مالک):** §۱۳ می‌گفت در dev هرگز درگاهِ واقعی؛ اما سندباکس پولِ واقعی ندارد و دقیقاً «مسیرِ تستِ امن» است، پس به‌عنوان پیش‌فرضِ dev پذیرفته شد. Mock همچنان از پنل (provider=mock) برای آفلاین در دسترس است.
  - **پنل شفاف شد:** `PaymentGatewayManager` بنرِ «حالتِ فعال پس از ذخیره» (سندباکس/تولید/ماک) را زنده نشان می‌دهد.

  **۴. جریانِ امن و idempotent**
  `WalletTransaction` با ۴ فیلدِ افزایشی: `gateway`, `authority @unique`, `gatewayRefId`, `cardPan` (type همان `topup`). جریان: `createGatewayTopup`(pending) → `attachAuthority` → [درگاه] → callback: `verifyPayment` → `confirmGatewayTopup` (اتمیک داخل `$transaction`، گاردِ status، شارژِ موجودی) یا `failGatewayTopup`.
  - **مبلغ همیشه از tx ذخیره‌شده** (هرگز از query callback) → ضدِ دستکاری.
  - **idempotent:** یکتاییِ `authority` + گاردِ `status==="approved"` → callbackِ تکراری/refresh دوباره شارژ نمی‌کند. verify code 101 (قبلاً تأیید) هم معتبر شمرده می‌شود.
  - مبلغ به زرین‌پال با `currency:"IRT"` (تومان، بدونِ ×۱۰).
  - اعلانِ موجود `wallet.topup.approved` بازاستفاده شد (بدونِ نوع جدید).

  **۵. callback عمومی در میدلور**
  کوکیِ سشن `SameSite=Strict` است؛ در redirectِ cross-site از زرین‌پال ارسال نمی‌شود. پس `/api/wallet/topup/callback` در `PUBLIC_PATHS` (مثل `/api/dev`) قرار گرفت — هندلر خودگارد است (شناسایی با authority + دروازهٔ verify؛ شارژ فقط پس از تأییدِ درگاه).

- **UI:** «پرداخت آنلاین» مسیرِ اصلیِ مودالِ شارژ شد (بدونِ نیاز به کارتِ ثبت‌شده)؛ کارت‌به‌کارت گزینهٔ دوم. بازگشت از درگاه با `?pay=success|cancel|failed` → `WalletReturnToast` (toast + پاک‌کردن query). در پنل، تراکنش‌های درگاهی با نشانِ «زرین‌پال» و auto-approved دیده می‌شوند (بدونِ اکشن دستی). DECISION-053 رعایت شد (متن دکمه ثابت + Spinner).
- **اعتبارسنجی:** `build` ✅ · seed درگاه ✅ (در dev آزمایشی، merchantId در prod از پنل).

---

### DECISION-072 ✅ | فرم تماس با کپچای اختصاصی + پیام‌های تماس در پنل ادمین
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد (تأیید صریح مالک برای تغییر schema: «جدول DB + بخش پنل ادمین»)
- **زمینه:** صفحهٔ تماس فقط کارتِ راه‌های ارتباط داشت. مالک فرم تماس با کپچایی خواست که بدون سرویس گوگل کار کند + سوشال‌های وکتوری مونوکروم زیر فرم.
- **تصمیم‌ها:**
  - **کپچای اختصاصی** (`src/lib/captcha/captcha.ts`): جمعِ سادهٔ دو عدد به‌صورت SVG با ارقام فارسی + چرخش/نویز. **stateless**: پاسخ هرگز خام در توکن نیست — `HMAC(answer|exp|nonce)` با `NEXTAUTH_SECRET`، انقضای ۸ دقیقه، مقایسهٔ timing-safe. هیچ ردیفی در DB لازم ندارد. API: `GET /api/contact/captcha`.
  - **مدل `ContactMessage`** (db push): name/email/subject/body/status(new|read|archived)/readAt/readById. ایمیل فقط برای ادمین.
  - **API عمومی `POST /api/contact`:** honeypot + کپچا + سقف نرخ سادهٔ per-IP (۵ پیام/۱۰ دقیقه، in-memory). مسیر `/api/contact` به `PUBLIC_PATHS` میدلور اضافه شد.
  - **سکشن CMS جدید `contact-form`** جایگزین `contact-card` در defaults صفحهٔ تماس (کارت قدیمی در رجیستری ماند و از پنل قابل بازگشت است). زیر فرم: `SocialLinks` (مونوکروم) + ایمیل + زمان پاسخگویی.
  - **پنل ادمین:** صفحهٔ `/admin/contact` (permission `support.read`؛ حذف با `support.respond`) + `ContactMessagesManager` (تب‌های جدید/خوانده/بایگانی، باز کردن پیام = خوانده‌شدن خودکار، پاسخ با mailto) + badge «پیام‌های تماس» در سایدبار و `nav-counts` (هم‌ترازی).
- **اعتبارسنجی:** `db push` ✅ · `tsc` ✅ · `build` ✅ · تست موقت API (کپچای غلط رد، honeypot بی‌صدا) ✅.

---

### DECISION-073 ✅ | خرید مستقیم پلن از درگاه — مستقل از کیف‌پول
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد
- **زمینه:** با فعال‌شدن درگاه (DECISION-071) مالک خواست خرید پلن دیگر گروگانِ شارژ کیف‌پول نباشد: کاربر یا با موجودی کیف‌پول می‌خرد یا **مستقیم از صفحهٔ پلن‌ها به درگاه می‌رود** (دو مسیر مستقل). متن‌های «به‌زودی» هم حذف شدند.
- **تصمیم‌ها:**
  - **استعلام مشترک** `quotePlanPurchase()` در `src/lib/plans/purchase.ts`: اعتبارسنجی پلن/دوره/تخفیف + گارد downgrade — مشترک بین خرید کیف‌پولی و درگاهی (یک منبع حقیقت قیمت، server-side).
  - **جریان درگاهی** (آینهٔ DECISION-071): `POST /api/plans/checkout/gateway` → `createGatewayPurchase` (tx type=purchase، amount منفی، planKey/cycle/gateway، pending) → درگاه → `GET /api/plans/checkout/callback` (در `PUBLIC_PATHS`) → verify → `applyGatewayPlanPurchase` (اتمیک/idempotent؛ تمدید هوشمند مثل خرید کیف‌پولی؛ **موجودی دست‌نخورده** — `balanceAfter` همان موجودی فعلی) → اعلان `plan.changed` → redirect `/plans?pay=…` + `PlanReturnToast`.
  - **کد تخفیف در مسیر درگاه:** روی tx با یادداشتِ خوانا `کد تخفیف: CODE` ذخیره و `usedCount` فقط **پس از پرداخت موفق** افزایش می‌یابد (در مسیر کیف‌پولی مثل قبل داخل تراکنش خرید).
  - **edge ایمن:** اگر بین درخواست و پرداخت، پلنِ بالاتری فعال شده باشد (downgrade)، مبلغ به‌جای هدررفتن **به کیف‌پول اضافه می‌شود** با یادداشت روشن.
  - **UI:** مودال خرید دو دکمهٔ مستقل دارد: «خرید/تمدید با کیف‌پول» (فقط با موجودی کافی) و «پرداخت مستقیم از درگاه آنلاین» (همیشه). متن‌های «درگاه به‌زودی» در `/plans` و `PlansPricing` حذف/اصلاح شد.
- **اعتبارسنجی:** `tsc` ✅ · `build` ✅.

---

### DECISION-074 ✅ | شمارش تعهد بدون روزهای فاصله (gap) — سایت + پنل ادمین
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد (شفاف‌سازی مالک: «روز همراهی» = از روز ثبت‌نام، دست نمی‌خورد؛ فقط شمارش تعهد اصلاح شود)
- **قاعدهٔ محصول:** «تعداد تعهد ثبت‌شده» = تعداد روزهایی که کاربر واقعاً تعهد ثبت کرده؛ روزهای داخل بازه‌های `GapRecord` جزو تعهد شمرده نمی‌شوند — اما **دادهٔ گپ برای تحلیل دست‌نخورده می‌ماند** (فاصله = داده، نه شکست).
- **پیاده‌سازی:** helper مشترک `src/lib/stats/commitments.ts` (`countCommitments` + `countCommitmentsBulk` برای فهرست‌ها). مصرف‌کننده‌ها (هم‌ترازی): پروفایل سایت (`/settings/profile` — کارت «تعهد ثبت‌شده»)، جزئیات کاربر پنل (`/admin/users/[id]` — کارت «تعهدها») و لیست کاربران پنل (`/admin/users` — آمار «تعهد»).
- **ضمناً (هم‌ترازی پنل↔پروژه):** در جزئیات کاربرِ پنل، گیتِ «تیکت‌ها» و «چت آنلاین» از چکِ hardcode پلن (`plan === "PRO"`) به `planAllows()` (همان منبع سایت) منتقل شد؛ اگر پلنِ کاربر تیکت نداشته باشد، کارت تیکت مثل کارت چت با حالت «در این پلن نیست» نمایش داده می‌شود.
- **اعتبارسنجی:** `tsc` ✅ · `build` ✅.

---

### DECISION-075 ✅ | بستهٔ اصلاحات UI/UX سراسری — ناوبری، فوتر، بلاگ، کامنت، لاگین، اعلان، مودال
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد
- **تصمیم‌ها (همه به درخواست صریح مالک):**
  - **دکمهٔ تم:** در همهٔ navها (LandingNav/AppNav) آخرین آیتمِ گوشهٔ چپ-بالا شد.
  - **ناوبری یکدستِ قبل از ورود:** `LandingNav` در همهٔ صفحات فقط: صفحه اصلی · درباره ما · تماس با ما · بلاگ (با حالت active). لوگو بزرگ‌تر شد (nav ‎۴۴px، AppNav ‎۳۸px، فوتر ‎۵۰px) با propهای width/height درست → هشدار next/image «logo.png» رفع شد.
  - **فوتر ۴ ستونه:** ۱) لوگو + «آیینه‌ای، برای واقعی‌تر کردن زندگی» + سوشال مونوکروم (`SocialLinks` — X/اینستاگرام/واتساپ/تلگرام، href بعداً ست می‌شود) ۲) محصول (anchors لندینگ + «کاربران») ۳) لینک‌های مفید ۴) مجوزها: e-Namad و زرین‌پال در کادرهای **هم‌سایز** (`TrustBadges`). اسکریپت رسمی TrustCode زرین‌پال document.write دارد که در React اجرا نمی‌شود → همان خروجی (تصویر CDN + لینک trustPage با hostname) مستقیم رندر شد.
  - **درباره ما:** کارت‌های «خط قرمز» از پشته‌ی تمام‌عرض به گرید دو ستونهٔ فشرده.
  - **بلاگ:** کارت غول‌پیکر حذف؛ `PostsExplorer` با دو چیدمان کاشی/لیستی + ذخیرهٔ ترجیح در `localStorage` (`hamsoo:blog:layout`)؛ مقالهٔ شاخص = اولین کارت با نشان «شاخص».
  - **صفحهٔ مقاله:** کاور هم‌عرضِ متن با سقف ارتفاع ۳۸۰px؛ متن justify (`prose-article`)؛ سایدبار غنی‌تر (TOC + خواندنی‌ترین‌ها + برچسب‌ها + کارت بلاگ).
  - **کامنت‌ها:** بازطراحی کارتیِ مدرن، راست‌چین و هم‌راستا با ستون مقاله؛ ریپلای داخل کارت با خط راهنما؛ **کامنت خود کاربر تا تأیید ادمین gray-out فقط برای خودش** (id از API + `localStorage` per-slug با TTL ۷روزه؛ پس از تأیید خودکار عادی می‌شود).
  - **لاگین:** `SmoothHeight` (ResizeObserver + transition) دور فرم‌ها → سوییچ تب موبایل/ایمیل بدون پرش.
  - **زنگولهٔ اعلان:** باز کردن پنل = صفر شدن فوریِ badge (read-all پس از load برای جلوگیری از race)؛ آیتم‌ها در همان باز شدن با استایل خوانده‌نشده می‌مانند.
  - **مودال گزارش هفتگی:** نام «اشتراک‌گذاری و دانلود» شد؛ قفل اسکرول روی `<html>` هم اعمال شد + `overscroll-behavior: contain` → صفحهٔ زیر دیگر اسکرول نمی‌شود (مثل مودال رسید).
  - `metadataBase` به layout ریشه اضافه شد (هشدار OG صفحات مقاله).
- **اعتبارسنجی:** `tsc` ✅ · `build` ✅ · probe صفحات blog/article/contact/about/plans همه ۲۰۰ ✅ · تست موقت API کامنت/کپچا ۷/۷ ✅ (پس از تست، دادهٔ تست حذف شد).

---

---

### DECISION-076 ✅ | محافظت قیمتی پلن — جایگزین منطق rank-based با price-based
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد
- **مشکل:** منطق قدیمی rank-based (FREE=0، PLUS=1، PRO=2) اجازه تغییر پلن را صرفاً بر اساس رتبه می‌داد؛ اما قیمت مبنا نبود. کاربر می‌توانست از PLUS سالانه (۶۰۰ک) به PRO ماهانه (۱۰۰ک) برود که ارزان‌تر بود.
- **قاعده جدید:** مقایسه **قیمت کامل دوره** (نه رتبه). اگر قیمت پلن جدید برای دوره انتخابی < قیمت پلن فعال برای دوره فعلی → مسدود. مثال‌ها:
  - PRO ماهانه (۱۰۰ک) → PLUS سالانه (۶۰۰ک): **مجاز** (۶۰۰ک > ۱۰۰ک)
  - PLUS سالانه (۶۰۰ک) → PRO ماهانه (۱۰۰ک): **مسدود** (۱۰۰ک < ۶۰۰ک)
  - PLUS سالانه → PRO سالانه: **مجاز** (PRO سالانه گران‌تر)
- **چرخه فعلی کاربر:** از آخرین `WalletTransaction` موفق (type=purchase، planKey=پلن فعلی) خوانده می‌شود. اگر تراکنشی نبود (ادمین دستی داد) → فرض ماهانه (محافظه‌کار).
- **ادمین:** مسیر پنل ادمین از این قید مستثناست (مستقیم User.plan را تغییر می‌دهد).
- **پیاده‌سازی:** `src/lib/plans/purchase.ts` (helper `getCurrentPlanPrice`، تغییر در `quotePlanPurchase`، `purchasePlan`، `applyGatewayPlanPurchase`). UI: `PlansPricing.tsx` + `plans/page.tsx` (prop جدید `currentPlanBasePrice`).
- **اعتبارسنجی:** `tsc` ✅

---

### DECISION-077 ✅ | کپچای پیچیده‌تر — چهار نوع چالش ریاضی
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد
- **مشکل:** کپچای قبلی فقط جمع سادهٔ تک‌رقمی بود (مثل ۳+۵) که برای ربات‌های مدرن ساده است.
- **راه‌حل:** چهار نوع چالش با انتخاب تصادفی:
  1. **جمع دورقمی:** a + b (a,b ∈ [۱۱–۴۹]، نتیجه ≤ ۹۸)
  2. **ضرب تکی:** a × b (a,b ∈ [۳–۹]، نتیجه ≤ ۸۱)
  3. **ضرب + جمع:** a × b + c (نتیجه ≤ ۹۹)
  4. **ضرب − تفریق:** a × b − c (نتیجه ≥ ۲)
- **SVG:** عرض پویا (`max(180, chars*22+40)`) برای جا گرفتن عبارت‌های طولانی‌تر. ۵ خط نویز (قبلاً ۴) + ۲۰ نقطه (قبلاً ۱۴). فونت bold‌تر.
- **Verify:** همان regex `/^\d{1,3}$/` — نتایج همه حالات ≤ ۹۹ (دورقمی).
- **UI:** placeholder فرم تماس از «حاصل جمع؟» به «پاسخ؟» تغییر کرد.
- **پیاده‌سازی:** `src/lib/captcha/captcha.ts` + `src/components/features/contact/ContactForm.tsx`.
- **اعتبارسنجی:** `tsc` ✅

---

### DECISION-078 ✅ | اصلاحات UI/UX دور سوم — ChatFAB، Share Modal، OTP Display
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد
- **تغییر ۱ — ChatFAB بعد از لاگین:** Next.js App Router layoutها در client-side navigation کش می‌شوند؛ `isAuthenticated` از رندر قبل از لاگین حفظ می‌ماند. راه‌حل: `window.location.href = "/dashboard"` به‌جای `router.push` — full page reload تضمین می‌کند layout با session جدید re-render شود.
- **تغییر ۲ — Share Modal no-scroll:** حذف section ⑤ (متن حریم خصوصی + لینک «لغو اشتراک‌گذاری»). تغییر `overflow-y: auto` به `overflow: hidden` روی `.sharem-panel`. کوچک‌تر شدن آیکون‌های شبکه‌های اجتماعی از ۴۸×۴۸ به ۴۰×۴۰ (SVG از ۲۰px به ۱۶px).
- **تغییر ۳ — OTP phone number dir:** حذف `dir="ltr"` از span شماره موبایل در مرحلهٔ OTP. در RTL context با `dir="ltr"` bidi algorithm ترتیب بصری را معکوس می‌کرد. اضافه کردن `underline decoration-dotted` برای وضوح clickable بودن.
- **پیاده‌سازی:** `src/app/login/page.tsx` + `src/components/features/reports/ShareModal.tsx` + `src/app/globals.css`.
- **اعتبارسنجی:** `tsc --noEmit` ✅

---

### DECISION-079 ✅ | کامنتِ بلاگ فقط برای اعضا + پاسخِ ایمیلیِ تماس + حذفِ بخشِ محتوا از پنل
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد
- **بستر:** سه اصلاح هم‌زمان با رعایتِ اصل هم‌ترازی (سایت ↔ پنل).

**۱) گیتِ عضویتِ کامنتِ بلاگ (بازنگریِ DECISION-065):**
- پیش‌تر هر مهمان با نام+ایمیل کامنت می‌گذاشت. حالا **فقط کاربرِ لاگین‌کرده** (session) می‌تواند کامنت/پاسخ بگذارد. مهمان به‌جای فرم، کارتِ «برای ثبت نظر باید عضو همسو شوی» + لینکِ `/login` می‌بیند.
- هویت **از session** می‌آید نه از بدنهٔ درخواست (ضدِ جعل). نامِ نمایشی = `displayName` کاربر؛ نام‌کاربری/ایمیل/موبایل هرگز نمایش داده نمی‌شوند.
- **schema:** ستونِ `authorUserId String?` به `BlogComment` افزوده شد (db push، افزایشی، nullable؛ null فقط برای پاسخِ رسمیِ ادمین) — برای تریسِ دقیقِ پنل، چون ورودِ اصلی موبایل+OTP است و اکثر کاربران ایمیل ندارند. `authorEmail` حالا ایمیل **یا** موبایلِ کاربر را برای ادمین نگه می‌دارد.
- مدریشن دست‌نخورده: کامنت `pending` می‌ماند تا تأییدِ ادمین.
- **ترتیب + صفحه‌بندی:** ریشه‌ها جدیدترین→قدیمی‌ترین؛ بیش از ۱۰ کامنتِ ریشه → صفحه‌بندیِ سمتِ کلاینت بدونِ رفرش. پاسخ‌ها زیرِ هر ریشه به‌ترتیبِ زمانیِ گفت‌وگو.
- **داده:** همهٔ کامنت‌های موجود حذف شدند و `commentCount` صفر شد (شروعِ تمیز برای تریس).
- **فایل‌ها:** `prisma/schema.prisma` · `src/app/api/blog/[slug]/comments/route.ts` · `src/app/blog/[slug]/page.tsx` · `src/components/features/blog/CommentForm.tsx` · `CommentsSection.tsx` · `src/lib/blog/queries.ts`.

**۲) پاسخِ ایمیلیِ «تماس با ما» (جایگزینِ mailto):**
- پیش‌تر دکمهٔ «پاسخ» فقط `mailto:` بود. حالا ادمین در مودال باکسِ متنی باز می‌کند و پاسخ **با سرویسِ ایمیلِ پیش‌فرض (فرستنده hello@hamsouapp.ir)** به فرستنده ارسال می‌شود.
- متد `sendContactReply` به `EmailAdapter` (+ Resend و Mock) و تابعِ `sendContactReplyEmail` (purpose `contact-reply`) به `email/send.ts` افزوده شد. مسیرِ جدید `POST /api/admin/contact/[id]/reply` (permission `support.respond`) — پس از ارسالِ موفق پیام را خوانده‌شده می‌کند.
- **نکتهٔ ops:** فرستندهٔ واقعی = `fromAddress` سرویسِ پیکربندی‌شده در پنل؛ برای hello@hamsouapp.ir باید دامنه در Resend verify و آدرس تنظیم شود.
- **UI پنل:** کارت‌های پیامِ تماس **دو‌ستونه و تقریباً مربعی**؛ کلیک → مودالِ متنِ کامل؛ دکمهٔ صریحِ «مشاهده شد» → تبِ خوانده‌شده (دیگر باز شدن، خودکار خوانده‌شده نمی‌کند). متنِ دکمه‌ها ثابت (DECISION-053).
- **فایل‌ها:** `src/lib/adapters/email.adapter.ts` · `resend-email.adapter.ts` · `mock-email.adapter.ts` · `src/lib/email/send.ts` · `src/app/api/admin/contact/[id]/reply/route.ts` · `src/components/admin/contact/ContactMessagesManager.tsx`.

**۳) حذفِ بخشِ «محتوا» از پنل ادمین (CMS سکشن‌ها):**
- بخش بسیار حساس بود؛ با دقت **فقط لایهٔ ادمینِ ویرایش** حذف شد و **لایهٔ رندرِ سایت دست‌نخورده** ماند تا چیزی نشکند. صفحاتِ استاتیک (درباره/تماس/داستان/حریم/فرود) همچنان از `src/lib/cms/queries.ts` (منتشرشده → fallback پیش‌فرضِ کد) رندر می‌شوند.
- **حذف‌شده:** `src/app/admin/(panel)/content/*` · `src/app/admin/content-preview/*` · `src/app/api/admin/content/*` · `src/components/admin/content/*` + آیتمِ nav «محتوا» در `AdminShell`.
- **حفظ‌شده (عمداً):** کلیدهای permission `content.read`/`content.write` و نقشِ سیستمیِ «تولیدکنندهٔ محتوا» در `permissions.ts` (حذفشان نیازمندِ reseed و شکستنِ نقش بود) + کلِ `src/lib/cms/*` و `src/components/cms/*` (رندرِ سایت). جداولِ `PageSection`/`PageContent` بدونِ تغییر ماندند.
- بازنویسیِ این بخش با رویکردِ دیگری در آینده.
- **اعتبارسنجی:** `tsc --noEmit` ✅ (۰ خطا).

---

### DECISION-080 ✅ | ثبت‌نامِ ایمیلی بدون رمز + لیبلِ سیکلِ پلن + زنگوله بدونِ صفحه + تاریخچهٔ چتِ همدم
- **تاریخ:** ۲۰۲۶-۰۶-۱۲
- **وضعیت:** ✅ پیاده‌سازی شد
- **زمینه:** چهار بهبود UX مستقل در یک چرخهٔ توسعه.

**الف — ثبت‌نامِ ایمیلی بدون رمز عبور در فرم:**
- فرمِ ثبت‌نام فقط ایمیل می‌خواهد (رمز حذف شد).
- `EmailCode.passwordHash` = null ذخیره می‌شود (این فیلد قبلاً nullable بود).
- پس از کلیک روی لینکِ فعال‌سازی → کاربر بدونِ رمز ساخته می‌شود → session صادر می‌شود → به `/settings/profile` هدایت می‌شود.
- پروفایل‌پیج شرطِ `!passwordHash && email && emailVerifiedAt` را چک می‌کند → `<SetPasswordModal>` (مودالِ قفل‌شده) نمایش می‌دهد.
- مودال: خوش‌آمد + ۲ فیلد رمز (و تکرار) + فیلدِ اختیاریِ نام‌کاربری → `POST /api/account/set-password`.
- **پس از تنظیم رمز** → `router.refresh()` → شرط false می‌شود → مودال از صفحه خارج می‌شود.

**ب — فیلدِ `planCycle` روی User:**
- `planCycle String?` به مدلِ `User` اضافه شد (db push — بدون از دست دادنِ داده).
- مقادیر مجاز: `"monthly"` | `"annual"` | null (FREE).
- منابعِ ذخیره: ادمین‌پنل `/api/admin/users/[id]/plan` + `purchasePlan` (کیف‌پول) + `applyGatewayPlanPurchase` (درگاه).
- ادمین UI: سلکتورِ ماهانه/سالانه قبل از دکمه‌های پلن اضافه شد.
- نمایش: کنارِ badge پلن در hero پروفایل (فقط برای غیر FREE).

**ج — زنگوله بدونِ صفحه:**
- `items.slice(0, 8)` → `items.slice(0, 20)`.
- لینکِ «مشاهدهٔ همهٔ یادآوری‌ها» از انتهای dropdown حذف شد.
- `scrollbar-none` روی کانتینرِ لیست اضافه شد.
- `src/app/notifications/page.tsx` و `NotificationsList.tsx` حذف شدند.
- کارتِ «یادآوری‌ها» در پروفایل دیگر لینک به `/notifications` ندارد.

**د — تاریخچهٔ چت همدم:**
- پیام‌ها بر اساسِ تاریخِ شمسی گروه‌بندی می‌شوند.
- هر گروه یک `DateSeparator` دارد: تاریخ شمسی + تعدادِ پیام + آیکونِ فلش برای باز/بستن.
- روزهای قبلی: بستهٔ پیش‌فرض (collapsible)؛ امروز: همیشه باز.
- انیمیشنِ `maxHeight` transition برای باز/بسته شدنِ روان.
- **اعتبارسنجی:** `tsc --noEmit` ✅ (۰ خطا).

---

### DECISION-081 ✅ | دسترسی چت آنلاین + مدیریت کامل ادمین‌ها برای مالک

**الف — permission چت آنلاین (`support.chat`):**
- `support.chat` با لیبل «مدیریت چت آنلاین» به کاتالوگ `ADMIN_PERMISSIONS` اضافه شد.
- نقش پایهٔ «پشتیبان» (`support` system role) این permission را دریافت کرد (اکنون ۵ دسترسی دارد).
- نقش «مالک» و «ادمین سیستم» به‌صورت خودکار پوشش می‌دهند (همهٔ permissionها / تمام‌به‌جز admins+roles).
- Seed اجرا شد: ۲۸ permission کل.

**ب — مدیریت کامل ادمین‌ها برای مالک سایت:**

*اصل:* مالک باید همان سطح دسترسی کامل را به حساب‌های ادمین داشته باشد که به حساب‌های کاربری دارد — بدون محدودیت.

*عملیات جدید (همگی owner-only):*
1. **ویرایش پروفایل:** `PATCH /api/admin/admins/[id]` — نام نمایشی، نام کاربری، شماره، آواتار، mustChangePassword
2. **بازنشانی رمز:** `POST /api/admin/admins/[id]/reset-password` — رمز جدید auto-generate + نمایش یک‌بار (مثل ساخت ادمین جدید)
3. **حذف دائمی:** `DELETE /api/admin/admins/[id]` — غیرقابل بازگشت؛ نه مالک، نه خود
4. **انتقال مالکیت:** `POST /api/admin/admins/[id]/transfer-ownership` — اتمیک: هدف→owner، مالک کنونی→admin؛ تأیید متنی اجباری

*محافظت‌ها:*
- رمز ذخیره‌شده hash است → نمایش رمز فعلی ممکن نیست؛ تنها بازنشانی با رمز جدید
- حذف: نه مالک، نه خود
- انتقال مالکیت: نه به خود، نه به حساب غیرفعال
- انتقال اتمیک با `prisma.$transaction`

*UI:*
- ستون «عملیات» در جدول ادمین‌ها فقط برای مالک (`isOwnerViewing`) نمایش داده می‌شود
- هر ردیف: آیکون ویرایش، آیکون بازنشانی رمز، آیکون انتقال مالکیت (نه برای owner)، آیکون حذف (نه برای owner/self)
- آواتار ادمین در ردیف جدول نمایش داده می‌شود (image یا اول نام)
- تأیید حذف: تایپ نام کاربری؛ تأیید انتقال: تایپ عبارت «مالکیت را منتقل کن»

*Audit actions جدید:* `admin.delete` (danger)، `admin.password.reset` (security)، `admin.ownership.transfer` (security)

---

### DECISION-082 | فیچر «برنامه‌ریزی» — سفرِ یک‌هدفی روایی + کوچِ «همراه»
- **تاریخ:** ۲۰۲۶-۰۶-۱۳
- **وضعیت:** ✅ تأیید شده (پیاده‌سازی‌شده)
- **زمینه:** صاحب پروژه یکی از فیچرهای محوری را خواست: برنامه‌ریزی حولِ **یک هدفِ بازه‌ای** با نوشته‌های روایی روزانه («استوری») و یک کوچِ AI به نام **«همراه»**. این از DECISION-024 سرچشمه می‌گیرد اما بسیار غنی‌تر است. خطرِ اصلی: نقضِ مانیفست §۱ («Task Manager / Habit Tracker نیست»).
- **تصمیم‌های قفل‌شده (پرسشِ ویژوال از مالک):**
  - یک هدفِ **فعال در لحظه** (قوی‌ترین گاردِ ساختاری). اهدافِ تمام‌شده/رهاشده در تاریخچه می‌مانند.
  - **زمان‌بندِ سبک همین حالا ساخته شد** تا یادآوری‌ها واقعاً ارسال شوند (درون‌برنامه + ایمیل).
  - **ساختِ هدف + استوری برای همهٔ پلن‌ها**؛ **«همراه» فقط پرو** (قابلِ روشن‌کردن per پلن از پنل).
  - المان مرکزی: **استوری‌بوردِ کارتیِ افقی** + خطِ زمانیِ ظریفِ متصل‌کننده. بدون نوار درصد/استریک/گیمیفیکیشن.
- **گاردهای ساختاریِ ضدِ Task Manager (حفظِ DECISION-024):** بدون sub-task/priority/dependency/چک‌باکس؛ بدون درصد تکمیل/استریک/امتیاز؛ تنها نمایشِ زمانی «روز k از n» و «N روز مانده» (موقعیتِ تقویمی، نه نمره)؛ استوری = نوشتهٔ روایی قابل‌ویرایش (نه واحدِ کار)؛ یادآوری opt-in و ضدفشار (DECISION-023)؛ «همراه» بدون «باید/نباید»، پیشنهادها دعوتی‌اند. هستهٔ روزانه (DailyEntry/Feedback/WeeklyReport) دست‌نخورده.
- **دو ایجنتِ متمایز:** «همدم» (`chat-companion`، چتِ عمومی، همهٔ پلن‌ها) ≠ «همراه» (`goal-companion`، تارگت‌منیجر/کوچِ هدف، Pro، **از روزِ دوم** تا قبل از پایان، روزی یک‌بار). [اصلاح ۲۰۲۶-۰۶-۱۳: پنجره از روزِ ۳ به روزِ ۲ تغییر کرد]
- **مدل داده (db push، تأییدِ مالک):** `Goal`, `GoalStory`, `GoalCompanionInsight` (یکتا per goal+dayKey)، `GoalReminder` (یک per goal). همه cascade از User/Goal + `devSeed?`.
- **نقشِ AI:** `goal-companion` (prompt `prompts/goal-companion/v1.fa.md`، Zod schema، register در bootstrap، ردیف در `AI_ROLES_ADMIN` → ویرایشِ پرامپت/روتینگ/مدل از پنل). خطای سرویس → ۵۰۳ محترمانه (بدون mock، DECISION-048).
- **پلن:** کلیدهای `goal.planning` (پیش‌فرض همه true) و `goal.companion` (پیش‌فرض فقط PRO) در `plans/features.ts`؛ enforce با `planAllows` + `getEffectivePlanKey`؛ خودکار در `/admin/plans` (هم‌ترازی).
- **یادآوری/زمان‌بند:** `lib/goal/reminder-scheduler.ts::runReminderTick()` (با `getNow`/`iranClock` → time-travel)، route `POST/GET /api/cron/reminders` (محافظِ `CRON_SECRET`: Bearer یا `x-cron-secret` یا `?secret`)، `vercel.json` هر ۱۵ دقیقه، دکمهٔ dev `/api/dev/goal/reminder-tick` در DevDataPanel (§۱۳). کاتالوگِ نوتیف: `goal.reminder`/`goal.companion.ready`/`goal.completed` (آیکنِ `goal`). تولید اعلان فقط با `createNotification`.
- **هم‌ترازیِ پنل:** کنترلِ دسترسی از `/admin/plans` (تغییرِ پلن→دسترسی فوری) + مدیریتِ نقشِ همراه از `/admin/ai`. **نمای هدفِ کاربر در `/admin/users/[id]` عمداً اضافه نشد** — برای پایبندی به قاعدهٔ حریم‌خصوصی §۷ (محتوای تعهد/استوریِ کاربر هرگز در پنل نمایش داده نمی‌شود).
- **بُعد عمومیِ استوری:** فعلاً خصوصی؛ ستون `visibility`+`shareToken` آماده است؛ اشتراکِ لینکیِ تک‌استوری و فیدِ عمومی به فازِ شبکهٔ اجتماعی موکول شد (`social.network` هنوز comingSoon).
- **lazy-completion:** هدفِ active که امروز از `endDate` گذشته باشد، هنگام خواندنِ نما به `completed` تبدیل و اعلانِ `goal.completed` ارسال می‌شود (بدون cronِ جدا).
- **مسیر/UI:** `/goal` (و `/goal/history`)، آیتمِ «برنامه‌ریزی» در `AppNav`. کامپوننت‌ها در `src/components/features/goal/*`. قانونِ متنِ دکمه (DECISION-053) و ارقام/تاریخِ فارسی (DECISION-042/044) رعایت شد.
- **اصلاحاتِ ۲۰۲۶-۰۶-۱۳:**
  - هر روز **فقط یک استوری** مجاز است (گارد در API POST /story، `409` اگر وجود داشت)؛ StoryComposer حالتِ ویرایشِ استوریِ موجود را نشان می‌دهد.
  - ویرایشِ هدف **فقط روزِ اول** (`dayNumber ≤ 1`) — پس از آن فقط «پایانِ مسیر» (دو انتخاب: ماندن در تاریخچه با وضعیتِ abandoned OR حذفِ کامل `DELETE /api/goal/[id]`). گزینهٔ «به پایان رساندن» حذف شد (lazy-completion آن را مدیریت می‌کند).
  - **DevDataPanel از layout حذف شد** (هنوز در `IS_DEV_MODE` موجود است اما در layout رندر نمی‌شود). دیتابیس از کاربرانِ آزمایشی و ادمینِ niloufar پاک شد.
- **سند تکمیلی:** `docs/features/goal-planning.md`.

---

### DECISION-087 | بستهٔ اصلاحاتِ ورود/پلن/فریز + تثبیتِ هویتِ رنگیِ فریز
- **تاریخ:** ۲۰۲۶-۰۶-۱۴
- **وضعیت:** ✅ تأیید شده (پیاده‌سازی‌شده)
- **زمینه:** شش ایراد/بهبود پس از تستِ صاحب پروژه روی ورود، صفحهٔ پلن‌ها، مودالِ فریز و onboarding.
- **۱) اعتبارسنجیِ regex برای ورودی‌های ورود/ثبت‌نام:** ماژولِ واحدِ `src/lib/utils/validation.ts`
  (RE_IRAN_MOBILE `^09\d{9}$`، RE_EMAIL، RE_USERNAME، RE_OTP + توابع و پیام‌های فارسی). وصل به:
  موبایل (MobileFlow)، ایمیلِ ثبت‌نام (EmailSignup)، شناسهٔ ورود = ایمیل‌یا‌نام‌کاربری + رمزِ غیرخالی
  (EmailLogin)، و ایمیلِ `forgot-password`. موبایل پیش از تطبیق با `onlyDigits` نرمال می‌شود. سرور
  اعتبارسنجیِ مستقلِ خود را حفظ می‌کند (این لایه فقط UX است).
- **۲) رنگِ دکمه‌های فریز مطابقِ دیزاین سیستم:** رنگِ `sky-*` خامِ Tailwind (آبیِ تند) با توکنِ برندِ
  `mist` جایگزین شد + توکنِ تازهٔ `--color-mist-deep` (روشن/تاریک) برای کنتراستِ کافی. اعمال در
  **همهٔ سطوحِ فریز** (هم‌ترازی): `FreezePill` (هاور)، دکمهٔ `FreezeModal`، `FreezeActiveBanner`،
  چیپ‌های روزِ گزارش (`WeeklyReportCard`/`SharedReportView`)، و نمای فریزِ **پنل ادمین**
  (`/admin/users/[id]`). تصاویرِ خروجی (poster/share-image) عمداً تغییر نکردند چون `gap` همان‌جا از
  mist استفاده می‌کند و freeze باید متمایز بماند.
- **۳) تقویمِ مودالِ فریز درونِ کادر:** propِ `inline` به `JalaliDatePicker` افزوده شد (پاپ‌اوور به‌جای
  `absolute` شناور، به‌صورتِ `relative` تمام‌عرض و در جریانِ عادی باز می‌شود و محتوا را پایین می‌راند).
  بدنهٔ `FreezeModal` اسکرول‌پذیر شد (`max-h-[62vh] overflow-y-auto` + اسکرول‌بارِ پنهان) و دو تاریخ‌گزین
  عمودی چیده شدند تا تقویمِ تمام‌عرض دقیقاً درونِ کادر باز شود — بدونِ بیرون‌زدن/بهم‌خوردنِ مودال.
- **۴) صفحهٔ پلن‌ها (سه اصلاح):**
  - تیک‌ها پشتِ‌سرهم از بالا: ویژگی‌ها با `featureRank` مرتب می‌شوند (فعال → به‌زودی → غیرفعالِ خط‌خورده).
  - «N روز مانده» از کارتِ پلن حذف شد (جای آن پروفایل/کیف‌پول است، نه صفحهٔ مقایسه).
  - محافظتِ downgrade (DECISION-076) دیگر **ساختارِ کارت را تغییر نمی‌دهد**؛ دکمه همیشه «خرید/تمدید»
    است و فقط هنگامِ کلیک، پیامِ toast («پلنِ فعلیِ تو بالاتر است…») نمایش داده می‌شود. enforcement
    واقعی همچنان سمتِ سرور است (APIهای خرید) — بدونِ تغییرِ امنیت.
- **۵) نمایشِ «کد ارسال‌شده به X» در OTP:** از حالتِ بیرون‌زده با `-mt-2` و زیرخطِ نقطه‌چین درآمد؛ حالا
  درونِ کادر، با شمارهٔ فارسیِ LTR + لینکِ مجزای «تغییر شماره».
- **۶) کندی/قفلِ ظاهریِ onboarding:** علتِ ریشه‌ای، تأخیرِ کامپایلِ on-demandِ مسیرِ تازه در dev بود
  (نه قفلِ کد: proxy مسیر را مجاز می‌کند، `getAiConfig` فقط خواندنِ cacheدارِ DB است، AmbientField
  `pointer-events:none` دارد). مهارسازی: `app/onboarding/loading.tsx` (نشانگرِ «در حال آماده‌سازی…»)
  + موازی‌سازیِ awaitهای سرور (`Promise.all`).
- **هم‌ترازی:** رنگِ فریز در پنل ادمین هم‌زمان به‌روزرسانی شد؛ محافظتِ downgrade سمتِ سرور دست‌نخورده؛
  هیچ ساختار/کوئریِ موجود مخرب تغییر نکرد (فقط افزایشی).
- **پیامدها:** ورودی‌ها پیش از ارسال اعتبارسنجی می‌شوند؛ فریز هویتِ رنگیِ واحد (mist) دارد؛ کارت‌های پلن
  ثابت‌اند؛ تقویمِ فریز درونِ مودال می‌ماند.

---

### DECISION-086 | فیچر onboarding (سفرِ رواییِ تمام‌صفحه) + سه رفعِ ایراد
- **تاریخ:** ۲۰۲۶-۰۶-۱۴
- **وضعیت:** ✅ تأیید شده (پیاده‌سازی‌شده)
- **زمینه:** کاربرِ تازه‌وارد بدونِ هیچ راهنمایی مستقیم وارد داشبورد می‌شد. هم‌زمان سه ایرادِ مرتبط با تجربهٔ ورود وجود داشت. تصمیم‌های طراحی با پرسشِ ویژوال از صاحب پروژه قطعی شد (بنچ‌مارک: Calm/Headspace/Notion + best practice ۲۰۲۶).
- **تصمیم‌های قطعی‌شده (پرسش ویژوال):**
  1. **قالب:** سفرِ رواییِ تمام‌صفحه (نه تورِ tooltip، نه چک‌لیست) — سازگارترین با اصلِ «سکوت بصری».
  2. **شخصی‌سازی:** فقط هویت — نامِ کاربر + نامِ همدم (بدون پرسشِ هدف/نیت، ضدِ Task Manager).
  3. **پایان:** هدایتِ نرم به اولین تعهد (best practice: اولین اقدامِ معنادار < ۶۰ ثانیه).
- **معماری onboarding:**
  - فیلدِ `onboardedAt DateTime?` روی `User` (migration با `db push` + **backfillِ همهٔ کاربرانِ موجود به now**) — تا فقط کاربرانِ واقعاً جدید (null) وارد سفر شوند و کاربرانِ قدیمی مختل نشوند.
  - `/onboarding` (Server Component) با گاردِ «اگر onboardedAt ست است → /dashboard» + خواندنِ نامِ پیش‌فرضِ همدم از تنظیماتِ ادمین (هم‌ترازی).
  - `OnboardingFlow` (Client): ۴ پرده با گذارِ نرم، قابلِ رد شدن در هر پرده (بی‌فشار)، نقطه‌های پیشرفت، قانونِ متنِ دکمه (DECISION-053).
  - `POST /api/onboarding/complete`: ذخیرهٔ نام‌ها (اعتبارسنجی هم‌تراز با `/api/profile`) + ست‌کردنِ `onboardedAt` (حتی هنگامِ رد شدن).
  - **روتینگِ کاربرِ نو:** `verify-otp` فیلدِ `isNew` (= `onboardedAt === null`) برمی‌گرداند → `/login` کاربرِ نو را به `/onboarding` می‌برد. مسیرِ ایمیل: صفحهٔ پروفایل پس از ست‌شدنِ رمز و وقتی `onboardedAt` null است → `/onboarding` (یکپارچه).
  - **راهنماییِ یک‌بارهٔ داشبورد:** `sessionStorage.hamsoo_welcome_hint` در پایانِ سفر ست می‌شود؛ `EntryForm` آن‌را یک‌بار نشان داده و پاک می‌کند.
- **سه رفعِ ایراد (هم‌بسته):**
  1. **مودالِ فریز تمام‌صفحه نمی‌شد:** ریشه = `animate-fade-up` با `fill-mode:both` روی wrapperِ `max-w-lg` یک `transform` دائمی نگه می‌داشت → containing block برای `position:fixed` → مودال در کادرِ کارت حبس می‌شد. **راه‌حل:** کامپوننتِ `Portal` (createPortal به body) + رندرِ `FreezeModal` از Portal. (قابلِ استفادهٔ مجدد برای مودال‌های آینده.)
  2. **نامِ کاربر در پیامِ خوش‌آمدِ همدم:** placeholderِ `{{USER}}` به templateِ خوش‌آمد افزوده شد + `renderWelcome` نامِ کاربر را با حذفِ آرامِ placeholder هنگامِ نبودِ نام جایگزین می‌کند. **هم‌ترازی پنل:** فهرستِ placeholderهای مجاز در `AiSettingsForm` و `admin-catalog` به‌روزرسانی شد (ادمین می‌تواند از `{{USER}}` استفاده کند). fallbackِ کلاینت (`ChatWindow` ← `ChatFAB` ← `layout`) هم نامِ کاربر را می‌گیرد.
  3. **کاربرِ OTP تازه‌وارد → onboarding (مثلِ ایمیل):** پوشش‌داده‌شده در روتینگِ بالا.
- **هم‌ترازی:** نامِ پیش‌فرضِ همدم در onboarding از همان configِ ادمین می‌آید؛ `{{USER}}` در پنلِ AI قابلِ استفاده است؛ هیچ مسیر/کوئریِ موجودی مخرب تغییر نکرد (فقط افزایشی + backfillِ ایمن).
- **پیامدها:** فقط کاربرانِ جدید سفر را می‌بینند. سفر کاملاً قابلِ رد شدن است (بی‌فشار، on-brand). در prod هیچ ابزارِ devای درگیر نیست.
- **سند تکمیلی:** `docs/features/onboarding.md`.

---

### DECISION-085 | پیوند اختیاری موبایل در مودالِ تنظیم رمز عبور (رفعِ تکرارِ حساب)
- **تاریخ:** ۲۰۲۶-۰۶-۱۳
- **وضعیت:** ✅ تأیید شده (پیاده‌سازی‌شده)
- **زمینه:** کاربران ایرانی می‌توانند هم با ایمیل و هم با موبایل (OTP) ثبت‌نام و وارد شوند. اگر کاربری ابتدا با ایمیل ثبت‌نام می‌کرد و سپس با موبایل وارد می‌شد، سیستم چون شماره موبایل آن‌را نمی‌شناخت یک حساب جدید می‌ساخت → تجربهٔ کاربری بد + از دست رفتن داده.
- **الگوی انتخاب‌شده:** «پیوند پیشگیرانه در لحظهٔ مناسب» — بلافاصله پس از تأیید ایمیل و ثبت رمز عبور، مودال یک مرحلهٔ اختیاری برای پیوند موبایل نشان می‌دهد. این لحظه بهترین زمان برای این کار است چون:
  - کاربر تازه ایمیلش را تأیید کرده و در فضای «تکمیل پروفایل» است.
  - اختیاری است — هیچ اجباری وجود ندارد و می‌توان از تنظیمات هم اضافه کرد.
  - جریانِ OTP برای کاربران خارج از ایران نمایش داده نمی‌شود (گارد در UI).
- **پیاده‌سازی:**
  - `SetPasswordModal.tsx` — به دو مرحله تقسیم شد:
    - مرحله ۱ (موجود): رمز عبور + نام کاربری
    - مرحله ۲ (جدید، اختیاری): ورود شماره → ارسال OTP → تأیید کد → پیوند
  - API routes: از روت‌های موجود `POST /api/account/phone/request-code` و `POST /api/account/phone/verify` (DECISION-059) استفاده می‌شود — بدون کد جدید.
  - هشدار SMS: پیامِ صریح درباره مسدودبودن پیامک‌های ناشناس در UI نمایش داده می‌شود.
  - «رد کردن» همیشه قابل دسترس است — هم در مرحلهٔ ورود شماره، هم در مرحلهٔ OTP.
- **امنیت:** روت‌های `phone/request-code` و `phone/verify` نیاز به session دارند + تشخیص تعارض (موبایل متعلق به کاربر دیگر) → بدون خطر ادغام ناخواسته.
- **پیامدها:** کاربران ایرانی که از ایمیل شروع می‌کنند می‌توانند همان لحظه موبایل اضافه کنند و از تکرار حساب جلوگیری می‌شود.

---

### DECISION-084 | بازطراحی قالب‌های ایمیل + رفعِ deliverability
- **تاریخ:** ۲۰۲۶-۰۶-۱۳
- **وضعیت:** ✅ تأیید شده (پیاده‌سازی‌شده)
- **زمینه:** قالب‌های ایمیل ارسالی به کاربر سه ایراد داشتند: (۱) ایمیل ثبت‌نام محتوای «فعال‌سازی حساب» نداشت و عنوان عمومی «تأیید ایمیل» داشت. (۲) هیچ نسخهٔ text/plain همراه HTML ارسال نمی‌شد — یکی از بزرگ‌ترین عوامل spam-filter. (۳) دکمهٔ DEV در UI برای تستِ ایمیل موجود بود در حالی که تست‌ها باید واقعی باشند.
- **ریشهٔ spam در Yahoo:** لینک‌های ایمیل از طریق click-tracking Resend بازنویسی می‌شوند → دامنهٔ ناشناخته در لینک → Yahoo آن‌را spam می‌داند. همچنین در dev، آدرس‌ها `localhost:3000` بودند.
- **تصمیم‌های کدی:**
  1. `ResendEmailAdapter` کامل بازنویسی شد: قالب جداگانه برای هر نوع ایمیل (activation, reset, code, message) + نسخهٔ `text` (plain-text) برای هر send.
  2. ایمیل فعال‌سازی: عنوان «فعال‌سازی حساب کاربری»، پیام خوش‌آمد، CTA «فعال‌سازی حساب».
  3. ایمیل بازیابی رمز: CTA «تنظیم رمز جدید»، توضیح ۱ ساعته.
  4. پوستهٔ مشترک `shell()`: لوگوی همسو (badge تیره) + کارت سفید + footer. RTL کامل با `<!DOCTYPE html PUBLIC ...>` برای سازگاری بیشتر.
  5. دکمهٔ `[DEV] باز کردن لینک تأیید` از `/login` و `[DEV] باز کردن لینک بازیابی` از `/forgot-password` حذف شدند.
- **اقداماتِ خارج از کد (لازم برای رفعِ spam):**
  - **الف) غیرفعال‌کردنِ click tracking در Resend:** داشبورد Resend → Domains → دامنهٔ hamsoo.app → «Click Tracking: Off». بدون این، Resend لینک‌ها را از طریق دامنهٔ tracking بازنویسی می‌کند.
  - **ب) تأیید دامنه در Resend + SPF/DKIM/DMARC:** در DNS دامنهٔ hamsoo.app باید ۳ رکورد اضافه شوند (Resend آن‌ها را در داشبورد نشان می‌دهد). بدون DKIM، Yahoo/Gmail ایمیل را unsigned می‌بیند.
  - **ج) تنظیم `NEXT_PUBLIC_APP_URL`:** در محیط production باید `https://hamsoo.app` باشد (نه localhost) تا لینک‌های ایمیل URL واقعی داشته باشند.
- **پیامدها:** تست با ایمیل واقعی از این پس بدون دکمهٔ dev انجام می‌شود. plain text باعث بهبود قابلِ توجه deliverability می‌شود. رفعِ کامل spam نیازمند اقداماتِ DNS + Resend dashboard است.

---

### DECISION-083 | فیچر «فریز» — قابلیت توقف موقتِ مسیرِ روزانه
- **تاریخ:** ۲۰۲۶-۰۶-۱۳
- **وضعیت:** ✅ تأیید شده (پیاده‌سازی‌شده)
- **زمینه:** کاربر ممکن است بازه‌ای از پیش بداند که تعهد روزانه برایش ممکن نیست (مسافرت، امتحانات، …). مدلِ فعلی این بازه را به‌عنوانِ «گپ» (شکست) ثبت می‌کرد — که ناعادلانه بود و با مانیفستِ «بدون قضاوت» تعارض داشت.
- **تصمیم:** توسعهٔ مدلِ `GapRecord` با فیلدِ `type: "gap" | "freeze"`:
  - **gap:** واکنشی، سرور بعد از شناسایی فاصله ایجاد می‌کند، با فرمِ توضیح.
  - **freeze:** پیشگیرانه، کاربر از قبل بازه می‌دهد (از امروز تا حداکثر ۶۰ روز آینده)، با دلیلِ اختیاری.
- **پیاده‌سازی:**
  - `prisma/schema.prisma` — فیلدِ `type String @default("gap")` + ایندکسِ `[userId, type]` روی `GapRecord`. `db push` ✅.
  - `src/types/gap.ts` — اینترفیسِ `ActiveFreeze` و `CreateFreezeInput`.
  - `src/types/weekly-report.ts` — `DayState` += `"freeze"`؛ `WeeklyMetrics` += `freezeDays: number`.
  - `src/lib/reports/weekly-analysis.ts` — `RawFreeze`، `isFreezeDay()`، اسکلتِ هفته و متریک‌ها از freeze آگاهند.
  - `src/lib/ai/roles/weekly-report/schema.ts` — `freeze` به enum افزوده شد.
  - `src/lib/notifications/catalog.ts` — نوعِ `"freeze.ended"` اضافه شد (بدون migration).
  - `src/app/api/freeze/route.ts` + `src/app/api/freeze/[id]/route.ts` — GET/POST/DELETE.
  - `src/components/features/freeze/` — `FreezeModal`, `FreezeActiveBanner`, `FreezePill`.
  - `src/app/dashboard/page.tsx` — تشخیصِ freeze فعال + lazy end-notification + gap-detection هوشمند (truncate تا قبل از freeze).
  - `src/app/api/reports/weekly/route.ts` — gap و freeze جداگانه کوئری می‌شوند.
  - `src/app/admin/(panel)/users/[id]/page.tsx` — نمایشِ freeze فعال (admin parity).
  - `prompts/weekly-report/v3.fa.md` — توضیحِ وضعیتِ `freeze` برای AI.
  - همهٔ `Record<DayState, ...>` در کامپوننت‌های گزارش به `freeze` گسترش یافتند.
- **رفتارِ هوشمند:**
  - **لغوِ زودهنگام:** اگر freeze هنوز شروع نشده → حذفِ کامل. اگر فعال → `toDate = دیروز` (روزهای گذشتهٔ freeze حفظ می‌شوند).
  - **تشخیصِ gap آگاه از freeze:** اگر freeze‌ای در بازهٔ gap احتمالی شروع شود، gap تا قبل از freeze کوتاه می‌شود.
  - **Lazy end-notification:** روزِ بعد از پایانِ freeze، اولین بارِ باز کردنِ داشبورد اعلانِ `freeze.ended` ایجاد می‌کند (dedup با کوئریِ notification).
  - **AI:** روزهای freeze با دلیل → اشاره‌ٔ کوتاه؛ بدون دلیل → کاملاً نادیده گرفته می‌شوند.
- **محدودیت‌ها:** از امروز به بعد، max ۶۰ روز، بدون overlap با freeze فعال دیگر.
- **مانیفستِ همسو:** روزهای freeze نه در گپ‌ها حساب می‌شوند نه در streak/score. بدون قضاوت.

---

*هر تصمیم جدید باید به این فایل اضافه شود — نه به TASKS.md یا CLAUDE.md*

