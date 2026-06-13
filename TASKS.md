# TASKS.md — وظایف پروژه همسو

> این فایل منبع حقیقت وظایف است.
> Claude Code باید پیش از هر اقدامی این فایل را بخواند و پس از اتمام هر وظیفه آن را آپدیت کند.

---

## ⭐ اصل ماندگار — هم‌ترازی ادمین ↔ پروژه (Admin/Project Parity)

> **دستور صریح صاحب پروژه (۲۰۲۶-۰۵-۳۰):** هر فیچری که در پنل ادمین پیاده می‌شود **باید** نقطهٔ متناظرش در سمت پروژه (اپ کاربر) هندل شود و بالعکس.
> مثال: تغییر دستی پلن کاربر به PRO در پنل → دسترسی‌های PRO در پروژه برای آن کاربر فعال شود.
> **قبل از «تمام شد» گفتن هر فیچر، چک‌لیست دوطرفه را تأیید کن.** (حافظه: feedback-admin-project-parity)

---

## 🗺️ جدول کارهای باقی‌مانده (اولویت‌بندی‌شده) — ۲۰۲۶-۰۶-۱۰

> برگرفته از جلسه مرور وضعیت + بررسی گپ‌های حیاتی پیش از رشد.
> هر تسک پس از شروع به بخش «وظیفه جاری» منتقل می‌شود.

| # | تسک | نوع | اولویت | وضعیت | وابستگی | تخمین | یادداشت |
|---|-----|-----|--------|--------|---------|--------|---------|
| ۰ | TASK-UI-FIXES-063 | اصلاح باگ | ✅ | ✅ تمام | — | — | مسیریابی + کارت کیف‌پول + سال شمسی + کارت پشتیبانی + رسید — ۲۰۲۶-۰۶-۰۸ |
| ۱ | TASK-AUTH-RECOVERY | رفع گپ حیاتی | 🔴 Critical | ✅ تمام | multi-auth ✅ | روز ۱~ | تأیید ایمیل با لینک + بازیابی رمز؛ محصول بدون آن قابل عرضه نبود — ۲۰۲۶-۰۶-۰۸ |
| ۲ | Email Provider واقعی | زیرساخت | 🔴 Critical | ✅ تمام | EmailAdapter ✅ | روز ۱~ | Resend + پنل /admin/email + مهاجرت ۵ route؛ Mock حذف شد — ۲۰۲۶-۰۶-۰۹ |
| ۳ | درگاه پرداخت | فیچر | 🔴 Critical | ✅ تمام | wallet ✅ | — | ZarinPal (DECISION-071) — Adapter + کانفیگ DB/پنل + شارژِ اتمیک idempotent + Mock در dev؛ merchant_id در prod از پنل — ۲۰۲۶-۰۶-۱۲ |
| ۴ | Onboarding Flow | فیچر جدید ✨ | 🟠 High | ⏳ شروع نشده | multi-auth ✅ | روز ۱.۵~ | کاربر جدید بدون راهنما وارد می‌شود — رفع خلأ فعال‌سازی اول پایین |
| ۵ | موبایل‌سازی + PWA | فیچر | 🟠 High | ⏳ شروع نشده | — | روز ۲~ | نصب روی گوشی ممکن نیست؛ PWA بازار ایران موبایل‌محور است؛ بدون وابستگی |
| ۶ | یادآوری‌ها (موج ۲) | فیچر | 🟠 High | ⏳ شروع نشده | notifications-core ✅ | روز ۳~ | زیرساخت آماده است + scheduler باقی است؛ صفحه تنظیمات فقط |
| ۷ | اشتراک گزارش هفتگی | فیچر | 🟡 Medium | ⏳ شروع نشده | weekly-v3 ✅ | روز ۱~ | برای جذب کاربر جدید؛ لینک عمومی با token؛ viral loop |
| ۸ | ادمین KPI داشبورد | فیچر | 🟡 Medium | ⏳ شروع نشده | admin ✅ | روز ۱.۵~ | ثبت‌نام · توزیع پلن · درآمد؛ DAU تصمیم‌گیری داده‌محور |
| ۹ | SMS production | زیرساخت | 🟡 Medium | 🔶 نیمه‌کاره | smsir-adapter ✅ | ساعت ۲~ | آداپتر + پنل ساخته شده؛ فقط کلید production + تأیید نام پارامتر قالب |
| ۱۰ | i18n (چندزبانگی) | زیرساخت | 🟡 Medium | ⏳ شروع نشده | — | روز ۳~ | استخراج رشته‌ها + next-intl — هر چه دیرتر سخت‌تر |
| ۱۱ | AI تحلیل الگو | فیچر | 🟡 Medium | ⏳ موکول | pattern-insight ✅ | ماه ۳+ | بدون داده کاربری واقعی ممکن نیست |
| ۱۲ | بلاگ همسو + کامنت | فیچر ✨ | 🟠 High | ✅ تمام | — | — | DECISION-065 — بلاگ کامل (دسته/برچسب/کاور/لایک/اشتراک/لینک کوتاه/بازدید) + کامنت با تأیید ادمین + پنل — ۲۰۲۶-۰۶-۱۰ |
| ۱۳ | CMS محتوای صفحات (فاز ۲) | فیچر ✨ | 🟠 High | ✅ تمام | — | — | DECISION-066 — کنترل ۵ صفحه از پنل با مدل Override (ویرایش/فونت/ترتیب/نمایش/افزودن-حذف + پیش‌نویس→پیش‌نمایش→انتشار) — ۲۰۲۶-۰۶-۱۰ |
| ۱۴ | CMS — پیش‌نمایش موبایل ویرایشگر | بهبود | 🟢 Low | ⏳ شروع نشده | DECISION-066 ✅ | ساعت ۴~ | ویرایشگر `/admin/content` فعلاً دسکتاپ‌محور است؛ پشتیبانی RTL/جهت و چیدمان در نمای موبایل |
| ۱۵ | CMS — نوع فیلد ساختاریافته | بهبود | 🟢 Low | ⏳ شروع نشده | DECISION-066 ✅ | روز ۱~ | جدول/CTA/تصویرِ واقعی به‌جای کنوانسیون «عنوان — مقدار» در فیلدهای list (برای محتوای پیچیده‌تر) |
| ۱۶ | دارک مود سراسری «شبِ گرم» | فیچر ✨ | 🟠 High | ✅ تمام | — | — | DECISION-067 — سایت + اپ + پنل ادمین؛ توگل ۳حالته بدون فلش؛ پالت زغالی گرم — ۲۰۲۶-۰۶-۱۰ |
| ۱۷ | ری‌دیزاین بلاگ (سایدبار + TOC) | فیچر ✨ | 🟠 High | ✅ تمام | DECISION-065 ✅ | — | DECISION-068 — سایدبار شیشه‌ای (جستجو/دسته/خواندنی‌ترین/برچسب) + TOC چسبان + نوار پیشرفت — ۲۰۲۶-۰۶-۱۰ |
| ۱۸ | ادیتور حرفه‌ای مقاله (Tiptap) | فیچر ✨ | 🟠 High | ✅ تمام | DECISION-065 ✅ | — | DECISION-069 — WYSIWYG با خروجی Markdown؛ DB و رندر سایت دست‌نخورده؛ درج تصویر base64 — ۲۰۲۶-۰۶-۱۰ |
| ۱۹ | ری‌دیزاین تایپوگرافی استاتیک | بهبود ✨ | 🟠 High | ✅ تمام | DECISION-066 ✅ | — | DECISION-070 — مقیاس آرام‌تر (~۳۵٪ کوچک‌تر) در ۵ صفحهٔ CMS + بلاگ؛ overrideهای DB مقدم‌اند — ۲۰۲۶-۰۶-۱۰ |
| ۲۰ | فرم تماس + کپچای اختصاصی | فیچر ✨ | 🟠 High | ✅ تمام | CMS ✅ | — | DECISION-072 — کپچای SVG/HMAC بدون گوگل + مدل ContactMessage + پنل «پیام‌های تماس» (badge) + سوشال مونوکروم — ۲۰۲۶-۰۶-۱۲ |
| ۲۱ | خرید مستقیم پلن از درگاه | فیچر ✨ | 🔴 Critical | ✅ تمام | DECISION-071 ✅ | — | DECISION-073 — checkout/callback مستقل از کیف‌پول + مودال دو روشه + PlanReturnToast؛ متن‌های «به‌زودی» حذف — ۲۰۲۶-۰۶-۱۲ |
| ۲۲ | شمارش تعهد بدون روزهای گپ | اصلاح | 🟠 High | ✅ تمام | — | — | DECISION-074 — helper مشترک `lib/stats/commitments` در پروفایل + لیست/جزئیات کاربر پنل؛ گیت تیکت/چت پنل با planAllows — ۲۰۲۶-۰۶-۱۲ |
| ۲۳ | بستهٔ اصلاحات UI/UX سراسری | بهبود ✨ | 🟠 High | ✅ تمام | — | — | DECISION-075 — nav یکدست + تم چپ-بالا + فوتر ۴ستونه (e-Namad/زرین‌پال هم‌سایز) + بلاگ کاشی/لیستی + کامنت کارتی gray-out + لاگین نرم + badge زنگوله + مودال «اشتراک‌گذاری و دانلود» — ۲۰۲۶-۰۶-۱۲ |
| ۲۴ | برنامه‌ریزی (هدف + همراه) | فیچر ✨ | 🔴 Critical | ✅ تمام | AI-arch ✅ | — | DECISION-082 — سفرِ یک‌هدفی + استوریِ روایی + استوری‌بوردِ افقی + کوچِ AI «همراه» (Pro، نقش goal-companion) + زمان‌بندِ یادآوری (cron + dev) + گیت پلن + هم‌ترازی پنل — ۲۰۲۶-۰۶-۱۳ |
| ۲۵ | اصلاحات صفحهٔ «برنامه‌ریزی» | اصلاح | ✅ | ✅ تمام | — | — | یک‌استوری‌در‌روز + ویرایشِ فقط-روزِ‌اول + مودالِ حذف دوگزینه‌ای + همراه از روز ۲ + DayCard ری‌دیزاین + مودال‌های بدون اسکرول‌بار + DevDataPanel حذف + cleanup دیتابیس — ۲۰۲۶-۰۶-۱۳ |
| ۲۶ | فریزِ مسیرِ روزانه | فیچر ✨ | 🟠 High | ✅ تمام | — | — | DECISION-083 — توقفِ موقتِ پیشگیرانه با بازه + دلیل؛ FreezePill + FreezeModal + FreezeActiveBanner + API; gap هوشمند + lazy notif + هم‌ترازی پنل + گزارشِ هفتگی آگاه از freeze — ۲۰۲۶-۰۶-۱۳ |

---

### TASK-AUTH-RECOVERY | تأیید ایمیل با لینک + بازیابی رمز — ✅ تمام (۲۰۲۶-۰۶-۰۸)

- **تأیید ایمیل لینکی:** ثبت‌نام ایمیلی اکنون لینک ارسال می‌کند (توکن ۳۲-بایتی، ۲۴ ساعت). صفحهٔ `/verify-email` توکن را خودکار تأیید و کاربر را به داشبورد هدایت می‌کند.
- **بازیابی رمز:** `/forgot-password` ایمیل یا نام‌کاربری می‌گیرد؛ لینک بازیابی یک‌ساعته به ایمیل ارسال می‌شود. `/reset-password` رمز جدید را می‌گیرد.
- **EmailAdapter:** دو متد جدید `sendVerificationLink` + `sendPasswordResetLink` افزوده شد.
- **بدون migration:** توکن‌ها با `purpose: "reset-password"|"signup"` در مدل `EmailCode` ذخیره می‌شوند.
- **admin parity:** `/admin/users/[id]` — badge وضعیت ایمیل + «تأیید دستی» + «ارسال لینک بازیابی». API routes + audit log.
- **permission جدید:** `users.write` به catalog افزوده شد (seed idempotent).
- `tsc` ✅ · `next build` ✅.

---

### TASK-EMAIL-PROVIDER | Email Provider واقعی — ✅ تمام (۲۰۲۶-۰۶-۰۹)

- **Provider:** Resend — کلید در `.env.local`، فرستنده `noreply@hamsoo.app`
- **معماری:** آینهٔ دقیق SMS (DECISION-061) — ساختار، cache، factory، golden rule همه یکسان
- **ساب‌تسک‌ها:**
  - [x] `src/lib/adapters/resend-email.adapter.ts` — `ResendEmailAdapter` با HTML templates
  - [x] `getEmailAdapterForService()` factory در `src/lib/adapters/index.ts`
  - [x] `EmailService`/`EmailLog` در `prisma/schema.prisma` — `db push` ✅
  - [x] `src/lib/email/services.ts` — resolver با TTL 10s
  - [x] `src/lib/email/send.ts` — تنها نقطهٔ ارسال (golden rule)
  - [x] `/admin/email` — بنر سرویس فعال + CRUD + ارسال تستی + تاریخچه
  - [x] ۵ API route مهاجرت‌یافته به `email/send.ts`
  - [x] RBAC: `email.read` / `email.send` / `email.manage` (seed idempotent)
  - [x] بازیابی رمز فقط با ایمیل (حذف شاخهٔ username)
- `tsc` ✅ · `db push` ✅ · `seed` ✅

---

### TASK-GATEWAY | درگاه پرداخت — ✅ تمام (۲۰۲۶-۰۶-۱۲)

- **Provider:** ZarinPal (API v4) + Mock برای آفلاین — DECISION-071
- **پیاده‌شده:** `PaymentAdapter` interface + `ZarinpalAdapter`/`MockPaymentAdapter` · کانفیگ DB/پنل (`PaymentGateway` + `PaymentGatewayManager`) · شارژ آنلاین کیف‌پول (`/api/wallet/topup/{gateway,callback}`، اتمیک/idempotent) · `WalletReturnToast`
- **تکمیل (DECISION-073):** خرید مستقیم پلن از درگاه، مستقل از کیف‌پول — `/api/plans/checkout/{gateway,callback}` + مودال دو روشه در `/plans` + `PlanReturnToast`

---

### TASK-CONTACT-FORM | فرم تماس + کپچای اختصاصی + پنل پیام‌ها — ✅ تمام (۲۰۲۶-۰۶-۱۲ — DECISION-072)

- [x] کپچای اختصاصی stateless (`lib/captcha/captcha.ts`) — SVG ارقام فارسی + نویز؛ HMAC + انقضا؛ بدون سرویس گوگل
- [x] مدل `ContactMessage` (db push با تأیید مالک) + `POST /api/contact` (honeypot + کپچا + سقف نرخ per-IP)
- [x] سکشن CMS `contact-form` جایگزین کارت رنگی قدیمی + `SocialLinks` مونوکروم زیر فرم
- [x] پنل `/admin/contact` (permission `support.read`) + تب‌های وضعیت + badge «پیام‌های تماس» در سایدبار/nav-counts
- `db push` ✅ · `tsc` ✅ · `build` ✅ · تست API ۷/۷ ✅

---

### TASK-UI-BATCH-075 | بستهٔ اصلاحات UI/UX سراسری — ✅ تمام (۲۰۲۶-۰۶-۱۲ — DECISION-075)

- [x] تم‌تاگل = آخرین آیتم گوشهٔ چپ-بالا (LandingNav + AppNav) · nav قبل از ورود یکدست: صفحه اصلی/درباره ما/تماس با ما/بلاگ · لوگو بزرگ‌تر (هشدار next/image رفع شد)
- [x] فوتر ۴ ستونه: برند+شعار+سوشال · محصول · لینک‌های مفید · مجوزها (e-Namad + زرین‌پال هم‌سایز — `TrustBadges`)
- [x] «خط قرمز» درباره ما → گرید دو ستونهٔ فشرده
- [x] بلاگ: `PostsExplorer` کاشی/لیستی + ذخیرهٔ ترجیح در localStorage؛ کارت شاخص بزرگ حذف
- [x] مقاله: کاور هم‌عرض متن (سقف ۳۸۰px) + متن justify + سایدبار غنی (TOC/خواندنی‌ترین/برچسب)
- [x] کامنت‌ها: کارتی مدرن راست‌چین + ریپلای + **gray-out کامنت خود کاربر تا تأیید ادمین** (localStorage per-slug)
- [x] لاگین: `SmoothHeight` — سوییچ تب‌ها بدون پرش
- [x] زنگوله: badge با باز شدن پنل فوراً صفر می‌شود (read-all)
- [x] مودال گزارش: «اشتراک‌گذاری و دانلود» + قفل کامل اسکرول پس‌زمینه
- [x] آمار تعهد بدون روزهای گپ (DECISION-074) + گیت تیکت/چت پنل با `planAllows` (هم‌ترازی)
- `tsc` ✅ · `build` ✅

---

### TASK-GOAL-PLANNING | فیچر «برنامه‌ریزی» — سفرِ یک‌هدفی + کوچِ «همراه» (DECISION-082) — ✅ تمام (۲۰۲۶-۰۶-۱۳)

- **منبع:** خواستِ صاحب پروژه (فیچرِ محوری) + پرسشِ ویژوال. جایگزینِ DECISION-024. migration با `db push` (تأییدِ مالک).
- **گاردهای ضدِ Task Manager:** یک هدفِ فعال، بدون sub-task/استریک/درصد؛ استوری = روایتِ قابل‌ویرایش؛ هستهٔ روزانه دست‌نخورده.
- **فاز A — مدل + گیت:**
  - [x] schema: `Goal`/`GoalStory`/`GoalCompanionInsight`/`GoalReminder` + relation `goals` روی User + `db push`
  - [x] feature keys `goal.planning`(همه)/`goal.companion`(Pro) در `plans/features.ts` + گروهِ «برنامه‌ریزی» + seed idempotentِ ردیف‌های غایب
- **فاز B — نقشِ همراه:**
  - [x] `prompts/goal-companion/v1.fa.md` (jsonMode، خط‌قرمزهای §۸) + schema/index + register در bootstrap + ردیف در `AI_ROLES_ADMIN`
- **فاز C — API:**
  - [x] `/api/goal` (GET/POST، یک فعال، شروع≥امروز) · `/api/goal/[id]` (edit/complete/abandon) · `/story` + `/story/[id]` · `/companion` (Pro+پنجره+روزی‌یک‌بار، ۵۰۳ محترمانه) · `/reminder` (PUT)
  - [x] `lib/goal/dates.ts` (روزشماری/پنجرهٔ همراه) + `lib/goal/server.ts` (نمای فعال + lazy-completion)
- **فاز D — زمان‌بند:**
  - [x] `lib/goal/reminder-scheduler.ts::runReminderTick` (getNow/iranClock) + `/api/cron/reminders` (CRON_SECRET، GET/POST، Bearer/header/query) + `vercel.json` + `/api/dev/goal/reminder-tick` + دکمه در DevSeedPanel
  - [x] کاتالوگِ نوتیف: `goal.reminder`/`goal.companion.ready`/`goal.completed` + آیکنِ `goal` در NotifIcon + ایمیلِ `sendGoalReminderEmail`
- **فاز E — UI:**
  - [x] `/goal` (CreateForm یا Storyboard) + `/goal/history` + آیتمِ «برنامه‌ریزی» در AppNav
  - [x] کامپوننت‌ها: `GoalCreateForm`/`GoalHeader`/`StoryComposer`/`CompanionPanel`/`DayCard`/`DayDetailModal`/`ReminderSettingsModal`/`GoalStoryboard` + `lib/goal/storyboard.ts`
  - [x] استوری‌بوردِ افقی + خطِ زمانیِ ظریف؛ JalaliDatePicker؛ متنِ دکمه ثابت + Spinner + toast (DECISION-053)
- **فاز F — هم‌ترازی + مستندات:**
  - [x] `/admin/plans` (گیتِ goal.*) + `/admin/ai` و `/admin/ai/prompts/goal-companion` خودکار (کاتالوگ‌محور)
  - [x] نمای هدفِ کاربر در پنل عمداً اضافه نشد (حریم‌خصوصی §۷)
  - [x] DECISIONS-082 + docs/features/goal-planning.md + CLAUDE §۸ + PROGRESS
  - [x] `tsc --noEmit` ✅ · `next build` ✅
- **هم‌ترازی:** تغییرِ پلن به PRO → دسترسیِ «همراه» فوری؛ روشن/خاموش‌کردنِ goal.* از پنل بلافاصله enforce می‌شود.
- **خارج از scope (آینده):** اشتراکِ لینکیِ تک‌استوری + فیدِ عمومی (موکول به شبکهٔ اجتماعی)؛ ویرایشِ عنوان/تمدیدِ هدف از UI (API آماده است).

---

### TASK-ONBOARDING | جریان ورود اول (Onboarding Flow) — ⏳ شروع نشده

- **اولویت:** 🟠 High — تأییدشده؛ ۳ مرحله ساده
- **وابستگی:** TASK-AUTH-MULTI ✅
- **schema (migration لازم):** `User.onboardingCompletedAt DateTime?`
- **جریان پیشنهادی:**
  - مرحله ۱ — «همسو چیست؟» (توضیح کوتاه؛ بدون scroll; ۲ پاراگراف)
  - مرحله ۲ — «اسمت چیه؟» (ست displayName؛ اختیاری‌بودن تأکید شود)
  - مرحله ۳ — «اولین تعهدت» (EntryForm ساده‌شده؛ CTA به داشبورد)
- **middleware:** اگر لاگین + `!onboardingCompletedAt` → redirect به `/onboarding`
- **ساب‌تسک‌ها:**
  - [ ] migration: `onboardingCompletedAt` روی User
  - [ ] صفحه `/onboarding` با stepper ساده (بدون progress bar گیمیفای‌شده)
  - [ ] API `POST /api/account/complete-onboarding`
  - [ ] middleware redirect
  - [ ] skip option («بعداً»)

---

### TASK-PWA | PWA + بهینه‌سازی موبایل — ⏳ شروع نشده

- **اولویت:** 🟠 High — حیاتی برای بازار موبایل ایران
- **ساب‌تسک‌ها:**
  - [ ] `public/manifest.json` (نام/رنگ/آیکون فارسی)
  - [ ] آیکون‌های ۱۹۲/۵۱۲ px
  - [ ] `next.config.ts` → `next-pwa` یا custom SW
  - [ ] Service Worker: cache-first برای assets استاتیک + network-first برای API
  - [ ] صفحه offline (`/offline`) با لحن همسو
  - [ ] meta تگ‌های iOS (`apple-mobile-web-app-*`)
  - [ ] touch targets ≥ ۴۴px بررسی (audit)
  - [ ] viewport safe-area رعایت (notch/home indicator)
  - [ ] بنر «به صفحه اصلی اضافه کن» در داشبورد (یک‌بار + قابل بستن)

---

### TASK-NOTIF-WAVE2 | یادآوری‌های زمانی (موج ۲) — ⏳ شروع نشده

- **اولویت:** 🟠 High — زیرساخت آماده؛ فقط scheduler + UI باقی است
- **وابستگی:** TASK-NOTIF-CORE ✅ (catalog + createNotification آماده)
- **انواع یادآوری:**
  - «امروز تعهدت ثبت نشده» (ساعت قابل‌تنظیم)
  - «بازخورد تعهد دیروز منتظر است»
  - «گزارش هفتگی‌ات آماده است» (پس از generate)
  - «پلن ۳ روز دیگر تمام می‌شود» (✅ قبلاً ساخته شد)
- **تنظیمات کاربر:** `/settings/notifications` — کنترل per-type + ساعت یادآوری روزانه
- **scheduler:** Vercel Cron (یا `node-cron` برای self-host)
- **ساب‌تسک‌ها:**
  - [ ] `src/lib/notifications/scheduler.ts` — منطق بررسی + ارسال دسته‌ای
  - [ ] `POST /api/cron/daily-reminders` (با secret header)
  - [ ] Vercel Cron config در `vercel.json`
  - [ ] صفحه `/settings/notifications` با toggle per نوع + انتخاب ساعت
  - [ ] migration: `NotificationPreference` per کاربر

---

### TASK-SOCIAL-SHARE | اشتراک گزارش هفتگی — ⏳ شروع نشده

- **اولویت:** 🟡 Medium
- **وابستگی:** TASK-WEEKLY-V3 ✅
- **جریان:** دکمه «اشتراک» در گزارش → لینک عمومی با token یک‌بارمصرف (یا ۷ روز) → صفحه `/report/share/[token]` بدون نیاز به ورود
- **schema:** ستون `shareToken String?` + `sharedAt DateTime?` روی `WeeklyReport`
- **ساب‌تسک‌ها:**
  - [ ] `POST /api/reports/weekly/[id]/share` — generate token
  - [ ] `GET /api/reports/share/[token]` — بدون auth
  - [ ] صفحه `/report/share/[token]` — نمایش گزارش عمومی (بدون اطلاعات شخصی)
  - [ ] دکمه share در UI گزارش + کپی لینک

---

### TASK-ADMIN-KPI | داشبورد KPI ادمین — ⏳ شروع نشده

- **اولویت:** 🟡 Medium
- **وابستگی:** ادمین MVP ✅
- **متریک‌های اول:**
  - DAU (کاربران فعال روزانه — ثبت تعهد = active)
  - تعداد ثبت‌نام روزانه/هفتگی
  - توزیع پلن (FREE/PLUS/PRO)
  - نرخ تکمیل بازخورد
  - درآمد (تأیید topup × amount)
- **ساب‌تسک‌ها:**
  - [ ] `/api/admin/stats` — aggregate queries (بدون N+1)
  - [ ] `/admin/stats` — صفحه داشبورد با چارت‌های SVG دست‌ساز (مثل گزارش)
  - [ ] بازه زمانی: هفته/ماه/سه‌ماه

---

### TASK-I18N | زیرساخت چندزبانگی — ⏳ شروع نشده

- **اولویت:** 🟡 Medium — هر چه دیرتر سخت‌تر
- **پیشنهاد:** `next-intl` (بهترین DX با App Router)
- **قانون:** فارسی همیشه canonical؛ انگلیسی optional
- **ساب‌تسک‌ها:**
  - [ ] نصب و تنظیم `next-intl` با locale routing
  - [ ] استخراج string های موجود به `messages/fa.json`
  - [ ] LTR/RTL خودکار بر اساس locale
  - [ ] language switcher در settings

---

### TASK-AI-PATTERN | تحلیل الگو AI — ⏳ موکول

- **اولویت:** 🟡 Medium — نیاز به ۳+ ماه داده
- **وابستگی:** TASK-AI-ARCH ✅ + تاریخچه واقعی کاربران
- **نقش:** `pattern-insight` در Registry
- **شروع:** پس از اینکه کاربران واقعی ۳+ ماه داده داشتند

---

## 🔴 وظیفه جاری (In Progress)

### TASK-AUTH-MULTI | احراز هویتِ چندگانه (ایمیل/پسورد + نام‌کاربری) + بازطراحیِ آواتار (DECISION-057/058) — ✅ ۲۰۲۶-۰۶-۰۴
- **منبع:** درخواست صریح مالک (۳ تسک) + پاسخ به سوالات ویژوال. تأییدِ صریحِ migration.
- **تسک ۱ — آواتارِ تک‌رنگ (DECISION-057):**
  - [x] حذفِ پالت؛ رنگِ ثابتِ طلایی (`gold` #C19A4A) برای آواتارِ بدون‌عکس — سایت + پنل
  - [x] `avatarPresets.ts` → `AVATAR_COLOR`/`getAvatarColor`؛ نقاطِ نمایش به آن وصل شدند (بدون migration)
- **تسک ۲ — کراپِ تصویر (DECISION-057):**
  - [x] `AvatarCropModal` با `react-easy-crop` (دایره‌ای، زوم/چرخش)؛ خروجی ۵۱۲px JPEG ۰.۸۵
  - [x] اتصال به `AvatarSection` (سایت) و `AdminProfileForm` (پنل)؛ سقفِ API به ۲۵۰K
- **تسک ۳ — احراز هویتِ چندگانه (DECISION-058) — فقط سایت:**
  - [x] schema: `phone` اختیاری + `email`/`passwordHash`/`username`/`emailVerifiedAt` + مدلِ `EmailCode` (`db push`، بدون data-loss)
  - [x] session: `phone` اختیاری، هویت بر پایهٔ `userId`
  - [x] `EmailAdapter` + `MockEmailAdapter` + `getEmailAdapter()` (Adapter Pattern، dev-mock مثل OTP)
  - [x] APIها: `auth/email/request-code`+`verify`، `auth/login-password`، `account/credentials`، `account/email/*`
  - [x] UI: `login` با تبِ موبایل/ایمیل (ورود+ثبت‌نام)؛ بخشِ «امنیت و ورود» در `settings/account`
  - [x] سازگاریِ phone-nullable در صفحاتِ ادمین/پروفایل/حذف‌حساب · `tsc` ✅ · `next build` ✅
- **پالایشِ بازخوردِ مالک (DECISION-059):**
  - [x] کارتِ یکپارچهٔ «هویت و ورود» در پروفایل (موبایل/ایمیل/نام‌کاربری/رمز، ویرایشِ inline) — `IdentityCard`
  - [x] افزودنِ موبایل با OTP برای کاربرِ ایمیلی — `api/account/phone/*`
  - [x] نمایشِ `@username` در پروفایل و پنل · پنل: همهٔ فیلدهای کاربر حتی خالی
  - [x] رفعِ فضای خالیِ کارت‌ها: آواتارِ ویرایش‌پذیر در hero (`EditableAvatar`)؛ حذفِ کارت‌های کم‌محتوا
  - [x] کراپرِ اختصاصیِ همسو بدونِ zoom/rotate (کادرِ قابل‌تغییراندازه)؛ حذفِ `react-easy-crop` · `tsc`/`build` ✅
- **خارج از scope (فاز بعد):** فراموشیِ رمز، اجباری‌شدنِ نام‌کاربری، EmailProvider واقعی، تغییرِ موبایل/ایمیلِ ثبت‌شده.

### TASK-AI-NOMOCK | حذف کامل Mock + رفع باگ روتینگ سرویس AI (DECISION-048) — ✅ ۲۰۲۶-۰۶-۰۱
- **منبع:** باگ کشف‌شده توسط مالک — سرویس‌ها به‌جای GapGPT به Mock می‌رفتند (dev، country=null → INTL → Mock). مالک: Mock کاملاً حذف شود (API واقعی هست).
- **تصمیم مالک:** Fallback سراسری (یک سرویس برای همه؛ منطقهٔ بدون سرویس → پیش‌فرض سراسری).
- **ساب‌تسک‌ها:**
  - [x] `services.ts`: `getGlobalDefaultService` + مرحلهٔ fallback سراسری در resolver
  - [x] `provider-router.ts`: حذف هر دو fallbackِ mock → خطای واضح
  - [x] `adapters/index.ts`: حذف case mock + شاخهٔ mock + نوع `AIProviderName` + `getAIAdapter()` لگاسی
  - [x] حذف فایل `mock-ai.adapter.ts`
  - [x] admin API (`services` + `[id]`): حذف mock از `PROVIDER_TYPES` + شرط‌ها
  - [x] `AiServicesManager.tsx`: حذف گزینه/منطق mock از UI
  - [x] `chat route`: try/catch → پیام محترمانهٔ ۵۰۳
  - [x] DB: حذف دو ردیف سرویس Mock (تنها GapGPT ماند)
  - [x] env/docs: پاک‌سازی `AI_PROVIDER_*`/mock از `.env.example`/`.env.local`/CLAUDE.md
  - [x] تست واقعی: `POST /api/chat/messages` → پاسخ GapGPT واقعی · `tsc` ✅ · `next build` ✅
- **استقلال ساختاری:** معماری IR/INTL و DECISION-039 حفظ شد؛ فقط Mock حذف و fallback اضافه شد. SMS mock دست‌نخورده.


### TASK-WEEKLY-V3 | بازطراحی گزارش هفتگی — تحلیلگر رفتار + متریک قطعی + هیستوگرام پویا (DECISION-047) — ✅ ۲۰۲۶-۰۶-۰۱
- **منبع:** خواست مالک برای تحلیل عمیق‌تر و جلوهٔ بصری کلاس‌جهانی (حیاتی برای بقای بیزینس). **بدون migration**.
- **تصمیم‌های مالک:** متریک = تصویر چندبعدی صادقانه · عمق = سیگنال ۴ هفته · نمودار = SVG/CSS دست‌ساز.
- **ساب‌تسک‌ها:**
  - [x] رفع باگ ریشه‌ای «۱۰۰٪»: اعداد در کد محاسبه می‌شوند نه AI (فرمول معیوب از پرامپت حذف شد)
  - [x] ورودی غنی AI: اسکلت کامل ۷ روز + GapRecordهای صریح + سیگنال تاریخی ۴ هفته (`build-input.ts` مشترک)
  - [x] پرامپت `weekly-report/v3.fa.md` (نقش تحلیلگر رفتار، تحلیل گپ بدون قضاوت، categories با entryRefs) + `weekly-reflection/v2.fa.md` عمیق‌تر
  - [x] `lib/reports/weekly-analysis.ts`: skeleton/metrics/gaps/history/expandCategories (همه قطعی)
  - [x] route v3: غنی‌سازی ورودی + محاسبهٔ قطعی + بسط categories + ذخیرهٔ content جدید
  - [x] mock v3 (داده/گپ/تاریخ‌آگاه، بدون باگ ۱۰۰٪) + شاخهٔ reflection
  - [x] UI سه‌تب کلاس‌جهانی: سرآیند صادقانه + نوار ۷روز انیمیشنی + هیستوگرام دستهٔ پویا + گلس/animate-fade-up + normalize عقب‌سازگار
  - [x] دو نمودار تب تأمل: دونات «ترکیب هفته» (وضعیت روزها) + رادار «نقشهٔ دسته‌ها» (SVG دست‌ساز، پالت خاکیِ همسو، انیمیشن نرم؛ <۳ دسته → میله) — `ReflectionCharts.tsx`
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **توسعه‌پذیری:** افزودن نقش/دستهٔ تحلیل جدید بدون لمس معماری؛ متریک‌های قطعی قابل‌گسترش.


### TASK-NOTIF-CORE | سیستم نوتیفیکیشن — toast + اعلان ماندگار (DECISION-046) — ✅ ۲۰۲۶-۰۶-۰۱
- **منبع:** خواست مالک (موج ۱ نقشهٔ راه). دامنهٔ تأییدشده: فقط زیرساخت + اعلان رویدادی؛ یادآوری زمان‌محور → موج ۲. State = Zustand. migration `notifications` (تأیید مالک).
- **ساب‌تسک‌ها:**
  - [x] schema: مدل `Notification` (type کاتالوگ‌محور + data JSON + channel برای ارسال بیرونی آینده) + migration `20260601110530_notifications`
  - [x] لایهٔ toast: `toast.ts` (Zustand) + `<ToastHost>` در layout ریشه (سایت + پنل) — حداکثر ۴، حذف خودکار، تنِ آرام
  - [x] کاتالوگ کد-محور `src/lib/notifications/catalog.ts` (type→tone/icon/describe، fallback امن) + `server.ts` (تنها درگاه createNotification + list/unread/markRead)
  - [x] API: `GET /api/notifications` (+unread)، `PATCH /[id]/read`، `POST /read-all` — مالکیت userId
  - [x] UI: `<NotificationBell>` در AppNav (badge + dropdown + polling ۶۰ث) + `/notifications` + کارت «یادآوری‌ها» در پروفایل + `<NotificationItem>` مشترک
  - [x] producerها: `support.replied` (پاسخ پشتیبان→کاربر) + `plan.changed` (تغییر پلن→کاربر، parity) + toast در فرم‌های ذخیره/پاسخ
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **هم‌ترازی:** `plan.changed` نمونهٔ روشن parity — اقدام ادمین، بازتاب اعلان سمت کاربر.
- **توسعه‌پذیری:** افزودن نوع جدید = یک ردیف کاتالوگ. چت آنلاین/ارسال بیرونی (push/sms) روی همین مدل (channel) و همین درگاه.
- **موج ۲ (موکول، تأییدشده):** یادآوری‌های زمان‌محور + تنظیمات کنترل کاربر در پروفایل (placeholder «به‌زودی» گذاشته شد).


### TASK-SUPPORT-TICKETING | دو قانون سراسری + سیستم تیکتینگ (DECISION-044) — ✅ ۲۰۲۶-۰۵-۳۱
- **منبع:** دو قانون مالک (بدون autofill + تاریخ جلالی) + ساخت سیستم پشتیبانی توسعه‌پذیر. migration `support_tickets` (تأیید مالک).
- **ساب‌تسک‌ها:**
  - [x] قانون بدون autofill: `<DisableAutofill>` سراسری در layout ریشه (MutationObserver) + ثبت قانون در CLAUDE.md §۵
  - [x] قانون تاریخ جلالی: `<JalaliDatePicker>` با jalaali-js + helperهای تبدیل در `date.ts` + جایگزینی در audit/discount
  - [x] **رفع باگ enforcement:** `planAllows` فلگ‌محور (`!disabled && !comingSoon`) به‌جای ستون لگاسی `enabled` → روشن‌کردن از پنل بلافاصله دسترسی می‌دهد
  - [x] schema: `SupportTicket` + `TicketMessage` (+ channel برای چت آینده) + migration + خاموش‌کردن comingSoon امکان تیکتینگ
  - [x] کاتالوگ کد-محور `src/lib/support/tickets.ts` (دسته/اولویت/وضعیت/کانال + helper) + `support/server.ts` (گیت `getTicketingContext`)
  - [x] سمت کاربر: API (create + reply، گیت planAllows + مالکیت) + `/support` و `/support/[id]` + CTA ارتقا + لینک AppNav
  - [x] سمت ادمین: API (reply + status/priority، enforce support.read/respond + audit) + `/admin/support` و `[id]` + کنترل‌ها + فعال‌سازی nav
  - [x] کنش‌های audit پشتیبانی + دستهٔ «پشتیبانی» در کاتالوگ ممیزی
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **هم‌ترازی:** دسترسی تیکتینگ فقط از `support.ticketing` پلن — روشن‌کردن برای پلاس/هر پلن از پنل = دسترسی فوری.
- **توسعه‌پذیری:** چت آنلاین آینده روی `channel="chat"` همین مدل + همین گیت پلن.


### TASK-ADMIN-AUDIT | لاگ ممیزی — viewer (DECISION-043) — ✅ ۲۰۲۶-۰۵-۳۱
- **منبع:** خواست مالک («لاگ ممیزی، با دقت بالا و استاندارد حرفه‌ای»). **بدون migration** — مدل `AdminAuditLog` و `logAdminAction` و permission `audit.read` از قبل بودند؛ فقط لایهٔ خوانش غایب بود.
- **ساب‌تسک‌ها:**
  - [x] کاتالوگ کد-محور `src/lib/admin/audit-actions.ts` — ۲۷ کنش × {label/category/tone}، ۶ دسته، `describeAction` با fallback امن، `auditActionsByCategory` برای optgroup
  - [x] صفحهٔ `/admin/audit` (Server Component، enforce `audit.read`): فیلتر کنشگر/کنش(گروه‌بندی)/بازهٔ تاریخ(وقت تهران)/شناسهٔ هدف + صفحه‌بندی ۳۰‌تایی
  - [x] جدول: زمان fa-IR، کنشگر، نشانِ تون‌دار کنش + کلید خام، هدف (کاربر→لینک)، متادیتای JSON در `<details>` بومی
  - [x] فعال‌سازی آیتم nav «لاگ ممیزی» (`ready:true`) در `AdminShell`
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **اصول:** فقط-خواندنی/append-only، ارقام فارسی + `num-latin` برای شناسه‌های فنی، RBAC، صفر کامپوننت کلاینت.
- **پیشنهاد آینده (نیازمند تأیید مالک + migration):** ستون‌های `ip`/`userAgent` روی `AdminAuditLog` + خروجی CSV/JSON با فیلتر فعلی.


### TASK-ADMIN-AI | مدیریت AI از پنل — لایهٔ override (DECISION-037) — ✅ ۲۰۲۶-۰۵-۳۰
- **منبع:** DECISION-037 (override روی فایل/env)، اصل هم‌ترازی ادمین↔پروژه
- **ساب‌تسک‌ها:**
  - [x] schema: `AiPromptOverride` (نسخه‌دار) + `AiConfig` (کلید-مقدار) + migration
  - [x] `lib/ai/config.ts` (resolver با fallback + cache) + `lib/ai/admin-catalog.ts` (کاتالوگ + اعتبارسنجی placeholder)
  - [x] override در `prompt-loader` (DB→فایل) + `getFilePromptTemplates`
  - [x] `provider-router` async + override روتینگ؛ `orchestrator` مدل/temperature/maxTokens؛ adapter `model`
  - [x] chat route: نام پیش‌فرض همدم + **سقف per-plan** (رفع باگ ۱۰ برای همه) + متن welcome سروری؛ ChatWindow
  - [x] API: `/api/admin/ai/prompts` (ذخیرهٔ نسخه) + `/prompts/activate` (فعال‌سازی/بازگشت) + `/config` (set با allowlist) — enforce `ai.manage`
  - [x] UI: `/admin/ai` (روتینگ/مدل/همدم/سقف/پارامتر نقش) + `/admin/ai/prompts/[role]` (ویرایشگر نسخه‌دار) + nav
  - [x] `tsc --noEmit` ✅ + `next build` ✅
  - [x] **بازخورد ۲۰۲۶-۰۵-۳۰:** baseURL + apiKey هر provider قابل‌ویرایش (apiKey هرگز به UI برنمی‌گردد؛ فقط وضعیت تنظیم‌شده/خالی) + adapter resolver async با cache امضا
  - [x] **بازخورد ۲۰۲۶-۰۵-۳۰:** نقش مستقل `weekly-reflection` (کوچ Plus/Pro) — فراخوانی موازی در weekly route، اگر خطا خورد گزارش نمی‌شکند
  - [x] **بازخورد ۲۰۲۶-۰۵-۳۰:** «راهنمای تغییرات» غیرفنی در هر بخش پنل AI (settings + prompt editor)
- **محافظ:** نبود override → رفتار امروز؛ خطا → fallback به فایل/env. placeholder ناشناخته هنگام ذخیره رد می‌شود.
- **هم‌ترازی:** سقف چت per-plan با صفحهٔ پلن‌ها (۱۰/۵۰/۲۰۰) هماهنگ شد.


### TASK-ADMIN-AI-SERVICES | سرویس‌های AI چندگانه + Bind بخش‌ها (DECISION-039) — ✅ ۲۰۲۶-۰۵-۳۰
- **منبع:** DECISION-039 (جایگزین تک-Provider per-region)، پنج نکتهٔ صاحب پروژه، اصل هم‌ترازی ادمین↔پروژه
- **ساب‌تسک‌ها:**
  - [x] schema: مدل `AiService` (region/kind/providerType/baseURL/apiKey/model/isActive/isDefault) + migration `add_ai_services`
  - [x] `lib/ai/services.ts` — resolver (`resolveServiceForRole`، `getDefaultService`، `getServiceById`، `regionFromCountry`) با cache ۱۰ث + fallback؛ هرگز throw نمی‌کند
  - [x] `getAIAdapterForService` در adapters (متن=openai-compatible با cache امضا؛ تصویر=گارد؛ کلید خالی=خطای روشن) — حذف `getAIAdapterResolved`
  - [x] بازنویسی `provider-router` به سرویس‌محور (سرویس نبود/خطا → mock)؛ `orchestrator` مدل را از `service.model` می‌گیرد؛ `serviceKind` به `AIRoleMeta`
  - [x] کلید `bind.<role>.<region>` در admin-catalog + `AI_REGIONS`/`AI_SERVICE_KINDS`؛ پاک‌سازی کلیدهای `routing.*`/`provider.*`
  - [x] API: `/services` (GET/POST) + `/services/[id]` (PATCH/DELETE) + `/services/[id]/key` (POST، **Owner-only** با `isOwner`) + `/bindings` (POST) — enforce `ai.manage`؛ پاک‌سازی `/config`
  - [x] UI: `AiServicesManager` (CRUD گروه‌بندی‌شده per منطقه + نمایش کلید با نگه‌داشتن، فقط Owner) + `AiBindingsForm` (اتصال هر بخش per منطقه) + بازنویسی `/admin/ai` و حذف بخش روتینگ از `AiSettingsForm`
  - [x] **پَریتی #5:** `ChatWindow` در هر باز شدن متن خوش‌آمد/سقف را تازه می‌کند (قبلاً تغییر پنل دیده نمی‌شد)
  - [x] seed idempotent دو سرویس پیش‌فرض از env (حفظ رفتار routing فعلی)
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **محافظ:** سرویس نبود/کلید خالی/خطای DB → fallback به mock. حداکثر یک `isDefault` per (region, kind).
- **هم‌ترازی:** کلید فقط-Owner (DECISION-037 معکوس شد طبق خواست مالک)؛ تغییر welcome/سقف چت بلافاصله در اپ.


### TASK-ADMIN-PLANS | مدیریت پلن‌ها — قیمت/امکانات/کد تخفیف پویا (DECISION-040) — ✅ ۲۰۲۶-۰۵-۳۰
- **منبع:** DECISION-040، اصل هم‌ترازی ادمین↔پروژه. migration `add_plans` (با تأیید مالک).
- **تصمیم‌های قفل‌شده:** ۳ پلن ثابت/محتوا پویا · منبع‌حقیقت واحد (سقف چت + گیت تأمل منتقل شدند) · کد تخفیف کامل + نمایش در /plans (مصرف موکول به درگاه).
- **ساب‌تسک‌ها (فازبندی):**
  - **فاز A — مدل داده و enforcement:**
    - [x] schema: `Plan` + `PlanFeatureValue` (ماتریس) + `PlanBullet` + `DiscountCode` + migration
    - [x] کاتالوگ امکانات `src/lib/plans/features.ts` (boolean|quota + flag «به‌زودی» + `PLAN_DEFAULTS`)
    - [x] resolver `src/lib/plans/access.ts` — `planAllows`/`planQuota` با cache+fallback
    - [x] seed idempotent سه پلن + ماتریس امکانات (قیمت پلاس از مالک؛ سقف چت → quota)
  - **فاز B — انتقال parity (منبع‌حقیقت واحد):**
    - [x] سقف چت: chat route از `planQuota("chat.dailyLimit")` — کلید `chat.limit.*` منسوخ
    - [x] گیت تأمل: weekly route از `planAllows("weekly.reflection")` (به‌جای hardcode)
    - [x] بخش AI: کارت «سقف چت» حذف و به پلن‌ها ارجاع داده شد
  - **فاز C — پنل ادمین:**
    - [x] `/admin/plans` — ویرایش پلن + ماتریس امکانات + quotaها + bulletها (`PlansManager`)
    - [x] API: `/api/admin/plans/[key]` (PATCH فیلد+ماتریس+bullet) — enforce `plans.write`
    - [x] مدیریت کد تخفیف: `DiscountManager` + `/api/admin/plans/discounts` (CRUD، audit)
    - [x] nav: آیتم «پلن‌ها» فعال (ready=true)
  - **فاز D — صفحهٔ عمومی /plans:**
    - [x] بازسازی پویا (`PlansPricing`)، سوییچ ماهانه/سالانه + «معادل ماهانه»
    - [x] فیلد کد تخفیف + `/api/plans/validate-discount` → نمایش قیمت با تخفیف
    - [x] دکمهٔ خرید «به‌زودی» (بدون درگاه) — هستهٔ مصرف کد آماده برای فاز پرداخت
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **محافظ:** نبود مقدار → fallback به پیش‌فرض کاتالوگ؛ هیچ تغییر پنل enforcement را نمی‌خواباند.
- **خارج از این تسک (فاز پرداخت):** درگاه پرداخت، مصرف واقعی کد، صورتحساب، اشتراک/تمدید.


### TASK-PLANS-FLAGS-DIGITS | ارقام فارسی سراسری + فلگ‌های امکانات پلن (DECISION-042) — ✅ ۲۰۲۶-۰۵-۳۱
- **منبع:** دو خواست مالک. migration `plan_feature_flags` (+ normalization داده).
- **ساب‌تسک‌ها:**
  - [x] قانون ارقام فارسی: `ss01` روی `body` در globals.css + کلاس `.num-latin` برای فیلدهای فنی LTR
  - [x] اعمال `num-latin` روی مدل/baseURL/کلید (AiServices)، کد تخفیف، نام‌کاربری (پروفایل/ادمین‌ها/لاگین)
  - [x] schema `PlanFeatureValue`: visible/comingSoon/disabled/label + migration با normalization (enabled→disabled، catalog→comingSoon)
  - [x] seed ماتریس + `PATCH /api/admin/plans/[key]` به مدل فلگ‌محور
  - [x] `PlansManager`: هر امکان → متن(override)+عدد + نمایش/بزودی/غیرفعال (همه قابل ویرایش)
  - [x] `/plans` عمومی + `PlansPricing`: رندر بر اساس visible/comingSoon/disabled + label
  - [x] `tsc` ✅ + `next build` ✅
- **قانون قطعی:** در CLAUDE.md §۵ ثبت شد (ارقام فارسی در کل UI).
- **تکمیل بازخوردی ۲۰۲۶-۰۵-۳۱:**
  - [x] رفع ارقام لاتین در فرم‌کنترل‌ها: `ss01` صریح روی `input/textarea/select` در globals.css
  - [x] فیلدهای عددی `type="number"` → `inputMode` متنی + helper `src/lib/utils/digits.ts` (onlyDigits/toEnDigits/toFaDigits): قیمت ماهانه/سالانه + quota (PlansManager)، مقدار/سقف کد تخفیف (DiscountManager)، اعداد AI (AiSettingsForm)
  - [x] «خط متنی» → «قابلیت سفارشی»: migration افزایشی `plan_bullet_flags` (visible/comingSoon/disabled روی PlanBullet) + UI افزودن قابلیت با نمایش(Radio)/بزودی/غیرفعال + رندر عمومی از مسیر `FeatureRow`
  - [x] `tsc` ✅ + `next build` ✅


### TASK-ADMIN-OWNER-PROFILE | مالک یکتا + پروفایل ادمین (DECISION-041) — ✅ ۲۰۲۶-۰۵-۳۰
- **منبع:** دو خواست مالک (مکمل DECISION-036/038). migration `admin_avatar` (افزودن avatarPreset).
- **ساب‌تسک‌ها:**
  - [x] گارد owner در `POST /api/admin/admins` و `/admins/[id]/role` (غیرقابل‌انتساب + تغییرناپذیر)
  - [x] UI ادمین‌ها: حذف owner از گزینه‌ها + ردیف مالک ثابت/قفل (بدون select/toggle)
  - [x] schema: `avatarPreset` روی `AdminUser` + migration؛ `avatarPreset` در `AdminContext`
  - [x] `PATCH /api/admin/profile` (نام/نام‌کاربری با یکتایی/تلفن/آواتار، audit)
  - [x] صفحهٔ `/admin/profile` + `AdminProfileForm` (اطلاعات+آواتار + تغییر رمز)
  - [x] `AdminShell`: آواتار در کارت کاربر + لینک به پروفایل
  - [x] `tsc` ✅ + `next build` ✅


### TASK-PARITY-BAN | enforce کردن isBanned در سمت پروژه — ✅ ۲۰۲۶-۰۵-۳۰
- **منبع:** اصل هم‌ترازی ادمین↔پروژه. ban در پنل ست می‌شود ولی پروژه آن را enforce نمی‌کرد (نقض اصل).
- **ساب‌تسک‌ها:**
  - [x] `getSessionUser()` — کاربر `isBanned` → session بی‌اعتبار (lookup سبک روی PK)؛ کاربر مسدود به اپ راه ندارد
  - [x] `tsc --noEmit` ✅

### TASK-ADMIN-ROLES | مدیریت نقش‌ها و دسترسی‌ها (enforce: roles.manage) — ✅ ۲۰۲۶-۰۵-۳۰
- **منبع:** DECISION-036 (RBAC granular)
- **ساب‌تسک‌ها:**
  - [x] `POST /api/admin/roles` — ساخت نقش جدید (بدون migration) + audit `role.create`
  - [x] `POST /api/admin/roles/[id]/permissions` — تنظیم دسترسی‌ها (گارد: owner قفل، فقط کلیدهای معتبر) + audit
  - [x] `POST /api/admin/roles/[id]/delete` — حذف (گارد: غیرپایه + بدون عضو) + audit
  - [x] `RolesManager` — کارت هر نقش با چک‌باکس گروه‌بندی‌شده + «همه/هیچ» per گروه + ساخت/حذف نقش
  - [x] `/admin/roles` page (enforce `roles.manage`) + nav (آیکون key)
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **یادداشت:** نقش owner همیشه همهٔ دسترسی‌ها را دارد و قابل ویرایش نیست (ضد قفل‌شدن).


### TASK-ADMIN-FOUNDATION | زیرساخت ادمین پنل (RBAC + Shell + User Management) — 🟢 تقریباً کامل ۲۰۲۶-۰۵-۲۹
- **منبع:** DECISION-036 (RBAC granular)، DECISION-037 ⏳ (AI override)، `docs/features/admin-panel.md`
- **زمینه:** اولین برش عمودی پنل ادمین. زیرساخت کامل RBAC + اولین ماژول (مدیریت کاربران). درگاه پرداخت و SMS واقعی هنوز فعال نیستند → فقط mock/monitoring.
- **ساب‌تسک‌ها:**
  - [x] schema: `AdminUser`, `AdminRole`, `AdminPermission`, `AdminRolePermission`, `AdminAuditLog` + `User.isBanned` + migration `20260529182933_add_admin_rbac`
  - [x] `src/lib/admin/permissions.ts` — کاتالوگ ۲۰ permission + ۴ نقش پایه (منبع‌حقیقت)
  - [x] `prisma/seed.ts` — idempotent: نقش‌ها + permissionها + OWNER (`owner`) seed شدند
  - [x] `src/lib/admin/session.ts` — JWT جدا، کوکی `hamsoo-admin-session` (۱۲ ساعت)
  - [x] `src/lib/admin/auth-server.ts` — `getAdminSession()` + `can()` + `requireAdmin()` + `requirePermission()`
  - [x] `src/lib/admin/audit.ts` — `logAdminAction()`
  - [x] **DECISION-038:** auth با نام کاربری/رمز (نه OTP) — `src/lib/admin/password.ts` (scrypt + complexity + generate)
  - [x] migration `20260529190507_admin_username_password` (username/passwordHash/mustChangePassword/lockout + phone optional)
  - [x] `/api/admin/auth/{login,change-password,logout}` — auth ادمین (بدون auto-create) + قفل brute-force
  - [x] `middleware.ts` — `adminMiddleware()` guard مسیر `/admin/*` و `/api/admin/*`
  - [x] `/admin/login` (username/password) + `/admin/change-password` (اجبار تغییر در ورود اول)
  - [x] `(panel)/layout.tsx` + `AdminShell` — sidebar با فیلتر permission + ماژول‌های «به‌زودی»
  - [x] `/admin` — داشبورد (کل کاربران، توزیع پلن، تعهد/گزارش ۷ روز، مسدودها)
  - [x] `/admin/users` — لیست + جستجو با شماره + فیلتر پلن + صفحه‌بندی (enforce `users.read`)
  - [x] `/admin/users/[id]` — جزئیات + تغییر پلن (`users.plan.write`) + ban (`users.ban`) + audit
  - [x] `tsc --noEmit` ✅ + `next build` ✅
  - [x] OWNER اول ساخته شد (نام کاربری `owner`)

### TASK-ADMIN-ADMINS | مدیریت ادمین‌ها (enforce: admins.manage) — ✅ ۲۰۲۶-۰۵-۲۹
- **منبع:** DECISION-036 + DECISION-038
- **ساب‌تسک‌ها:**
  - [x] `POST /api/admin/admins` — ساخت ادمین + رمز پیچیده auto-generate (نمایش یک‌باره) + audit `admin.create`
  - [x] `POST /api/admin/admins/[id]/active` — فعال/غیرفعال (گارد: self + آخرین owner فعال)
  - [x] `POST /api/admin/admins/[id]/role` — تغییر نقش (گارد: self + آخرین owner فعال)
  - [x] `AdminsManager` — جدول + فرم ساخت + modal نمایش یک‌بارهٔ رمز با کپی
  - [x] `/admin/admins` page (enforce `admins.manage`) + فعال‌سازی nav
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **یادداشت:** حذف فیزیکی ادمین عمداً وجود ندارد (حفظ AuditLog) — فقط غیرفعال‌سازی.

- **خارج از این تسک (تسک‌های بعدی):** TASK-ADMIN-ROLES (UI ویرایش permission نقش‌ها)، TASK-ADMIN-AI (DECISION-037)، TASK-ADMIN-PLANS، TASK-ADMIN-SMS، TASK-ADMIN-PAYMENT، تیکتینگ، CMS، analytics پیشرفته

### TASK-COMPANION-NAME | نام پویای همدم در چت — ✅ ۲۰۲۶-۰۵-۲۹
- **ساب‌تسک‌ها:**
  - [x] `layout.tsx` — fetch `companionName` از DB برای session فعال، پاس به `ChatFAB`
  - [x] `ChatFAB.tsx` — دریافت prop `companionName` و پاس به `ChatWindow`
  - [x] `ChatWindow.tsx` — نمایش نام پویا در header + avatar initial + welcome text
  - [x] `router.refresh()` پس از ذخیره در `CompanionSection` قبلاً موجود بود — کافی است
  - [x] `tsc --noEmit` ✅

### TASK-CHAT-CLEAR | پاک کردن تاریخچه چت (visual) — ✅ ۲۰۲۶-۰۵-۲۹
- **یادداشت:** داده‌ها در DB باقی می‌مانند (برای AI context)؛ فقط state محلی پاک می‌شود
- **ساب‌تسک‌ها:**
  - [x] دکمه سطل آشغال در header چت — فقط وقتی پیامی موجود است نمایش داده می‌شود
  - [x] `handleClearHistory()` → `setMessages([])` — بدون API call

### TASK-DASHBOARD-HISTORY | تاریخچه اخیر در داشبورد (modal شیشه‌ای) — ✅ ۲۰۲۶-۰۵-۲۹
- **ساب‌تسک‌ها:**
  - [x] `src/components/features/history/RecentHistoryModal.tsx` — `RecentHistoryButton` + `HistoryModal` + `EntryRow`
  - [x] `dashboard/page.tsx` — query آخرین ۵ تعهد (فقط در حالت عادی، نه gates) + `RecentHistoryButton`
  - [x] modal: glass blur، scale animation، Escape/backdrop close، scroll lock بدون scroll صفحه
  - [x] footer modal: لینک «مشاهده همه تاریخچه» به `/history`
  - [x] `tsc --noEmit` ✅

### TASK-NAV-UNIFIED | یکپارچه‌سازی Navigation — ✅ ۲۰۲۶-۰۵-۲۹
- **وابستگی:** TASK-PROFILE-BASE ✅
- **ساب‌تسک‌ها:**
  - [x] `src/components/layout/AppNav.tsx` — Client Component با usePathname، hamburger، active indicator
  - [x] جایگزینی nav در `dashboard/page.tsx`
  - [x] جایگزینی nav در `history/page.tsx`
  - [x] جایگزینی nav در `reports/weekly/page.tsx`
  - [x] جایگزینی nav در `settings/profile/page.tsx`
  - [x] جایگزینی nav در `settings/account/page.tsx`
  - [x] `tsc --noEmit` ✅ بدون خطا
- **طراحی:** max-w-5xl، h-16، لوگو راست / nav مرکز / profile+logout چپ، hamburger در موبایل، active dot ember، pill background

### TASK-PROFILE-BASE | پروفایل کاربری پایه — ✅ ۲۰۲۶-۰۵-۲۹ (گسترش‌یافته)
- **وابستگی:** TASK-004 ✅
- **ساب‌تسک‌ها:**
  - [x] migration: افزودن `displayName String?` به مدل User
  - [x] `GET/PATCH /api/profile` — خواندن و ویرایش پروفایل
  - [x] `DELETE /api/account` — حذف حساب با تأیید شماره موبایل (cascade Prisma)
  - [x] `src/components/features/settings/ProfileForm.tsx` — ویرایش displayName (Client)
  - [x] `src/components/features/settings/DeleteAccountForm.tsx` — حذف دومرحله‌ای (Client)
  - [x] لینک «تنظیمات» در nav dashboard
  - [x] **گسترش ۲۰۲۶-۰۵-۲۹:** migration: افزودن `bio String?` و `avatarPreset Int @default(0)` (migration: 20260529104525)
  - [x] **گسترش ۲۰۲۶-۰۵-۲۹:** آپدیت `GET/PATCH /api/profile` برای bio، companionName، avatarPreset
  - [x] **گسترش ۲۰۲۶-۰۵-۲۹:** `src/lib/profile/avatarPresets.ts` — ۱۲ preset رنگی (DECISION-033)
  - [x] **گسترش ۲۰۲۶-۰۵-۲۹:** `AvatarSection` / `PersonalInfoSection` / `CompanionSection` (DECISION-034)
  - [x] **گسترش ۲۰۲۶-۰۵-۲۹:** بازنویسی `src/app/settings/profile/page.tsx` — web-first، max-w-5xl، grid دو ستونی
  - [x] `tsc --noEmit` ✅ بدون خطا
- **یادداشت:** avatar upload در TASK-PROFILE-FULL (فاز ۲.۵). notifications placeholder آماده است.

### TASK-AI-CHAT | چت‌بات همدم — ✅ ۲۰۲۶-۰۵-۲۹
- **وابستگی:** TASK-009 ✅
- **ساب‌تسک‌ها:**
  - [x] migration: ChatMessage model + companionName روی User (20260529094003)
  - [x] `prompts/chat-companion/v1.fa.md` — prompt همدم
  - [x] نقش AI: `src/lib/ai/roles/chat-companion/schema.ts` + `index.ts`
  - [x] ثبت در `src/lib/ai/bootstrap.ts`
  - [x] `GET/POST /api/chat/messages` — تاریخچه + rate limit ۱۰/روز ایران + invokeAI
  - [x] `ChatWindow.tsx` + `ChatFAB.tsx` — UI slide-up، iOS-inspired
  - [x] نصب `<ChatFAB />` در root layout
  - [x] **گسترش ۲۰۲۶-۰۵-۲۹:** نام «همدل» → «همدم» در همه فایل‌ها (DECISION-035)
  - [x] **گسترش ۲۰۲۶-۰۵-۲۹:** input max 80 کاراکتر، بدون auto-grow
  - [x] **گسترش ۲۰۲۶-۰۵-۲۹:** scrollbar مخفی در ناحیه پیام‌ها (iOS-style)
  - [x] `tsc --noEmit` ✅ بدون خطا

---

## ✅ انجام‌شده

### TASK-PROFILE-AVATAR-UPLOAD | آواتار تصویری + پیش‌فرض سبز + بازطراحی پروفایل (DECISION-056) — ✅ ۲۰۲۶-۰۶-۰۴
- **منبع:** خواست مالک — آپلود تصویر + رنگ پیش‌فرض سبز + بازطراحی web-first
- **ساب‌تسک‌ها:**
  - [x] `schema.prisma`: `avatarImage String?` روی `User` + `AdminUser` + `@default(3)` روی `User.avatarPreset` + `prisma db push`
  - [x] `/api/profile`: اعتبارسنجی `avatarImage` (فرمت + حجم) + افزودن به GET response
  - [x] `/api/admin/profile`: اعتبارسنجی `avatarImage` (همترازی)
  - [x] `AvatarSection.tsx`: بازنویسی کامل — hover overlay camera + Canvas compress + preview آنی + حذف + گرید ۴ ستونی رنگ + نشانگر «پیش‌فرض» زیر sage
  - [x] `PersonalInfoSection.tsx`: رفع نقض DECISION-053 (دکمه «ذخیره» ثابت + Spinner)
  - [x] `settings/profile/page.tsx`: بازطراحی کامل — hero رنگی با halo + نوار آمار (تعهد/گزارش/روز) + گرید کارت
  - [x] `AdminProfileForm.tsx`: آپلود تصویر آواتار + حذف عکس (همترازی ادمین↔پروژه)
  - [x] `admin/profile/page.tsx`: ارسال `avatarImage` به فرم
  - [x] `tsc --noEmit` ✅ + `next build` ✅
- **هم‌ترازی:** آپلود تصویر و مدیریت آواتار در هر دو سمت کاربر و ادمین یکسان است.

### TASK-UIUX-REFACTOR | ریفکتور UI/UX سراسریِ اپِ کاربر — ✅ ۲۰۲۶-۰۶-۰۲ (DECISION-051)
هدف: کلاس‌جهانی، اتمسفر/متریال (حفظ مینیمالیسم)، web-first. روش: پایلوت داشبورد → تأیید → تعمیم.
- [x] `AmbientField` (گرادیانِ زندهٔ نرم + وینیِت، reduced-motion-safe) + کلاس‌های `.app-*`/`.stagger` در globals
- [x] `AppShell` مشترک (میدان + AppNav + لایه‌بندی z) + ارتقای اندیکاتورِ active در AppNav (`ease-expo`)
- [x] پاسِ کرافت: حذف ایموجی کارت تعهد → گلیفِ SVG؛ شیشه‌ای‌کردنِ کارت‌های گزارش؛ فاصله‌گذاریِ دسکتاپ
- [x] مهاجرتِ همهٔ صفحاتِ کاربر: dashboard/history/reports/plans/profile/account/notifications/support(+[id])/login
- [x] `tsc` ✅ · `next build` ✅ (۴۴/۴۴). بدون migration. پنل ادمین خارج از دامنه (تصمیم مالک)

### TASK-RADAR-FIXED | رادارِ ۶‌بُعدِ ثابت + بهبود پشتیبانی — ✅ ۲۰۲۶-۰۶-۰۲ (DECISION-050)
- [x] **رادار همیشه ۶‌محور:** `life-dimensions.ts` (۶ بُعد + `mapToDimensions`) + `dimension` در schema/پرامپت v3 + رادارِ بدون منطق سه‌حالته. هیستوگرامِ خلاصه دست‌نخورده.
- [x] **تیکت بسته قابل پاسخ نیست:** API ۴۰۹ + پنهان‌کردن فرم پاسخ در `/support/[id]`.
- [x] **badge سایدبار پنل:** `getSupportNavCounts` + `/api/admin/nav-counts` + AdminShell (poll ۲۰ث، badge روی تیکت/چت).
- [x] **تأیید:** `tsc` ✅ · `next build` ✅ · `/dev/charts` به‌روز.

### TASK-LIVECHAT | چت آنلاین پشتیبانی — ✅ ۲۰۲۶-۰۶-۰۱ (DECISION-049)
کانال سوم ارتباطی (مستقل از همدم و تیکت): گفتگوی زندهٔ انسانی، PRO-only، فقط ساعات کاری.
- [x] **داده/migration** `support_live_chat`: `SupportChatSession` + `SupportChatMessage` + `AppSetting` + `User.supportChatHiddenUntil` + `AdminUser.lastSeenAt` (تأیید صریح مالک)
- [x] **کاتالوگ/گیت:** کلید پلن `support.liveChat` (PRO) + `src/lib/support/chat.ts` (خوش‌آمد، ساعات کاری، presence، dayKey ایران)
- [x] **لایه‌ها:** `settings/app-settings.ts` · `support/presence.ts` · `support/availability.ts` · `support/chat-server.ts` · `support/chat-transport.ts`
- [x] **API کاربر:** `GET/POST /api/support/chat` · `/clear` · `/poll` · `/unread`
- [x] **UI کاربر:** `SupportChatWindow` (presence + هیستوری روزانه + پاک‌کردن) + `SupportChatCard` در پروفایل (badge + نقطهٔ آنلاین + دعوت به ارتقا برای غیرپرو)
- [x] **پنل:** کنسول `/admin/livechat` (صف + نمای زنده + پاسخ + heartbeat + خط watermark «کاربر مخفی کرد») + تنظیمات `/admin/livechat/settings` + nav + audit `livechat.settings.set`
- [x] **اعلان:** بدون نوتیفیکیشن (خواستهٔ مالک) → فقط badge خوانده‌نشده
- [x] **Parity ادمین↔پروژه:** ساعات/خوش‌آمد/روشن‌خاموش از پنل ↔ اعمال فوری در چت کاربر؛ presence پنل ↔ نقطهٔ سبز کاربر؛ پلن PRO ↔ دسترسی چت
- [x] **تأیید:** `tsc --noEmit` ✅

### TASK-009 | گزارش هفتگی AI + معماری AI کامل — ✅ ۲۰۲۶-۰۵-۲۸
- **وابستگی:** TASK-007 ✅، TASK-003 ✅
- **چارچوب جدید:** DECISION-028 (ProviderRouter)، DECISION-029 (Prompt files)، DECISION-030 (ادغام با AI-ARCH)
- **ساب‌تسک‌ها:**
  - [x] **TASK-009-01** | ثبت DECISION-028/029/030 + آپدیت DECISION-020
  - [x] **TASK-009-02** | نصب `zod` + `gray-matter`
  - [x] **TASK-009-03** | Refactor `AIAdapter` به interface generic (`generate({systemPrompt, userPrompt, jsonMode, metadata})`)
  - [x] **TASK-009-04** | `src/lib/ai/types.ts` — AIRole، AIInvocationContext، AIInvocationResult، AIInvocationLogEntry
  - [x] **TASK-009-05** | `src/lib/ai/registry.ts` — singleton با register/get/list، multi-version
  - [x] **TASK-009-06** | `src/lib/ai/prompt-loader.ts` — خواندن `/prompts/<role>/v<n>.<locale>.md` با frontmatter + placeholder substitution (fail-fast)
  - [x] **TASK-009-07** | `src/lib/ai/provider-router.ts` — Stub با interface کامل locale-aware
  - [x] **TASK-009-08** | `src/lib/ai/observability.ts` — ring buffer in-memory برای dev، privacy-aware در prod
  - [x] **TASK-009-09** | `src/lib/ai/orchestrator.ts` — `invokeAI(roleId, input, ctx)` با Zod validation
  - [x] **TASK-009-10** | `src/lib/ai/bootstrap.ts` — ثبت idempotent نقش‌ها
  - [x] **TASK-009-11** | نقش `weekly-report`: schema (Zod) + role definition + `prompts/weekly-report/v1.fa.md`
  - [x] **TASK-009-12** | بازنویسی `MockAIAdapter` به interface جدید — parse JSON از userPrompt، خروجی data-aware
  - [x] **TASK-009-13** | حذف `src/types/ai.ts` (موقت — types به role schema منتقل شدند)
  - [x] **TASK-009-14** | Date utils: `getJalaaliWeekRange`, `getLastCompletedWeekRange`, `getCurrentWeekRange` (شنبه→جمعه)
  - [x] **TASK-009-15** | `POST/GET /api/reports/weekly` — idempotent generate + fetch
  - [x] **TASK-009-16** | `src/types/weekly-report.ts` — SerializedWeeklyReport
  - [x] **TASK-009-17** | UI: `src/components/features/reports/WeeklyReportCard.tsx` + `GenerateReportButton.tsx`
  - [x] **TASK-009-18** | صفحه `src/app/reports/weekly/page.tsx` — Server Component
  - [x] **TASK-009-19** | لینک «گزارش هفته» در nav dashboard
  - [x] **TASK-009-20** | `prompts/README.md` — قرارداد افزودن نقش جدید
  - [x] **TASK-009-21** | DevAIInspector: `/api/dev/ai/invocations` + `<DevAIInspector>` در DevDataPanel (تب 🧠)
  - [x] **TASK-009-22** | `tsc --noEmit` ✅ بدون خطا
- **معماری ۵ لایه:**
  ```
  Consumer (API/Server Component)
       ↓ invokeAI()
  Layer 5: Orchestrator   ← validation، logging، routing
  Layer 4: Registry + Roles  ← weekly-report، (آینده) chat، plan-suggestion، ...
  Layer 3: Prompt Loader  ← /prompts/<role>/v<n>.<locale>.md
  Layer 2: ProviderRouter  ← Stub، آینده: locale-aware
  Layer 1: AIAdapter      ← Mock، (آینده) OpenAI، Gemini، Iran-X
  ```
- **خط قرمزها (در پرامپت v1.fa.md):** بدون قضاوت، بدون پیام انگیزشی، بدون مقایسه، بدون استریک، بدون ایموجی، بدون «باید»/«نباید»
- **نکته دستاوردی:** بعد از این TASK افزودن نقش جدید AI = ۵ دقیقه (پوشه + schema + پرامپت + register + invoke)

---

### TASK-008 | تاریخچه کاربر — ✅ ۲۰۲۶-۰۵-۲۸
- **وابستگی:** TASK-006 ✅، TASK-007 ✅
- **ساب‌تسک‌ها:**
  - [x] **TASK-008-01** | `src/types/history.ts` — تایپ‌های `HistoryItem`, `HistoryFeedback`, `HistoryPage`
  - [x] **TASK-008-02** | `GET /api/history` — cursor-based pagination (date DESC, limit 10) + select با feedback join
  - [x] **TASK-008-03** | `src/components/features/history/HistoryItem.tsx` — کارت تعهد + badge وضعیت (ember/stone/fog) + یادداشت
  - [x] **TASK-008-04** | `src/components/features/history/HistoryList.tsx` — Client Component + Intersection Observer + lazy load
  - [x] **TASK-008-05** | `src/app/history/page.tsx` — Server Component؛ اولین صفحه SSR، بقیه با HistoryList
  - [x] **TASK-008-06** | `src/app/dashboard/page.tsx` — لینک «تاریخچه» در nav
  - [x] **TASK-008-07** | `tsc --noEmit` ✅ بدون خطا
- **جزئیات طراحی:**
  - Infinite Scroll با IntersectionObserver (rootMargin 200px)
  - هر آیتم: تاریخ شمسی + روز هفته، متن تعهد، badge بازخورد، یادداشت اختیاری
  - وضعیت DONE → ember، NOT_DONE → stone (بدون قرمز — اصل بدون قضاوت)
  - sentinel پایین لیست → loadMore async

---

### TASK-007 | مدیریت فاصله غیرفعالی — ✅ ۲۰۲۶-۰۵-۲۸
- **وابستگی:** TASK-006 ✅
- **ساب‌تسک‌ها:**
  - [x] **TASK-007-01** | `src/types/gap.ts` — تایپ `PendingGap`، `CreateGapInput`، `CreateGapResult`
  - [x] **TASK-007-02** | `POST /api/gaps` — ثبت GapRecord؛ سرور تاریخ را از آخرین تعهد محاسبه می‌کند (کاربر نمی‌تواند تاریخ دستی بدهد)؛ در dev با `devSeed: true` علامت می‌خورد تا reset پاکش کند
  - [x] **TASK-007-03** | `src/components/features/gap/GapForm.tsx` — UI «خوش برگشتی» با یادداشت اختیاری + دکمه «ادامه» (همیشه GapRecord می‌سازد، با یا بدون یادداشت)
  - [x] **TASK-007-04** | `src/app/dashboard/page.tsx` — تشخیص فاصله + گیت GapForm (گیت ۲ بعد از FeedbackForm)
  - [x] **TASK-007-05** | `src/app/api/entries/route.ts` — اجرای قانون در API: بدون بازخورد تعهد قبلی، تعهد جدید ممنوع (error: feedback_required)
  - [x] **TASK-007-06** | `src/lib/dev/seed.ts` — تابع `seedGapScenario()`: تاریخچه با بازخورد + آخرین تعهد بدون بازخورد + روزهای خالی
  - [x] **TASK-007-07** | `POST /api/dev/seed/gap-scenario` + دکمه در DevSeedPanel
  - [x] **TASK-007-08** | `tsc --noEmit` ✅ بدون خطا
- **جریان نهایی dashboard:**
  ```
  آخرین تعهد بدون بازخورد؟ → FeedbackForm (گیت ۱)
  فاصله غیرفعالی بدون GapRecord؟ → GapForm (گیت ۲)
  تعهد امروز ثبت شده؟ → EntryCard
  هیچکدام → EntryForm
  ```
- **نکته مهم:** قانون «بدون بازخورد، تعهد جدید ممنوع» هم در UI (گیت dashboard) و هم در API اجرا می‌شود

---

### TASK-006 | جریان بازخورد (Feedback Flow) — ✅ ۲۰۲۶-۰۵-۲۸
- **وابستگی:** TASK-005 ✅، TASK-DEV-DATA ✅
- **ساب‌تسک‌ها:**
  - [x] **TASK-006-01** | `src/types/feedback.ts` — تایپ‌های `PendingFeedbackEntry`، `CreateFeedbackInput`، `CreateFeedbackResult`
  - [x] **TASK-006-02** | `POST /api/feedback` — ثبت بازخورد با اعتبارسنجی کامل (ownership، وجود بازخورد قبلی، حد کاراکتر یادداشت)
  - [x] **TASK-006-03** | `src/components/features/feedback/FeedbackForm.tsx` — UI دو حالت (انجام شد / انجام نشد) + یادداشت اختیاری + submit + موفقیت + refresh
  - [x] **TASK-006-04** | `src/app/dashboard/page.tsx` — query تعهد قبلی بدون بازخورد، گیت نمایش `FeedbackForm`
  - [x] **TASK-006-05** | `tsc --noEmit` ✅ بدون خطا
- **منطق کلیدی:**
  - گیت: اگر تعهدی از قبل از امروز بدون بازخورد وجود دارد → FeedbackForm اول نشان داده می‌شود
  - یک بازخورد در هر بار (جدیدترین تعهد بدون بازخورد)
  - پس از ثبت: router.refresh() → Server Component داده جدید می‌خواند → گیت برداشته می‌شود
  - لحن: خنثی، بدون قضاوت — "انجام نشد" با رنگ stone نه قرمز

---

### TASK-DEV-DATA | فریم‌ورک Dev Data Generation — ✅ ۲۰۲۶-۰۵-۲۷
- **منبع:** [docs/features/dev-data-generation.md](docs/features/dev-data-generation.md)، DECISION-021
- **ساب‌تسک‌ها:**
  - [x] **TASK-DEV-DATA-01** ✅ ۲۰۲۶-۰۵-۲۷ | `src/lib/dev/time.ts` + جایگزینی `new Date()` سرور با `getNow()`
    - فایل ساخته‌شده: `src/lib/dev/time.ts` (getNow، nowMs، setDevTime، resetDevTime، isDevTimeShifted، getDevTimeOffsetMs)
    - migrate شد: `src/lib/utils/date.ts` (nowInIran، canEdit، editTimeRemaining)، `src/lib/utils/otp.ts` (getOtpExpiry)، `src/app/api/entries/route.ts`، `src/app/api/entries/[id]/route.ts`، `src/app/api/auth/{request,verify}-otp/route.ts`، `src/lib/adapters/mock-ai.adapter.ts` (generatedAt)
    - دست‌نخورده: `src/lib/adapters/mock-sms.adapter.ts` (log timestamp/messageId cosmetic — زمان wall-clock صحیح است)
    - `tsc --noEmit` ✅ بدون خطا
  - [x] **TASK-DEV-DATA-02** ✅ ۲۰۲۶-۰۵-۲۷ | API `/api/dev/time/{set,reset}` + `<DevTimeTravel>`
    - `src/app/api/dev/time/set/route.ts` — GET (وضعیت) + POST (تنظیم با targetIso یا offsetDays)
    - `src/app/api/dev/time/reset/route.ts` — POST (ریست به زمان واقعی)
    - `src/components/dev/DevTimeTravel.tsx` — UI با دکمه‌های ±۱/±۷ روز + datetime-local + ریست + router.refresh()
    - `tsc --noEmit` ✅ بدون خطا
  - [x] **TASK-DEV-DATA-03** ✅ ۲۰۲۶-۰۵-۲۷ | افزودن `devSeed Boolean?` به مدل‌ها (migration)
    - `prisma/schema.prisma` — افزودن `devSeed` به DailyEntry، EntryFeedback، GapRecord، WeeklyReport
    - migration `20260527214304_add_dev_seed` اعمال شد
    - نکته: نام `_devSeed` در Prisma 6 مجاز نیست → `devSeed` استفاده شد
  - [x] **TASK-DEV-DATA-04** ✅ ۲۰۲۶-۰۵-۲۷ | API `/api/dev/seed/entries` + seed helper
    - `src/lib/dev/seed.ts` — `seedEntries()`, `seedFeedback()`, `seedFullWeek()`
    - `src/app/api/dev/seed/entries/route.ts` — POST با body `{ days?: number }`
  - [x] **TASK-DEV-DATA-05** ✅ ۲۰۲۶-۰۵-۲۷ | API `/api/dev/seed/full-week`
    - `src/app/api/dev/seed/full-week/route.ts` — POST بدون بدنه
  - [x] **TASK-DEV-DATA-06** ✅ ۲۰۲۶-۰۵-۲۷ | API `/api/dev/reset/me`
    - `src/app/api/dev/reset/me/route.ts` — حذف همه `devSeed: true` + ریست زمان
  - [x] **TASK-DEV-DATA-07** ✅ ۲۰۲۶-۰۵-۲۷ | `<DevDataPanel>` wrapper در layout
    - `src/components/dev/DevSeedPanel.tsx` — seed + reset با feedback بصری
    - `src/components/dev/DevDataPanel.tsx` — تب‌دار (⏰ زمان / 🌱 دیتا)، گوشه پایین-چپ، collapsible
    - `src/app/layout.tsx` — نصب `<DevDataPanel />` (کنار DevModeBadge و DevResetPanel)
    - `tsc --noEmit` ✅ بدون خطا
  - [x] **TASK-DEV-DATA-08** ✅ ۲۰۲۶-۰۵-۲۷ | تست build prod
    - `NEXT_PUBLIC_APP_MODE=production npx next build` → build موفق
    - `GET /api/dev/time/set` در prod → 404 تأیید شد
    - همه ۶ handler گارد `if (!IS_DEV_MODE) return 404` دارند
    - `/api/dev` به `PUBLIC_PATHS` middleware اضافه شد (route handler خودش گارد دارد)
    - UI: `DevDataPanel`, `DevTimeTravel`, `DevSeedPanel` در prod → null (tree-shaken)
  - [x] **TASK-DEV-DATA-09** ✅ ۲۰۲۶-۰۵-۲۷ | بروزرسانی CLAUDE.md §۱۳
    - لایه‌های ۵ و ۶ افزوده شدند (منبع زمان + DevDataPanel)
    - قانون فیچرهای زمان‌محور اضافه شد
    - فهرست API های `/api/dev/*` مستند شدند
    - قوانین `getNow()` و `PUBLIC_PATHS` اجباری شدند

---

### TASK-LANDING | پورت Landing Page به Next.js — ✅ ۲۰۲۶-۰۵-۲۷
- **زمینه:** جریان UX درست — `/` (لندینگ) → CTA «شروع کن» → `/login` → `/dashboard`
- **پیاده‌سازی:**
  - [x] DECISION-011 به‌روزرسانی شد (وضعیت: پورت کامل)
  - [x] CSS های landing اضافه به `src/app/globals.css` (grain, blobs, buttons, reveal, ...)
  - [x] `src/components/features/landing/LandingEffects.tsx` — Client Component (scroll reveal + parallax)
  - [x] `src/app/page.tsx` — Server Component با تمام بخش‌ها (Nav، Hero، Manifesto، Problem، Solution، Difference، Testimonial، Final CTA، Footer)
  - [x] CTA های «شروع کن» → `href="/login"` (با `<Link>` از next/link)
  - [x] `src/middleware.ts` آپدیت شد: `/` عمومی است؛ logged-in از `/` و `/login` به `/dashboard` ریدایرکت می‌شوند
  - [x] `tsc --noEmit` بدون خطا

---

### TASK-DEV-MODE | معماری Dev/Prod Mode (۴ لایه) — ✅ ۲۰۲۶-۰۵-۲۷
- **زمینه:** درخواست صاحب پروژه برای داشتن جداسازی روشن بین حالت توسعه و پروداکشن — قابل توسعه برای تمام فیچرهای آینده (OTP، AI، پرداخت، …)
- **پیاده‌سازی:**
  - [x] DECISION-016 ثبت شد (معماری ۴ لایه با `NEXT_PUBLIC_APP_MODE`)
  - [x] CLAUDE.md §۱۳ افزوده شد (قانون اجباری برای فیچرهای dev-only)
  - [x] لایه ۱: `src/lib/env.ts` — منبع حقیقت + `IS_DEV_MODE` / `IS_PROD_MODE`
  - [x] لایه ۲: `src/components/dev/DevOnly.tsx` — wrapper UI با dead-code elimination
  - [x] لایه ۳: `src/lib/utils/dev-response.ts` — `devOnlyPayload()` برای API
  - [x] لایه ۴: `src/components/dev/DevModeBadge.tsx` — Badge بصری، در `src/app/layout.tsx` نصب شد
  - [x] اولین مصرف‌کننده: `src/components/dev/DevOtpPanel.tsx` + ادغام در صفحه login
  - [x] `src/app/api/auth/request-otp/route.ts` — برگرداندن `devCode` با `devOnlyPayload()`
  - [x] `.env.example` و `.env.local` — افزودن `NEXT_PUBLIC_APP_MODE`
  - [x] `tsc --noEmit` بدون خطا

---

### TASK-005 | ثبت تعهد روزانه — ✅ ۲۰۲۶-۰۵-۲۷
- **وابستگی:** TASK-004
- **پیاده‌سازی:**
  - [x] DECISION-017/018/019 ثبت شد (Zustand، History، jalaali-js)
  - [x] `npm install jalaali-js @types/jalaali-js`
  - [x] `src/lib/utils/date.ts` — timezone ایران (UTC+3:30)، formatJalali، formatWeekday، canEdit، editTimeRemaining، getTodayDateForDB
  - [x] `src/lib/utils/auth-server.ts` — getSessionUser برای Server Components و API Routes
  - [x] `src/types/entry.ts` — SerializedEntry، CreateEntryInput/Result، UpdateEntryInput/Result
  - [x] `POST /api/entries` — ثبت تعهد + اعتبارسنجی + چک یک تعهد در روز + محاسبه editableUntil
  - [x] `GET /api/entries?today=1` — تعهد امروز کاربر
  - [x] `PATCH /api/entries/[id]` — ویرایش در بازه ۲ ساعته + قفل تنبل isLocked
  - [x] `src/components/features/entry/EntryForm.tsx` — فرم ثبت تعهد (Client Component، useTransition)
  - [x] `src/components/features/entry/EntryCard.tsx` — نمایش + ویرایش + countdown قفل (Client Component)
  - [x] `src/app/dashboard/page.tsx` — Server Component کامل با Nav، فرم/کارت بر اساس وضعیت
  - [x] `src/app/api/auth/logout/route.ts` — آپدیت: redirect برای فرم HTML + JSON برای fetch
  - [x] `tsc --noEmit` بدون خطا

---

### TASK-004 | طراحی سیستم Auth — ✅ ۲۰۲۶-۰۵-۲۷
- **پیاده‌سازی:**
  - [x] Schema: مدل `OtpCode` اضافه شد + migration `add_otp_code`
  - [x] نصب `jose` (JWT Edge-compatible)
  - [x] تایپ‌ها: `src/types/auth.ts` (SessionPayload، SessionResult)
  - [x] `src/lib/utils/otp.ts` — `generateOtpCode`, `normalizeIranPhone`, `getOtpExpiry`
  - [x] `src/lib/utils/session.ts` — `createSessionToken`, `verifySessionToken`, `SESSION_COOKIE`
  - [x] API Routes:
    - `POST /api/auth/request-otp` — تولید OTP، rate limiting ساده، ارسال از طریق SMSAdapter
    - `POST /api/auth/verify-otp` — تأیید کد، upsert User، صدور JWT در HTTP-only cookie
    - `POST /api/auth/logout` — پاک کردن cookie
  - [x] `src/middleware.ts` — محافظت از مسیرهای خصوصی، redirect به `/login` یا `/dashboard`
  - [x] `src/app/globals.css` — design tokens برند (PelakFA، رنگ‌ها، glass، animations)
  - [x] `src/app/layout.tsx` — RTL، `lang="fa"`, `dir="rtl"`, metadata همسو، PelakFA
  - [x] `src/app/login/page.tsx` — صفحه ورود ۲ مرحله‌ای (phone → OTP)، UI برند، countdown
  - [x] `.env.local` — متغیرهای dev
  - [x] `tsc --noEmit` بدون خطا

---

### TASK-003 | پیاده‌سازی Adapter ها — ✅ ۲۰۲۶-۰۵-۲۷
- **پیاده‌سازی:**
  - [x] تایپ‌ها: `src/types/ai.ts` (WeeklyReportInput/Output، WeeklyEntryItem) و `src/types/sms.ts` (SendOTPResult)
  - [x] Interface: `src/lib/adapters/ai.adapter.ts` (AIAdapter)
  - [x] Interface: `src/lib/adapters/sms.adapter.ts` (SMSAdapter)
  - [x] Mock: `src/lib/adapters/mock-ai.adapter.ts` — گزارش فارسی بر اساس داده واقعی، اعداد فارسی (DECISION-009)
  - [x] Mock: `src/lib/adapters/mock-sms.adapter.ts` — console.log OTP (DECISION-008)
  - [x] Factory: `src/lib/adapters/index.ts` — `getAIAdapter()` و `getSMSAdapter()` بر اساس env
  - [x] `tsc --noEmit` بدون خطا

---

### TASK-002 | تنظیم دیتابیس و Prisma — ✅ ۲۰۲۶-۰۵-۲۷
- **پیاده‌سازی:**
  - [x] نصب Prisma 6.19.3 و `@prisma/client` (downgrade از 7.x — DECISION-013)
  - [x] طراحی `prisma/schema.prisma` طبق CLAUDE.md §۷ (User, DailyEntry, EntryFeedback, GapRecord, WeeklyReport)
  - [x] اتصال SQLite (`provider = "sqlite"`, `file:./dev.db`)
  - [x] اولین migration: `20260526214728_init` — `prisma/dev.db` ساخته شد
  - [x] Prisma Client singleton در `src/lib/db/client.ts`
  - [x] محدودیت‌های SQLite در DECISION-012 ثبت شد (Enum → String، JSON → String serialized)
  - [x] فایل‌های constants ساخته شدند: `src/constants/plans.ts`, `src/constants/feedback.ts`
  - [x] `tsc --noEmit` بدون خطا

---

### TASK-001 | راه‌اندازی پروژه پایه — ✅ ۲۰۲۶-۰۵-۲۷
- **پیاده‌سازی:**
  - [x] `create-next-app` با TypeScript، Tailwind v4، App Router، `src/`, alias `@/*`
  - [x] `tsconfig.json` در حالت strict (پیش‌فرض scaffold — تأیید شد)
  - [x] ساخت ساختار پوشه‌ها طبق CLAUDE.md §۴
  - [x] انتقال assets قدیمی (`landing.html`, `Fonts/`, `logo.png`) به `public/`
  - [x] فایل `.env.example` با متغیرهای CLAUDE.md §۱۱
  - [x] به‌روزرسانی `.gitignore` (env، sqlite، IDE، vercel، logs)
  - [x] `npm install` انجام شد (۳۵۴ پکیج)
  - [x] `npx tsc --noEmit` بدون خطا
  - [x] DECISION-011 (landing.html) و DECISION-003 (به SQLite اصلاح شد) ثبت شدند
  - [x] اولین commit پروژه — ✅ ۲۰۲۶-۰۵-۲۹ `git init` + commit اول (`f05f319`) — 253 فایل، 22398 insertions

---

## 📋 Backlog — فاز ۱ (MVP Core)

## 📋 Backlog — فاز ۱.۵ (زیرساخت قبل از Expand)

> این فاز بعد از اتمام فاز ۱ (TASK-009 ✅) و قبل از شروع فیچرهای بزرگ فاز ۲ اجرا می‌شود.
> هدف: ساخت زیرساخت‌هایی که تمام فیچرهای بعدی به آن وابسته هستند.

### TASK-AI-ARCH | معماری AI — تکمیل (Versioning + e2e + docs)
- **اولویت:** 🟠 High (نه Critical — هسته در TASK-009 پیاده شد)
- **وابستگی:** TASK-009 ✅
- **منبع:** [docs/features/ai-architecture.md](docs/features/ai-architecture.md)، DECISION-020، DECISION-030
- **چرا حالا:** هسته معماری در TASK-009 ساخته شد؛ اینجا فقط تکمیل‌های جانبی
- **ساب‌تسک‌ها:** TASK-AI-ARCH-05 (نسخه‌پذیری advanced — A/B prompts)، TASK-AI-ARCH-06 (DevAIInspector تکمیل — فیلتر بر نقش/زمان)، TASK-AI-ARCH-07 (تست e2e)، TASK-AI-ARCH-08 (مستندسازی §۸ — کامل شد در TASK-009)

### TASK-DEV-AI-INSPECTOR | پنل dev برای لاگ AI
- **اولویت:** 🟡 Medium
- **وابستگی:** TASK-AI-ARCH
- **منبع:** dev-data-generation.md §۹
- **ساب‌تسک‌ها:** TASK-DEV-AI-01/02/03

### TASK-UI-REFACTOR | ریفکتور رابط کاربری پایه
- **اولویت:** 🔴 Critical (باید قبل از فیچرهای بزرگ فاز ۲ انجام شود)
- **وابستگی:** اتمام پیاده‌سازی اولیه (فاز ۱ ✅، فاز ۱.۵)
- **زمان اجرا:** پس از اتمام فاز ۱.۵ و پیش از شروع هر فیچر بزرگ فاز ۲
- **هدف:** بررسی و اصلاح UI/UX کل اپ با نگاه یکپارچه — نه در حین پیاده‌سازی
- **یادداشت:** جزئیات و scope دقیق در زمان شروع با صاحب پروژه تعیین می‌شود
- **ساب‌تسک‌ها:** در زمان شروع تعریف می‌شوند

---

## 📋 Backlog — فاز ۲ (Polish & Expand)

### TASK-WEEKLY-REPORT-ENHANCED | گزارش هفتگی پیشرفته (AI-driven insights)
- **اولویت:** 🟡 Medium (فاز ۲+)
- **وابستگی:** TASK-009 ✅
- **ایده‌های صاحب پروژه (۲۰۲۶-۰۵-۲۹) — مبنا: داده کاربر ارزش اصلی است:**
  - **بخش «نکات» عمیق‌تر:** AI به جای خلاصه رویدادها، الگوها و بینش‌های عمیق استخراج کند
  - **بخش «تأمل» (پلاس/پرو):** AI در نقش کوچ شخصی — توصیه‌های فردی بدون قضاوت، بدون «باید»
  - **بخش «خلاصه» بصری:** دسته‌بندی پویای تعهدات توسط AI (نه hardcode) + نمودار هیستوگرام
- **نیازمندی فنی:** تغییر `WeeklyReportOutput` schema + گسترش پرامپت به v2 یا نقش‌های جداگانه per-plan
- **کتابخانه نمودار:** تعیین می‌شود (Recharts / Chart.js / CSS-only)

### TASK-010 | SMS Provider واقعی — sms.ir
- **اولویت:** 🟡 In Progress (sandbox فعال)
- **وابستگی:** TASK-003
- **وضعیت ۲۰۲۶-۰۶-۰۶:** آداپتر `sms.ir` ساخته و در حالت **sandbox** فعال شد (DECISION-060).
  - فایل: `src/lib/adapters/smsir-sms.adapter.ts` (endpoint `POST /v1/send/verify`، `x-api-key`).
  - factory: `getSMSAdapter()` → `case "smsir"` (پیش‌فرض همچنان `mock`؛ Interface ثابت).
  - env: `SMS_PROVIDER="smsir"` + `SMSIR_API_KEY`/`SMSIR_TEMPLATE_ID`/`SMSIR_PARAM_NAME` در `.env.local`.
  - تأیید: تست واقعی sandbox (templateId=240766) → `status:1 موفق`؛ تست مسیر کامل (normalizeIranPhone→adapter) ✅.
- **وضعیت ۲۰۲۶-۰۶-۰۶ (مرحلهٔ ۲ — DECISION-061):** مدیریت کامل از پنل ادمین + observability.
  - دو مدل `SmsService`/`SmsLog` (db push)؛ resolver `src/lib/sms/services.ts` + مسیر مرکزی `src/lib/sms/send.ts`.
  - صفحهٔ `/admin/sms`: بنر سرویس فعال + CRUD سرویس‌ها + ارسال تستی + تاریخچهٔ ارسال (اثبات مسیر).
  - API: `/api/admin/sms/{services,services/[id],services/[id]/key,test,logs}`. nav فعال شد.
  - انتقال خودکار env→DB در seed. هر دو caller به مسیر مرکزی وصل شدند.
- **باقی‌مانده برای production:**
  - [ ] تأیید نام دقیق پارامتر داخل قالب 240766 (placeholder بین `#…#`) — فعلاً `Code`؛ sandbox نام پارامتر را اعتبارسنجی نمی‌کند.
  - [ ] از پنل: ساخت/پیش‌فرض‌کردن سرویس با کلید production و قالب نهایی (بدون تغییر کد).

### TASK-AI-PROVIDERS | اتصال Provider واقعی AI
- **اولویت:** 🟠 High
- **وابستگی:** TASK-AI-ARCH
- **منبع:** ai-architecture.md §۷
- **یادداشت ۲۰۲۶-۰۵-۲۹:** GapGPT adapter پیاده‌شده (`src/lib/adapters/index.ts` case "gapgpt") — key در .env.local موجود و فعال است. باقی‌مانده: Gemini، Fallback chain، rate limit
- **ساب‌تسک‌ها:** TASK-AI-PROV-01 (OpenAI ✅ — OpenAICompatibleAdapter)، TASK-AI-PROV-02 (GapGPT ✅)، TASK-AI-PROV-03 (Gemini — فاز ۲)، TASK-AI-PROV-04 (Fallback chain)، TASK-AI-PROV-05 (rate limit per plan)

### TASK-NOTIF | سیستم نوتیفیکیشن
- **اولویت:** 🟠 High
- **وابستگی:** TASK-PROFILE-BASE، TASK-DEV-DATA
- **منبع:** DECISION-023 (⏳ تعارض با مانیفست §۲ — رعایت سازگاری)
- **ساب‌تسک‌ها:**
  - [ ] TASK-NOTIF-01 | `NotificationAdapter` interface + Mock (in-app)
  - [ ] TASK-NOTIF-02 | مدل `NotificationPreference` per کاربر، granular per type
  - [ ] TASK-NOTIF-03 | API `/api/notifications` + UI لیست + علامت‌گذاری خوانده
  - [ ] TASK-NOTIF-04 | UI `/settings/notifications` — کنترل دقیق opt-in per type
  - [ ] TASK-NOTIF-05 | Trigger engine — وقایع: feedback یادآوری، گزارش هفتگی آماده
  - [ ] TASK-NOTIF-06 | Web Push (تنها زیرساخت — UI install در TASK-MOBILE-05)
  - [ ] TASK-NOTIF-07 | محافظ ضدفشار: cooldown اجباری، حداکثر ۱ در روز
  - [ ] TASK-NOTIF-08 | review لحن: هیچ پیام قضاوتی مجاز نیست

### TASK-PLAN | سیستم برنامه‌ریزی (نیت‌های بازه‌ای)
- **اولویت:** 🟡 Medium
- **وابستگی:** TASK-AI-ARCH، TASK-005 (تعهد روزانه)
- **منبع:** DECISION-024 (⏳ تعارض با §۱ — رعایت مرز Plan ≠ Task Manager)
- **ساب‌تسک‌ها:**
  - [ ] TASK-PLAN-01 | مدل Plan (محدود طبق DECISION-024: عنوان، بازه، متریک ساده، یادداشت)
  - [ ] TASK-PLAN-02 | API CRUD پلن — فقط یک سطح، هیچ sub-task
  - [ ] TASK-PLAN-03 | UI `/plans` — لیست نیت‌های جاری، نه backlog
  - [ ] TASK-PLAN-04 | UI ساخت پلن (ساده، بدون فرم پیچیده — رعایت §۲)
  - [ ] TASK-PLAN-05 | نقش AI `plan-suggestion` در Registry — پیشنهاد تعهد روزانه بر اساس پلن
  - [ ] TASK-PLAN-06 | یکپارچگی با dashboard: اگر پلن فعال داری، EntryForm یک hint محتاطانه نشان می‌دهد
  - [ ] TASK-PLAN-07 | dev seed: `POST /api/dev/seed/plan` (در TASK-DEV-DATA-04 ادغام)

### TASK-I18N | چندزبانگی (فارسی + انگلیسی)
- **اولویت:** 🟡 Medium (زیرساخت در فاز ۲، ترجمه کامل در فاز ۳)
- **وابستگی:** —
- **منبع:** DECISION-022 (⏳ تعارض با §۲ — فارسی همیشه canonical)
- **ساب‌تسک‌ها:**
  - [ ] TASK-I18N-01 | انتخاب کتابخانه (next-intl پیشنهادی)، تنظیم locale routing
  - [ ] TASK-I18N-02 | استخراج string های موجود به فایل‌های locale (fa.json default)
  - [ ] TASK-I18N-03 | UI language switcher در `/settings`
  - [ ] TASK-I18N-04 | LTR/RTL handling خودکار بر اساس locale
  - [ ] TASK-I18N-05 | AI Role: نسخه‌های `-en` در Registry برای نقش‌هایی که خروجی en می‌دهند (در فاز ۳)

### TASK-ADMIN-MVP | پنل ادمین (MVP)
- **اولویت:** 🟠 High
- **وابستگی:** TASK-PROFILE-BASE، TASK-AI-ARCH
- **منبع:** [docs/features/admin-panel.md](docs/features/admin-panel.md)، DECISION-026
- **ساب‌تسک‌ها:** TASK-ADMIN-MVP-01 تا 10 (سند مرجع)

### TASK-PAYMENT | درگاه پرداخت
- **اولویت:** 🟠 High
- **وابستگی:** TASK-ADMIN-MVP (پلن‌ها باید تعریف شده باشد)
- **منبع:** admin-panel.md §۶
- **ساب‌تسک‌ها:** TASK-PAYMENT-01 تا 06

#### TASK-PAYMENT-WALLET | کیف‌پول + شارژ کارت‌به‌کارت (راهکار موقتِ هم‌زیست) — ✅ انجام شد ۲۰۲۶-۰۶-۰۷ (DECISION-062)
- **چرا:** تا فراهم‌شدن درگاه، کیف‌پول واسطهٔ پرداخت است؛ خریدِ پلن از موجودی، شارژ با کارت‌به‌کارت و تأیید دستیِ ادمین. عمداً با درگاهِ آینده هم‌زیست (درگاه = منبعِ دیگرِ شارژ).
- **پیاده‌شده:**
  - schema (db push): `User.{walletBalance,paymentCardNumber,planExpiresAt}` + `BankCard` + `WalletTransaction`.
  - دامنه: `lib/wallet/wallet.ts` (شناسهٔ یکتا HM-hhmmdd-xxxx، تأیید/رد/اصلاح اتمیک)، `lib/payment/cards.ts`، `lib/plans/effective.ts` (پلنِ مؤثر + lazy-downgrade)، `lib/plans/purchase.ts` (تمدید هوشمند ۳۰/۳۶۵).
  - API کاربر: `/api/wallet/{topup,purchase,receipt}`، `/api/wallet`، `/api/account/payment-card`. API ادمین: `/api/admin/payment/{cards,cards/[id],topups,topups/[id]/{approve,reject}}`.
  - UI: `/wallet` (موجودی/کارت/شارژ/تاریخچه/رسیدِ canvas) + nav؛ `/plans` خرید/تمدید با کیف‌پول؛ پنل `/admin/payment` + badge؛ seed کارت از env.
  - هم‌ترازی: `getEffectivePlan` در چت/گزارش/تأمل/تیکتینگ/plans؛ اعطای دستیِ ادمین = بدون انقضا.
- **باقی‌مانده (فاز درگاه واقعی):** درگاه به‌عنوان منبعِ دومِ شارژِ کیف‌پول؛ صورتحساب رسمی؛ برداشت/بازگشت (در صورت نیاز).

### TASK-011 | سیستم پلن‌ها — 🔄 جایگزین شده
- **وضعیت:** این TASK به TASK-ADMIN-MVP-06/07 + TASK-PAYMENT تجزیه شد (DECISION-026)

### TASK-SOCIAL-MVP | اشتراک گزارش هفتگی (جایگزین TASK-012)
- **اولویت:** 🟡 Medium
- **وابستگی:** TASK-009
- **منبع:** [docs/features/social-network.md](docs/features/social-network.md)، DECISION-025
- **ساب‌تسک‌ها:** TASK-SOCIAL-MVP-01 تا 06

### TASK-012 | اشتراک‌گذاری خروجی‌ها — 🔄 جایگزین شده
- **وضعیت:** این TASK به TASK-SOCIAL-MVP تبدیل شد (DECISION-025)

---

## 📋 Backlog — فاز ۲.۵ (Advanced AI)

### TASK-AI-CHAT | چت‌بات همدل و همراه — Globally Accessible
- **اولویت:** 🟠 High
- **وابستگی:** TASK-AI-ARCH ✅ (هسته در TASK-009)، TASK-AI-PROVIDERS، TASK-PROFILE-FULL
- **منبع:** [docs/features/ai-architecture.md](docs/features/ai-architecture.md) §۷، **DECISION-031** (شخصیت + محدودیت‌ها + UI)
- **ساب‌تسک‌ها:**
  - [ ] TASK-AI-CHAT-01 | مدل DB: `ChatSession`، `ChatMessage`، `ChatRateLimit` (per user, per day count)
  - [ ] TASK-AI-CHAT-02 | نقش `chat-companion` در Registry + پرامپت `prompts/chat-companion/v1.fa.md`
    - شخصیت: همدل، آرام، مرز با ChatGPT روشن
    - خط قرمزها از DECISION-031
    - context injection: آخرین ۷ تعهد + گزارش هفته + پلن‌های فعال
  - [ ] TASK-AI-CHAT-03 | API `POST /api/chat/messages` + `GET /api/chat/messages?sessionId=...`
    - rate-limit middleware: chcek `ChatRateLimit` per plan (FREE=10, PLUS=50, PRO=200)
    - max طول پیام ۲۰۰۰ کاراکتر؛ max طول session ۲۰ تبادل
  - [ ] TASK-AI-CHAT-04 | UI: `<ChatFAB>` (Floating Action Button) globally در layout authenticated
    - گوشه پایین (راست در RTL یا چپ — تصمیم در زمان پیاده‌سازی)
    - tap → drawer/modal — `<ChatPanel>` با تاریخچه + ورودی + سند rate limit
    - **نمایش در `/login` و `/` (landing) ممنوع** — دو لایه چک: layout root + خود FAB
  - [ ] TASK-AI-CHAT-05 | پیام rate-limit: «امروز به اندازه کافی نوشتیم. فردا دوباره اینجاست.» — لحن همسو
  - [ ] TASK-AI-CHAT-06 | محافظ ضدوابستگی: cooldown نرم بعد از ۵ پیام پشت‌سرهم؛ پیام «این فکر می‌خواهی یا حال؟»
  - [ ] TASK-AI-CHAT-07 | حریم: دکمه «پاک کردن تاریخچه» + «خروج از این session» + export JSON
  - [ ] TASK-AI-CHAT-08 | محدودیت پلن (یکپارچه با TASK-PAYMENT): شمارش روزانه، reset در نیمه‌شب ایران
  - [ ] TASK-AI-CHAT-09 | dev tooling: `<DevChatBypass>` در DevDataPanel — bypass rate limit + seed conversation history
- **محافظ‌های ساختاری (مرجع DECISION-031):**
  - rate limit در **سرور** (نه فقط UI)
  - هیچ notification از طرف چت
  - context کاربر هرگز با کاربران دیگر mix نمی‌شود

### TASK-PROFILE-FULL | پروفایل کامل
- **اولویت:** 🟡 Medium
- **وابستگی:** TASK-PROFILE-BASE
- **توضیح:**
  - [ ] bio، avatar upload (محلی یا S3-adapter)
  - [ ] locale preference (همکار TASK-I18N)
  - [ ] notification preferences (همکار TASK-NOTIF)
  - [ ] export داده شخصی (GDPR-style)

### TASK-DEV-MOCK-USERS | کاربران Mock
- **اولویت:** 🟠 High
- **وابستگی:** TASK-DEV-DATA
- **منبع:** dev-data-generation.md §۶
- **چرا حالا:** قبل از شروع TASK-AI-CHAT و TASK-SOCIAL-CHALLENGES

### TASK-AI-PATTERN | نقش AI `pattern-insight`
- **اولویت:** 🟡 Medium
- **وابستگی:** TASK-AI-ARCH، تاریخچه ≥ ۳ ماه (یا seed)
- **توضیح:** تحلیل الگو در تاریخچه طولانی — یافتن trend ها به‌صورت غیرقضاوتی

---

## 📋 Backlog — فاز ۳ (Growth)

### TASK-MOBILE-PWA | تبدیل به PWA کامل
- **اولویت:** 🟠 High
- **منبع:** [docs/features/mobile.md](docs/features/mobile.md)، DECISION-027
- **ساب‌تسک‌ها:** TASK-MOBILE-01 تا 10

### TASK-MOBILE-CAPACITOR | Wrapper برای Stores (اختیاری)
- **اولویت:** 🟡 Medium
- **شرط:** اگر توزیع از طریق store مفید تشخیص داده شد

### TASK-SOCIAL-PROFILE | پروفایل عمومی
- **منبع:** social-network.md §۵
- **ساب‌تسک‌ها:** TASK-SOCIAL-PROF-01 تا 04

### TASK-SOCIAL-FRIENDS | سیستم دوستی
- **وابستگی:** TASK-SOCIAL-PROFILE
- **هشدار:** DECISION-025 — رعایت aggregate-only
- **ساب‌تسک‌ها:** TASK-SOCIAL-FR-01 تا 05

### TASK-SOCIAL-CHALLENGES | چالش‌های گروهی
- **وابستگی:** TASK-SOCIAL-FRIENDS، TASK-PLAN، TASK-DEV-MOCK-USERS
- **هشدار:** DECISION-025 — TASK-SOCIAL-CH-04 محافظ ساختاری
- **ساب‌تسک‌ها:** TASK-SOCIAL-CH-01 تا 05

### TASK-ADMIN-DASHBOARD | داشبورد KPI ادمین
- **منبع:** admin-panel.md §۶
- **ساب‌تسک‌ها:** TASK-ADMIN-DASH-01 تا 04

### TASK-ADMIN-SUPPORT | تیکتینگ
- **وابستگی:** TASK-NOTIF
- **ساب‌تسک‌ها:** TASK-ADMIN-SUP-01 تا 05

### TASK-ADMIN-CMS | مدیریت محتوا
- **ساب‌تسک‌ها:** TASK-ADMIN-CMS-01 تا 05

### TASK-ADMIN-ANALYTICS | آماری پیشرفته
- **وابستگی:** TASK-ADMIN-DASHBOARD
- **ساب‌تسک‌ها:** TASK-ADMIN-AN-01 تا 04

### TASK-ADMIN-DATA | داده‌ها و لاگ‌ها
- **ساب‌تسک‌ها:** TASK-ADMIN-DATA-01 تا 03

### TASK-ADMIN-INTEG | یکپارچگی‌های runtime
- **وابستگی:** TASK-PAYMENT، TASK-AI-PROVIDERS
- **ساب‌تسک‌ها:** TASK-ADMIN-INTEG-{SMS,AI,PAY,EMAIL,HEALTH}

### TASK-I18N-FULL | ترجمه کامل + AI Role های en
- **وابستگی:** TASK-I18N (زیرساخت)

---

## 📋 Backlog — فاز ۴+ (Future)

### TASK-MOBILE-RN | React Native (در صورت لزوم)
- **شرط:** فقط اگر PWA + Capacitor کفایت نکرد

### TASK-SOCIAL-CIRCLES | حلقه‌های همسویی
- **یادداشت:** placeholder — تصمیم نهایی پس از feedback کاربران فاز ۳

---

## 📏 قوانین این فایل

- هر وظیفه یک ID یکتا دارد (TASK-NNN یا TASK-NAME)
- فیچرهای عظیم → سند جدا در `docs/features/<name>.md` + ساب‌تسک‌های لینک‌شده
- وضعیت‌ها: `📋 Backlog` | `🔄 In Progress` | `✅ Done` | `⏸️ Blocked` | `🔄 جایگزین شده`
- وقتی Claude Code وظیفه‌ای را شروع می‌کند → به "وظیفه جاری" منتقل می‌شود
- وقتی تمام شد → به بخش "انجام‌شده" با تاریخ اضافه می‌شود (جدیدترین اول)
- اگر بلاک شد → دلیل بلاک شدن + لینک به QUESTIONS.md ثبت شود
- تسک‌های با تعارض مانیفست → DECISION-* مربوطه در توضیحات لینک شود

---

*آخرین بروزرسانی: ۲۰۲۶-۰۶-۰۸ — نقشه ادامه کار ۱۰‌تایی بر اساس بررسی وضعیت*
