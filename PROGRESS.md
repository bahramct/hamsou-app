# PROGRESS.md — وضعیت پیشرفت پروژه همسو

> خلاصه وضعیت هر فاز و آنچه تاکنون ساخته شده.

---

## آخرین تغییرات

### ریدیزاینِ Notion برای onboarding + toggle ادمین + تشخیصِ کندیِ Turbopack (۲۰۲۶-۰۶-۱۴) — DECISION-088
- **تشخیصِ کندی (مهم):** گزارشِ «هر صفحه > ۳۰ ثانیه» باگِ کدِ onboarding نبود؛ ردیابی نشان داد `proxy.ts` فقط JWT را verify می‌کند (بدونِ DB)، layout/getAiConfig/AmbientField سبک‌اند. علتِ واقعی = **باگِ شناخته‌شدهٔ Turbopack در Next 16** (issueهای رسمیِ vercel/next.js #80357/#85744)، تشدیدشده با `db push` وسطِ اجرای dev (invalidate شدنِ کلِ کش). **در production وجود ندارد.** رفعِ ریشه: پاک‌کردنِ `.next` + ری‌استارتِ dev.
- **ریدیزاینِ Notion:** پس‌زمینهٔ تمیز (حذفِ `AmbientField` از صفحهٔ onboarding + loading)، پنج پردهٔ تک‌تمرکز، کپیِ موجز.
- **پرسشِ شخصی‌ساز (امضای Notion):** پردهٔ «چه چیزی تو را به همسو آورد؟» (۴ گزینهٔ اختیاری). کاتالوگِ `lib/onboarding/motives.ts` + فیلدِ `User.onboardingMotive String?` (`db push` ✅). استفاده: لحنِ پایانیِ سفر + نمایش در پنلِ ادمین.
- **toggle ادمین (هم‌ترازی):** کلیدِ `onboarding.enabled` در `AppSetting` (resolverِ `isOnboardingEnabled()`); بخشِ تازهٔ `/admin/settings` («تنظیمات سایت») + `/api/admin/settings` + permissionهای `settings.read`/`settings.manage` (+ `npm run seed`). گِیتِ هم‌تراز در هر سه نقطهٔ ورود (onboarding page، verify-otp، settings/profile).
- `tsc --noEmit` ✅

### بستهٔ اصلاحاتِ ورود/پلن/فریز + هویتِ رنگیِ فریز (۲۰۲۶-۰۶-۱۴) — DECISION-087
- **اعتبارسنجیِ regex:** ماژولِ `lib/utils/validation.ts` (موبایل/ایمیل/نام‌کاربری/OTP + پیام‌های فارسی) وصل به همهٔ ورودی‌های ورود/ثبت‌نام/فراموشی رمز.
- **رنگِ فریز = دیزاین سیستم:** `sky-*` خام → توکنِ `mist` + توکنِ تازهٔ `--color-mist-deep`. اعمال در FreezePill/FreezeModal/FreezeActiveBanner + چیپ‌های گزارش + نمای فریزِ پنل ادمین (هم‌ترازی). تصاویرِ poster عمداً دست‌نخورده (تمایز از gap).
- **تقویمِ مودالِ فریز:** propِ `inline` در `JalaliDatePicker` (پاپ‌اوورِ in-flow تمام‌عرض) + بدنهٔ مودال اسکرول‌پذیر با اسکرول‌بارِ پنهان + چیدمانِ عمودیِ تاریخ‌ها → تقویم دقیقاً درونِ کادر باز می‌شود.
- **صفحهٔ پلن‌ها:** تیک‌ها پشت‌سرهم (مرتب‌سازیِ `featureRank`)؛ حذفِ «N روز مانده» از کارت؛ محافظتِ downgrade دیگر ساختارِ کارت را تغییر نمی‌دهد — فقط toast هنگامِ کلیک (enforcement سمتِ سرور ثابت).
- **نمایشِ OTP:** «کد ارسال‌شده به X» درونِ کادر، بدونِ نقطه‌چین، با لینکِ مجزای «تغییر شماره».
- **onboarding:** `loading.tsx` + موازی‌سازیِ awaitها (رفعِ کندی/قفلِ ظاهریِ ناشی از کامپایلِ dev).
- `tsc --noEmit` ✅ · `next build` ✅

### فیچر onboarding (سفرِ رواییِ تمام‌صفحه) + سه رفعِ ایراد (۲۰۲۶-۰۶-۱۴) — DECISION-086
- **جوهر:** کاربرِ تازه‌وارد به‌جای ورودِ خام به داشبورد، یک سفرِ رواییِ تمام‌صفحه (۴ پرده، بنچ‌مارک Calm/Headspace) می‌بیند: روایتِ همسو → نامِ تو → نامِ همدم → هدایتِ نرم به اولین تعهد. تصمیم‌های طراحی با پرسشِ ویژوال قطعی شد (قالب رواییِ تمام‌صفحه، شخصی‌سازیِ فقط‌هویت، پایان با اولین تعهد). قابلِ رد شدن در هر پرده (بی‌فشار، on-brand).
- **مدل داده (`db push`):** فیلدِ `User.onboardedAt DateTime?` + **backfillِ همهٔ کاربرانِ موجود به now** → فقط کاربرانِ واقعاً جدید (null) وارد سفر می‌شوند (بدونِ اخلالِ کاربرانِ قدیمی).
- **فایل‌ها:** `app/onboarding/page.tsx` (سرور + گارد + پیش‌فرضِ همدم از configِ ادمین) · `components/features/onboarding/OnboardingFlow.tsx` (کلاینت، ۴ پرده، DECISION-053) · `api/onboarding/complete` (نام‌ها + onboardedAt).
- **روتینگِ کاربرِ نو:** `verify-otp` → `isNew` (=onboardedAt null) → `/login` کاربرِ نو را به `/onboarding` می‌برد. مسیرِ ایمیل: `settings/profile` پس از ست‌شدنِ رمز و `onboardedAt==null` → `/onboarding`. راهنماییِ یک‌بارهٔ خوش‌آمد در `EntryForm` (sessionStorage).
- **رفع ایراد ۱ — مودالِ فریز تمام‌صفحه:** ریشه = `animate-fade-up` (fill-mode both) یک transform دائمی روی wrapper نگه می‌داشت → `position:fixed` در کادرِ کارت حبس می‌شد. راه‌حل: کامپوننتِ `ui/Portal.tsx` (createPortal به body) + `FreezeModal` از Portal.
- **رفع ایراد ۲ — نامِ کاربر در خوش‌آمدِ همدم:** placeholderِ `{{USER}}` (در `renderWelcome` + fallbackِ `ChatWindow` ← `ChatFAB` ← `layout`) با حذفِ آرامِ placeholder هنگامِ نبودِ نام. هم‌ترازیِ پنل: مستندِ placeholder در `AiSettingsForm` + `admin-catalog`.
- **رفع ایراد ۳ — کاربرِ OTP نو → onboarding:** پوشش‌داده در روتینگِ بالا.
- `db push` ✅ · backfill ✅ · `tsc --noEmit` ✅ · `next build` ✅

### فیچر «برنامه‌ریزی» — سفرِ یک‌هدفی روایی + کوچِ «همراه» (۲۰۲۶-۰۶-۱۳) — DECISION-082
- **جوهر:** یک هدفِ بازه‌ای + استوریِ روایی روزانه + استوری‌بوردِ افقیِ کارتی با خطِ زمانیِ ظریف + کوچِ AI «همراه». جایگزینِ DECISION-024 با حفظِ گاردهای ضدِ Task Manager (یک هدفِ فعال، بدون sub-task/استریک/درصد؛ استوری قابل‌ویرایش؛ هستهٔ روزانه دست‌نخورده).
- **مدل داده (`db push`):** `Goal` / `GoalStory` (mood اختیاری، visibility) / `GoalCompanionInsight` (یکتا per goal+dayKey = روزی‌یک‌بار) / `GoalReminder` (opt-in). relation `goals` روی User. seed idempotentِ ردیف‌های امکانِ غایب (۶ ردیف برای goal.*).
- **نقشِ AI «همراه» (`goal-companion`):** متمایز از «همدم» — تارگت‌منیجر/کوچِ حرفه‌ای. `prompts/goal-companion/v1.fa.md` (jsonMode، خط‌قرمزهای §۸: بدون باید/استریک/قضاوت) + Zod schema + register در bootstrap + ردیف در `AI_ROLES_ADMIN` (ویرایشِ پرامپت/روتینگ از پنل). فقط Pro؛ از روزِ سوم تا قبل از پایان؛ خطا → ۵۰۳ محترمانه.
- **پلن:** کلیدهای `goal.planning` (همه) و `goal.companion` (فقط PRO) در `plans/features.ts` (گروهِ «برنامه‌ریزی») — خودکار در `/admin/plans`؛ enforce با `planAllows` + `getEffectivePlanKey`.
- **API:** `/api/goal` (GET/POST، یک فعال، شروع≥امروز) · `/api/goal/[id]` (edit/complete/abandon) · `/story` + `/story/[id]` · `/companion` (Pro+پنجره+روزی‌یک‌بار) · `/reminder` (PUT). منطق در `lib/goal/dates.ts` + `lib/goal/server.ts` (نمای فعال + lazy-completion).
- **زمان‌بندِ یادآوری:** `lib/goal/reminder-scheduler.ts::runReminderTick` (با `getNow`/`iranClock` → time-travel، پنجرهٔ تحملِ ۲۰دقیقه، ضدِ تکرار با `lastFiredKey`). `GET/POST /api/cron/reminders` (محافظِ `CRON_SECRET`: Bearer/`x-cron-secret`/`?secret`) + `vercel.json` هر ۱۵دقیقه + `/api/dev/goal/reminder-tick` + دکمه در DevSeedPanel (§۱۳). کانال درون‌برنامه (`createNotification`) + ایمیل (`sendGoalReminderEmail`). کاتالوگِ نوتیف: `goal.reminder`/`goal.companion.ready`/`goal.completed` + آیکنِ `goal`.
- **UI:** `/goal` (CreateForm یا Storyboard) + `/goal/history` + آیتمِ «برنامه‌ریزی» در AppNav. کامپوننت‌ها در `src/components/features/goal/*`؛ استوری‌بوردِ افقی (انتخابِ مالک) با خطِ زمانیِ متصل‌کننده، بدون درصد/استریک. JalaliDatePicker؛ متنِ دکمه ثابت + Spinner + toast (DECISION-053).
- **هم‌ترازی:** تغییرِ پلن به PRO → دسترسیِ «همراه» فوری؛ روشن/خاموش goal.* از پنل بلافاصله enforce. نمای هدفِ کاربر در `/admin/users/[id]` عمداً اضافه نشد (حریم‌خصوصی §۷ — محتوای کاربر در پنل دیده نمی‌شود).
- `db push` ✅ · `seed` ✅ · `tsc --noEmit` ✅ · `next build` ✅

### بستهٔ بزرگ اصلاحات UI/UX + فرم تماس + خرید مستقیم پلن (۲۰۲۶-۰۶-۱۲) — DECISION-072/073/074/075
- **ناوبری و برند (DECISION-075):** لینک‌های قبل از ورود در همهٔ صفحات یکدست شد (صفحه اصلی · درباره ما · تماس با ما · بلاگ، با حالت active)؛ دکمهٔ تم در هر سه nav آخرین آیتم گوشهٔ چپ-بالا؛ لوگو بزرگ‌تر (nav ۴۴px / AppNav ۳۸px / فوتر ۵۰px) با ابعاد درست next/image (هشدار logo.png رفع شد).
- **فوتر ۴ ستونه:** برند + «آیینه‌ای، برای واقعی‌تر کردن زندگی» + سوشال مونوکروم (`SocialLinks` — X/اینستاگرام/واتساپ/تلگرام، آدرس‌ها بعداً) · محصول (anchors لندینگ + کاربران) · لینک‌های مفید · مجوزها: e-Namad و زرین‌پال در کادرهای هم‌سایز (`TrustBadges` — رندر مستقیم خروجی TrustCode چون document.write در React اجرا نمی‌شود).
- **فرم تماس + کپچای اختصاصی (DECISION-072):** کپچای SVG با ارقام فارسی + نویز، stateless با HMAC و انقضا (بدون گوگل/DB) — `lib/captcha/captcha.ts` + `GET /api/contact/captcha`. مدل جدید `ContactMessage` (db push با تأیید مالک) + `POST /api/contact` (honeypot + کپچا + سقف نرخ per-IP). سکشن CMS جدید `contact-form` جایگزین کارت رنگی شد؛ سوشال مونوکروم زیر فرم. پنل: `/admin/contact` با تب‌های جدید/خوانده/بایگانی + badge «پیام‌های تماس» (nav-counts).
- **بلاگ:** کارت‌های جمع‌وجور + `PostsExplorer` با دو چیدمان کاشی/لیستی و ذخیرهٔ ترجیح کاربر در localStorage؛ کارت شاخص تمام‌عرض حذف (اولین کارت با نشان «شاخص»).
- **صفحهٔ مقاله:** کاور هم‌عرض متن با سقف ارتفاع ۳۸۰px؛ متن justify (انتهای سطرها تراز)؛ سایدبار غنی‌تر (TOC + خواندنی‌ترین‌ها + برچسب‌ها + کارت بلاگ)؛ `metadataBase` به layout ریشه (رفع هشدار OG).
- **کامنت‌ها:** بازطراحی کارتی مدرن، راست‌چین و هم‌راستا با ستون مقاله؛ ریپلای داخل کارت؛ **کامنت کاربر تا تأیید ادمین فقط برای خودش gray-out** دیده می‌شود (API کامنت ساخته‌شده را برمی‌گرداند + localStorage per-slug با TTL ۷روزه؛ پس از تأیید خودکار عادی). تست موقت API: ۷/۷ ✅ (سپس داده پاک شد).
- **خرید مستقیم پلن از درگاه (DECISION-073):** مستقل از کیف‌پول — `quotePlanPurchase` مشترک + `POST /api/plans/checkout/gateway` + callback عمومی idempotent که پلن را اتمیک اعمال می‌کند (تمدید هوشمند؛ موجودی دست‌نخورده؛ کد تخفیف پس از پرداخت موفق مصرف می‌شود؛ edge ایمن downgrade → اعتبار به کیف‌پول). مودال خرید دو دکمهٔ مستقل: «خرید با کیف‌پول» / «پرداخت مستقیم از درگاه آنلاین» + `PlanReturnToast`. متن‌های «به‌زودی» حذف شد.
- **آمار تعهد (DECISION-074):** helper مشترک `lib/stats/commitments.ts` — تعهدهای داخل بازه‌های فاصله شمرده نمی‌شوند (دادهٔ گپ برای تحلیل می‌ماند). مصرف: پروفایل سایت + لیست و جزئیات کاربر پنل. «روز همراهی» طبق نظر مالک دست‌نخورده ماند.
- **هم‌ترازی پنل:** گیت «تیکت‌ها» و «چت آنلاین» در جزئیات کاربر از hardcode به `planAllows()` منتقل شد؛ پلن بدون تیکت → کارت غیرفعال «در این پلن نیست» (مثل چت).
- **ریزبهبودها:** لاگین با `SmoothHeight` بدون پرش بین تب‌ها؛ badge زنگوله با باز شدن پنل فوراً صفر می‌شود؛ مودال گزارش «اشتراک‌گذاری و دانلود» شد + قفل کامل اسکرول (html+body+overscroll-contain)؛ کارت‌های «خط قرمز» درباره ما گرید دو ستونه.
- `db push` ✅ · `tsc` ✅ · `next build` ✅ (۸۳ مسیر) · probe صفحات ✅

### درگاه پرداخت آنلاین (زرین‌پال) برای شارژ کیف‌پول (۲۰۲۶-۰۶-۱۲) — DECISION-071
- **Adapter Pattern:** اینترفیس `PaymentAdapter` (`payment.adapter.ts`) + `ZarinpalAdapter` (API v4، سندباکس/تولید با سوییچِ میزبان) + `MockPaymentAdapter`. factory `getPaymentAdapterForGateway` **config-محور** است: `provider=mock`→ماک آنی؛ `provider=zarinpal`+`isSandbox`→`sandbox.zarinpal.com` (تستِ بدونِ پول)؛ بدونِ سندباکس→تولید. هیچ کد فیچری مستقیم به درگاه وصل نمی‌شود.
- **اصلاحِ ۲۰۲۶-۰۶-۱۲ (سندباکسِ واقعی):** نسخهٔ اول در dev همیشه Mock می‌گذاشت (تستِ آنی/نامرئی، گیج‌کننده). با تأیید مالک پیش‌فرضِ dev به **سندباکسِ واقعیِ زرین‌پال** تغییر کرد — کاربر صفحهٔ واقعیِ درگاه را می‌بیند، بدونِ پولِ واقعی. پنل `PaymentGatewayManager` بنرِ «حالتِ فعال» (سندباکس/تولید/ماک) را زنده نشان می‌دهد. (انحرافِ تأییدشده از §۱۳.)
- **کانفیگ DB + پنل:** مدل `PaymentGateway` (آینهٔ SmsService) + resolver `getActivePaymentGateway()` (cache + null). مدیریت در `/admin/payment` با `PaymentGatewayManager` — `merchant_id` فقط Owner می‌بیند/ویرایش می‌کند. route `GET/PUT /api/admin/payment/gateway`.
- **مدل داده:** ۴ فیلدِ افزایشی به `WalletTransaction` (`gateway`, `authority @unique`, `gatewayRefId`, `cardPan`) — `db push` بدون migration.
- **جریانِ امن:** `createGatewayTopup`→`attachAuthority`→`verifyPayment`→`confirmGatewayTopup` (اتمیک در `$transaction`، idempotent با گاردِ status + یکتاییِ authority) / `failGatewayTopup`. مبلغ همیشه از tx (ضدِ دستکاری)؛ `currency:"IRT"` (تومان). اعلانِ `wallet.topup.approved` بازاستفاده شد.
- **Routeها:** `POST /api/wallet/topup/gateway` (شروع → startPayUrl) + `GET /api/wallet/topup/callback` (verify→شارژ→redirect با `?pay=`). callback در `PUBLIC_PATHS` چون کوکیِ سشن `SameSite=Strict` در redirectِ cross-site نمی‌آید (هندلر خودگارد است).
- **UI:** «پرداخت آنلاین» مسیرِ اصلیِ مودالِ شارژ (بدونِ نیاز به کارت)؛ کارت‌به‌کارت گزینهٔ دوم. `WalletReturnToast` بازخوردِ بازگشت. در پنل تراکنش‌های درگاهی با نشانِ «زرین‌پال» auto-approved.
- **هم‌ترازی (Admin/Project Parity):** ادمین درگاه را تنظیم می‌کند ↔ کاربر آنلاین شارژ می‌کند و موجودی اتوماتیک اضافه می‌شود؛ همان موجودی برای خرید پلن.
- `build` ✅ · `db push` ✅ · `seed` درگاه ✅ (در dev آزمایشی؛ merchant_id در prod از پنل)

### ری‌دیزاین UI بزرگ — دارک مود + تایپوگرافی + بلاگ + ادیتور (۲۰۲۶-۰۶-۱۰) — DECISION-067/068/069/070
- **دارک مود سراسری «شبِ گرم» (DECISION-067):** سایت + اپ + پنل ادمین. فلیپ توکن‌ها زیر `[data-theme="dark"]` (شامل `--color-white/black` تیلویند → پوشش خودکار پنل) + توکن‌های RGB معنایی (`--rgb-card/line/paper/bone`) برای رنگ‌های inline (۲۲ فایل). `ThemeScript` ضدفلش + `ThemeToggle` ۳حالته (سیستم/روشن/تاریک) در LandingNav/AppNav/AdminShell. گذار نرم `theme-anim`. خروجی‌های تصویر (share/receipt/QR) عمداً همیشه روشن.
- **ری‌دیزاین تایپوگرافی استاتیک (DECISION-070):** مقیاس ~۳۵٪ آرام‌تر در هر ۵ صفحهٔ CMS — هیرو ۹۲→۵۶px، سکشن ۵۰→۳۶px، بدنه ۱۹→۱۶px، پدینگ‌ها py-32→py-20؛ تزئینات (ribbon/step-num/qmark/btn-lg) کوچک‌تر. **توجه:** override فونتِ ذخیره‌شده در CMS مقدم است؛ در صورت نیاز «بازگردانی به طراحی کد».
- **ری‌دیزاین بلاگ (DECISION-068):** لیست با سایدبار شیشه‌ای چسبان (جستجوی سروری `?q=` + دسته‌ها + خواندنی‌ترین‌ها + ابر برچسب `?tag=`) + بنر فیلتر فعال. مقاله با TOC چسبان scroll-spy (`ArticleToc`؛ idهای فارسی یکتا در `renderMarkdown`/`extractHeadings`) + نوار پیشرفت مطالعه (`ReadingProgress`). کوئری‌های جدید: q/tagSlug در `getPublishedPosts`، `getPopularPosts`، `getPopularTags`.
- **ادیتور حرفه‌ای مقاله (DECISION-069):** Tiptap v3 WYSIWYG با خروجی Markdown — `RichMarkdownEditor` (تولبار کامل + لینک‌پاپ‌آور + درج تصویر base64 فشرده + حالت Markdown خام) + سریالایزر خودنوشت `tiptap-markdown.ts` (تست roundtrip ✅). DB و رندر سایت دست‌نخورده. `compressImage` مشترک شد. `safeImgUrl` فقط data:image base64 را مجاز کرد.
- `build` ✅ (۷۷ مسیر) · smoke-test زنده (لندینگ/بلاگ/مقاله/جستجو) ✅

### TASK-EMAIL-PROVIDER — Email Provider واقعی (Resend) + /admin/email (۲۰۲۶-۰۶-۰۹) — DECISION-064
- **ResendEmailAdapter:** `src/lib/adapters/resend-email.adapter.ts` — سه متد (`sendVerificationCode` / `sendVerificationLink` / `sendPasswordResetLink`) با HTML templates فارسی. پشت `EmailAdapter` interface.
- **DB-driven resolver:** مدل‌های `EmailService` / `EmailLog` در Prisma (آینهٔ `SmsService`/`SmsLog`) — `db push` بدون migration. Resolver `src/lib/email/services.ts` با TTL cache 10s (آینهٔ `sms/services.ts`).
- **Golden Rule ایمیل:** `src/lib/email/send.ts` — تنها نقطهٔ ارسال. هیچ کدی مستقیماً Adapter صدا نمی‌زند.
- **مهاجرت ۵ route:** `auth/email/request-code` · `account/email/request-code` · `account/reset-password/request` · `auth/forgot-password` · `admin/users/[id]/send-password-reset` — همه به `email/send.ts` وصل شدند.
- **بازیابی رمز فقط با ایمیل:** شاخهٔ username از `/forgot-password` (UI + API) کاملاً حذف شد — کاربر فقط ایمیل وارد می‌کند.
- **پنل ادمین `/admin/email`:** بنر سرویس فعال (provider + fromAddress + وضعیت آماده) + CRUD سرویس‌ها (کلید فقط Owner) + ارسال تستی + تاریخچهٔ EmailLog. nav sidebar فعال شد.
- **RBAC:** `email.read` / `email.send` / `email.manage` — ۳ permission جدید به catalog افزوده شد (seed idempotent، بدون migration). جمع: ۲۴ permission.
- **seed:** `prisma/seed.ts` — اگر `EMAIL_RESEND_API_KEY` در env باشد → `EmailService` Resend ساخته می‌شود؛ در غیر این صورت Mock. **.env.local** با کلید Resend و آدرس `noreply@hamsoo.app` به‌روز شد.
- **هم‌ترازی (Admin/Project Parity):** ادمین می‌تواند سرویس‌های ایمیل را مدیریت کند؛ همهٔ جریان‌های کاربر (ثبت‌نام/افزودن ایمیل/بازیابی رمز/ارسال ادمین) از همان سرویس DB-driven استفاده می‌کنند.
- `tsc` ✅ · `db push` ✅ · `seed` ✅

### اصلاحات UI — DECISION-063 (۲۰۲۶-۰۶-۰۸)
- **مسیریابی:** `/forgot-password`، `/reset-password`، `/verify-email` به `PUBLIC_PATHS` در `src/proxy.ts` افزوده شدند — کاربر ناشناس دیگر به login ریدایرکت نمی‌شود.
- **افزودن اولین کارت کیف‌پول:** دکمهٔ دَش‌دار «+ افزودن کارت بانکی» در `ProfileWalletSection` برای کاربری که هنوز کارتی ثبت نکرده نمایش داده می‌شود.
- **سال شمسی بدون جداکننده:** `faYear()` در `date.ts` — ۱۴۰۵ به‌جای ۱٬۴۰۵. اثر سراسری در هر جایی که `formatJalali`/`formatJalaliFromISO` استفاده می‌شود.
- **کارت ترکیبی پشتیبانی:** `SupportSection.tsx` (جدید) — تیکت + چت آنلاین در یک کارت با جداکننده. دکمه‌ها بر اساس `planAllows()` فعال/غیرفعال (grayed-out، بدون آیکون قفل). هم‌ترازی کامل با پنل ادمین.
- **رسید بدون scroll:** `WalletReceiptModal` از `transform: scale` به `zoom: 0.58` تغییر کرد — scrollbar حذف شد.
- `tsc` ✅.

### TASK-AUTH-RECOVERY — تأیید ایمیل لینکی + بازیابی رمز (۲۰۲۶-۰۶-۰۸)
- **تأیید ایمیل با لینک:** ثبت‌نام ایمیلی اکنون توکن ۳۲-بایتی (نه کد ۶ رقمی) در لینک ارسال می‌کند. کاربر روی لینک کلیک → صفحهٔ `/verify-email` خودکار تأیید → redirect به داشبورد. UI مرحلهٔ دوم ثبت‌نام: نمایش «ایمیل ارسال شد» + دکمهٔ ارسال مجدد.
- **بازیابی رمز:** `/forgot-password` — ایمیل یا نام‌کاربری می‌گیرد (بدون افشای وجود/عدم‌وجود حساب). لینک یک‌ساعته ارسال می‌شود. `/reset-password` — توکن validate + فرم رمز جدید.
- **EmailAdapter توسعه یافت:** `sendVerificationLink()` + `sendPasswordResetLink()` به Interface و MockAdapter افزوده شد.
- **credentials.ts:** `generateEmailToken()` (32-char hex) + `getVerificationLinkExpiry()` (24h) + `getResetLinkExpiry()` (1h).
- **بدون migration:** رویکرد بازاستفاده از `EmailCode.purpose` — مقادیر جدید `"signup"` (توکن‌محور) + `"reset-password"`.
- **لینک «رمز عبور را فراموش کردم»** به فرم ورود EmailLogin افزوده شد.
- **Admin parity (هم‌ترازی):**
  - Badge وضعیت تأیید ایمیل (سبز/قرمز) در بخش «هویت و ورود» صفحهٔ `/admin/users/[id]`
  - `EmailActions` component — «تأیید دستی ایمیل» + «ارسال لینک بازیابی رمز»
  - API routes: `POST /api/admin/users/[id]/verify-email` + `POST /api/admin/users/[id]/send-password-reset`
  - Audit log: `user.email.verify` + `user.send.password_reset`
  - Permission جدید: `users.write` به catalog افزوده شد (seed idempotent — بدون migration)
- `tsc` ✅ · `next build` ✅.

### TASK-PAYMENT-WALLET-V2 — بهبودهای کیف‌پول + مدیریت پلن (۲۰۲۶-۰۶-۰۸) — DECISION-062 تکمیل
- **کیف‌پول داخل پروفایل:** حذف از navbar؛ `ProfileWalletSection` در `/settings/profile` — موجودی + ۲ کارت + ۳ تراکنش اخیر + لینک به `/wallet`.
- **۲ کارت پرداختی کاربر:** `paymentCardNumber2` به User اضافه شد (db push)؛ API `DELETE /api/account/payment-card?slot=2` + `PUT` با `slot: 1|2`؛ در TopupPanel کاربر کارت ارسال را انتخاب می‌کند.
- **رسید حرفه‌ای:** بازطراحی `WalletReceiptCanvas` (680px، هدر تیره + جدول جزئیات + QR code واقعی + بارکد تزئینی)؛ `WalletReceiptModal` با `qrcode` npm و `html-to-image`.
- **آرشیو ادمین توپاپ:** فیلتر تب‌محور (همه/در انتظار/تأیید/رد) + صفحه‌بندی ۲۵تایی + نمایش هر ۲ کارت کاربر با علامت «استفاده شد»/«عدم تطابق!».
- **انتقال زمان باقی‌مانده:** `purchase.ts` — هم‌پلن فعال/ارتقا → زمان باقی‌مانده + مدت جدید؛ منقضی/FREE → از حالا.
- **نمایش زمان باقی‌مانده:** `getEffectivePlan` اکنون `daysLeft` برمی‌گرداند؛ نمایش در پروفایل hero + کارت پلن در `/plans` (نارنجی اگر ≤۳ روز).
- **هشدار ۳ روز:** در `getEffectivePlan` — اعلان `plan.expiring_soon` ساخته می‌شود، حداکثر یک‌بار در ۲۴ساعت (idempotent).
- **محافظ downgrade:** `purchase.ts` + `PlansPricing` دوطرفه — خرید پلن پایین‌تر در دورهٔ فعال مسدود است + پیام توضیحی در UI.
- `db push` ✅ · `tsc` ✅ · `next build` ✅.

### TASK-PAYMENT-WALLET — کیف‌پول + شارژ کارت‌به‌کارت + پلن مدت‌دار (۲۰۲۶-۰۶-۰۷) — DECISION-062
- **کیف‌پول واسطهٔ پرداخت** (هم‌زیست با درگاهِ آینده): خریدِ پلن از موجودی؛ شارژ با کارت‌به‌کارت و تأیید دستیِ ادمین. دو مدلِ جدید (`BankCard`/`WalletTransaction`) + سه ستونِ User (db push).
- **شارژ:** کاربر کارتش را ثبت می‌کند → درخواست شارژ → **شناسهٔ یکتا `HM-hhmmdd-xxxx`** + کارتِ مرجع → ادمین با تطبیقِ شناسه+کارت تأیید (مبلغِ قابل‌اصلاح) → کیف‌پول اتمیک شارژ + اعلان + **رسیدِ canvas قابل‌دانلود**.
- **خرید پلن مدت‌دار + تمدید هوشمند:** `planExpiresAt` افزوده شد (ماهانه ۳۰/سالانه ۳۶۵ روز)؛ هم‌پلن→تمدید، ارتقا→از حالا، اعطای دستیِ ادمین→بدون انقضا.
- **هم‌ترازی (هستهٔ مهم):** `getEffectivePlan` تنها مرجعِ پلنِ فعلی با lazy-downgrade انقضا → وصل به چت/گزارش/تأمل/تیکتینگ/plans؛ خواندن‌های موجود نمی‌شکنند.
- **درستیِ مالی:** تغییرِ موجودی فقط اتمیک با balanceAfter؛ مبلغ همیشه server-side (`applyDiscount`)؛ تأیید/خرید idempotent.
- صفحهٔ `/wallet` + nav · `/plans` خرید/تمدید با کیف‌پول · پنل `/admin/payment` + badgeِ در-انتظار · کارتِ مرجع از env سید شد.
- `db push` ✅ · `seed` ✅ · `tsc` ✅ · `next build` ✅.

### TASK-010 (مرحلهٔ ۲) — مدیریت پنل پیامک + اطمینان از مسیر (۲۰۲۶-۰۶-۰۶) — DECISION-061
- **منبع‌حقیقت به DB منتقل شد:** دو مدل `SmsService`/`SmsLog` (db push)؛ resolver `src/lib/sms/services.ts` + مسیر مرکزی `src/lib/sms/send.ts` (`sendVerificationSms` — تنها نقطهٔ ارسال، fallback: DB→env→mock).
- **پنل ادمین `/admin/sms`:** بنر «سرویس فعال» + مدیریت سرویس‌ها (CRUD، کلید فقط Owner) + «ارسال تستی» + «تاریخچهٔ ارسال». nav از «به‌زودی» فعال شد.
- **اطمینان:** هر ارسال در `SmsLog` با provider/sandbox/messageId ثبت می‌شود → بعد از ورود در سایت، رکورد تازه ثابت می‌کند مسیر smsir بوده نه mock.
- **هم‌ترازی/عدم‌شکست:** هر دو caller (ورود + افزودن موبایل) به مسیر مرکزی وصل شدند؛ `getSMSAdapter()` قدیمی حذف؛ resolver هرگز throw نمی‌کند؛ لاگ best-effort؛ کد OTP لاگ نمی‌شود و شماره ماسک می‌شود؛ انتقال خودکار env→DB در seed.
- `db push` ✅ · `seed` ✅ · `tsc` ✅ · `next build` ✅.

### TASK-010 — اتصال SMS واقعی sms.ir (sandbox فعال) (۲۰۲۶-۰۶-۰۶) — DECISION-060
- **آداپتر `SmsIrAdapter`** (`src/lib/adapters/smsir-sms.adapter.ts`): endpoint `POST /v1/send/verify` با `x-api-key`؛ موفقیت = `status:1`. تبدیل خودکار `+989…`→`09…`، timeout ۱۵s، بدون لو رفتن کلید، بدون throw.
- **opt-in**: `getSMSAdapter()` → `case "smsir"`؛ پیش‌فرض همچنان `mock` (سیستم فعلی دست‌نخورده). فعال‌سازی فقط با `SMS_PROVIDER="smsir"` در env.
- **sandbox و production یک endpoint**: برای محیط واقعی فقط کلید/قالب عوض می‌شود — صفر تغییر کد.
- **تست امن:** کلید نامعتبر→`status:10`، قالب اشتباه→`status:113`، قالب واقعی 240766→`status:1 موفق`. تست مسیر کامل کد ✅. `tsc` ✅.
- **باقی‌مانده (production):** تأیید نام پارامتر قالب 240766 (sandbox چک نمی‌کند؛ فعلاً `Code`)؛ کلید/قالب production.

### TASK-AUTH-MULTI (پالایش) — هویت در پروفایل + کراپرِ اختصاصی (۲۰۲۶-۰۶-۰۴) — DECISION-059
- **کارتِ یکپارچهٔ «هویت و ورود» در پروفایل:** چهار ردیفِ موبایل/ایمیل/نام‌کاربری/رمز با ویرایشِ inline. کاربرِ موبایلی ایمیل اضافه می‌کند و کاربرِ ایمیلی موبایل (OTP) — `IdentityCard`.
- **افزودنِ موبایل با OTP:** `api/account/phone/{request-code,verify}` (بدون تغییرِ schema).
- **`@username`:** در hero پروفایل و پنل ادمین نمایش داده می‌شود (پایهٔ تگ/منشن شبکهٔ اجتماعی).
- **رفعِ فضای خالی:** آواتار به hero منتقل و قابل‌ویرایش شد (`EditableAvatar`)؛ کارت‌های کم‌محتوا (`AvatarSection`، «اطلاعات حساب») حذف؛ چیدمانِ متوازن.
- **کراپرِ اختصاصیِ همسو:** بدونِ کتابخانه و بدونِ zoom/rotate — کادرِ مربعیِ قابل‌جابه‌جایی/قابل‌تغییراندازه؛ خروجی تا ۵۱۲px JPEG ۰.۹. `react-easy-crop` حذف شد.
- **پنل ادمین:** صفحهٔ کاربر همهٔ فیلدها را نشان می‌دهد حتی خالی‌ها. `settings/account` فقط حذفِ حساب.
- `tsc` ✅ · `next build` ✅.

### TASK-AUTH-MULTI — احراز هویتِ چندگانه + بازطراحیِ آواتار (۲۰۲۶-۰۶-۰۴) — DECISION-057/058
- **آواتار (۰۵۷):** پالتِ رنگ حذف شد؛ آواتارِ بدون‌عکس همیشه طلاییِ ثابت (`gold` #C19A4A) — سایت و پنل. انتخاب‌گرِ تصویرِ مدرن با کراپِ دایره‌ای (`react-easy-crop`)، خروجی ۵۱۲px JPEG با کیفیتِ بالا و حجمِ کنترل‌شده. بدونِ migration (ستونِ `avatarPreset` فقط legacy شد).
- **احراز هویت (۰۵۸):** علاوه بر موبایل/OTP، ثبت‌نام/ورود با ایمیل+پسورد و نام‌کاربری اضافه شد (فقط سایت). ثبت‌نامِ ایمیلی با تأییدِ کد از طریقِ `EmailAdapter` (mock در dev). ورودِ بعدی با ایمیل **یا** نام‌کاربری + پسورد. نام‌کاربری فعلاً اختیاری (با شبکهٔ اجتماعی اجباری می‌شود).
- **schema:** `phone` اختیاری شد؛ `email`/`passwordHash`/`username`/`emailVerifiedAt` + مدلِ `EmailCode` افزوده شد (`db push`، بدون data-loss به‌خاطرِ driftِ موجود).
- **session:** هویت بر پایهٔ `userId`؛ `phone` اختیاری شد. صفحاتِ ادمین/پروفایل/حذف‌حساب برای phone-nullable مقاوم شدند (نمایشِ ایمیل وقتی موبایل نیست).
- **UI:** بازطراحیِ صفحهٔ ورود با تبِ موبایل/ایمیل؛ بخشِ «امنیت و ورود» در `settings/account` برای افزودنِ ایمیل/نام‌کاربری/پسورد.
- **اعتبارسنجی:** `tsc --noEmit` ✅ · `next build` ✅.

---

## وضعیت کلی

| فاز | عنوان | وضعیت | درصد |
|-----|-------|--------|------|
| فاز ۰ | Setup | ✅ کامل | ۱۰۰٪ |
| فاز ۱ | MVP Core | ✅ کامل | ۱۰۰٪ |
| فاز ۱.۵ | Infrastructure (AI Arch + Dev Data + Profile Base) | 🔄 در جریان | ۳۳٪ |
| فاز ۲ | Polish & Expand (NOTIF + PLAN + I18N + AI Providers + Admin MVP + Payment + Social MVP) | ⏳ شروع نشده | — |
| فاز ۲.۵ | Advanced AI (Chat + Profile Full + Mock Users + Pattern) | ⏳ شروع نشده | — |
| فاز ۳ | Growth (Mobile PWA + Social Full + Admin Full + I18N Full) | ⏳ شروع نشده | — |
| فاز ۴+ | Future (RN، Circles) | ⏳ placeholder | — |

---

## نقشه فیچرهای بزرگ (۸ فیچر مطرح‌شده در ۲۰۲۶-۰۵-۲۷)

| فیچر | فاز | سند مرجع | تعارض مانیفست |
|------|-----|----------|----------------|
| سیستم برنامه‌ریزی | ۲ | TASKS.md TASK-PLAN | DECISION-024 ⏳ |
| سیستم نوتیفیکیشن | ۲ | TASKS.md TASK-NOTIF-CORE | DECISION-046 ✅ (موج ۱: toast + اعلان رویدادی) · یادآوری زمان‌محور → موج ۲ |
| پروفایل کاربری | ۱.۵ + ۲.۵ | TASKS.md TASK-PROFILE-{BASE,FULL} | — |
| AI پیشرفته (چت‌بات + Registry) | ۱.۵ زیرساخت / ۲.۵ چت | [ai-architecture.md](docs/features/ai-architecture.md) | DECISION-025 (وابستگی) |
| اپلیکیشن موبایل | ۳ (PWA-first) | [mobile.md](docs/features/mobile.md) | — |
| چندزبانگی fa/en | ۲ زیرساخت / ۳ ترجمه | TASKS.md TASK-I18N | DECISION-022 ⏳ |
| پنل ادمین | ۲ MVP / ۳ Full | [admin-panel.md](docs/features/admin-panel.md) | — |
| شبکه اجتماعی | ۲ MVP / ۳ Full | [social-network.md](docs/features/social-network.md) | DECISION-025 ⏳ |
| Dev Data Generation (cross-cutting) | ۱.۵ | [dev-data-generation.md](docs/features/dev-data-generation.md) | — |

---

## فاز ۰ — Setup

**هدف:** پایه‌گذاری پروژه، ابزارها، و مستندات

| وظیفه | وضعیت | یادداشت |
|-------|--------|---------|
| CLAUDE.md | ✅ | — |
| TASKS.md | ✅ | — |
| DECISIONS.md | ✅ | — |
| PROGRESS.md | ✅ | — |
| QUESTIONS.md | ✅ | — |
| راه‌اندازی Next.js | ✅ | TASK-001 (Next.js 16.x، React 19، Tailwind v4، App Router، `src/`) |
| ساختار پوشه‌ها | ✅ | طبق CLAUDE.md §۴ (`src/`, `prisma/`, `docs/`) |
| `.env.example` + `.gitignore` | ✅ | شامل sqlite و IDE |
| انتقال landing.html به public/ | ✅ | DECISION-011 — `public/landing.html` |
| Prisma Schema | ✅ | TASK-002 — SQLite، migration `init` اعمال شد |
| Prisma Client singleton | ✅ | `src/lib/db/client.ts` |
| Constants (plan/feedback) | ✅ | `src/constants/{plans,feedback}.ts` |
| Adapterها | ✅ | TASK-003 — AIAdapter، SMSAdapter (interface + mock + factory) |
| Dev/Prod Mode Architecture | ✅ | TASK-DEV-MODE — env.ts + DevOnly + devOnlyPayload + DevModeBadge (DECISION-016, CLAUDE.md §۱۳) |
| Landing Page (Next.js) | ✅ | TASK-LANDING — پورت کامل از landing.html به page.tsx; جریان / → /login → /dashboard |

---

## فاز ۱ — MVP Core

**هدف:** حداقل محصول قابل تست با کاربران اولیه

| قابلیت | وضعیت | یادداشت |
|--------|--------|---------|
| Auth (OTP تستی) | ✅ | TASK-004 — login/page.tsx + 3 API Route + middleware + JWT cookie |
| ثبت تعهد روزانه | ✅ | TASK-005 — EntryForm + EntryCard + 3 API Route + dashboard |
| بازخورد تعهد | ✅ | TASK-006 — FeedbackForm + گیت dashboard |
| مدیریت فاصله غیرفعالی | ✅ | TASK-007 — GapForm + گیت + قانون «بدون بازخورد، تعهد ممنوع» |
| تاریخچه | ✅ | TASK-008 — `/history` با Infinite Scroll |
| گزارش هفتگی AI | ✅ | TASK-009 — همراه با معماری کامل ۵ لایه (Registry/Orchestrator/PromptLoader/ProviderRouter) |

---

## فاز ۱.۵ — Infrastructure (آینده)

**هدف:** زیرساخت‌هایی که بدون آن فاز ۲ و بعد قابل اجرا نیست

| تسک | یادداشت |
|-----|---------|
| TASK-AI-ARCH | Registry/Orchestrator، prompt versioning، observability — DECISION-020 |
| TASK-DEV-DATA | time-travel + seed APIs + UI panels — DECISION-021 |
| TASK-DEV-AI-INSPECTOR | لاگ ورودی/خروجی هر فراخوانی AI در dev |
| TASK-PROFILE-BASE | displayName، avatar، صفحات settings پایه |

---

## فاز ۲ — Polish & Expand (آینده)

**هدف:** فیچرهای متوسط که MVP را تبدیل به محصول قابل عرضه می‌کنند

| تسک | یادداشت | تعارض |
|-----|---------|--------|
| TASK-010 | SMS Provider واقعی | — |
| TASK-AI-PROVIDERS | OpenAI، Gemini، fallback | — |
| TASK-NOTIF (۸ ساب‌تسک) | چندلایه، opt-in سختگیرانه | DECISION-023 ⏳ |
| TASK-PLAN (۷ ساب‌تسک) | نیت‌های بازه‌ای، نه Task Manager | DECISION-024 ⏳ |
| TASK-I18N (۵ ساب‌تسک) | زیرساخت i18n، فارسی canonical | DECISION-022 ⏳ |
| TASK-ADMIN-MVP (۱۰ ساب‌تسک) | کاربر، پلن، audit | — |
| TASK-PAYMENT (۶ ساب‌تسک) | درگاه + اشتراک | — |
| TASK-SOCIAL-MVP (۶ ساب‌تسک) | اشتراک گزارش با لینک یک‌بار مصرف | DECISION-025 ⏳ |

---

## فاز ۲.۵ — Advanced AI (آینده)

| تسک | یادداشت |
|-----|---------|
| TASK-AI-CHAT (۸ ساب‌تسک) | چت‌بات همراه، با محافظ ضد وابستگی |
| TASK-PROFILE-FULL | bio، avatar، prefs، export |
| TASK-DEV-MOCK-USERS (۴ ساب‌تسک) | کاربران mock برای تست social/chat |
| TASK-AI-PATTERN | نقش `pattern-insight` |

---

## فاز ۳ — Growth (آینده)

| تسک | یادداشت |
|-----|---------|
| TASK-MOBILE-PWA (۱۰ ساب‌تسک) | PWA کامل، offline-first، Web Push |
| TASK-MOBILE-CAPACITOR (اختیاری) | wrapper برای App Store/Bazaar |
| TASK-SOCIAL-PROFILE/FRIENDS/CHALLENGES | شبکه کامل با محافظ آنتی-رقابت |
| TASK-ADMIN-{DASHBOARD,SUPPORT,CMS,ANALYTICS,DATA,INTEG} | پنل کامل |
| TASK-I18N-FULL | ترجمه کامل + AI Role های en |

---

## تغییرات مهم (Changelog)

### ۲۰۲۶-۰۶-۰۲ — ریفکتور UI/UX سراسریِ اپِ کاربر (DECISION-051) ✅
- **جهت (تأیید مالک):** ارتقای اتمسفر و متریال با حفظ مینیمالیسم (نه افزایش چگالی) — حساسیتِ Pentagram، وفادار به «سکوت بصری».
- **`AmbientField`:** میدانِ گرادیانِ زندهٔ نرم (blobهای sage/mist/gold + وینیِت) زیرِ کلِ اپ؛ نرم‌تر/کندتر از لندینگ، ساکن زیر reduced-motion.
- **`AppShell`:** قالبِ مشترک (میدان + AppNav + لایه‌بندی z) — همهٔ صفحات از `bg-paper`ِ تخت به canvasِ زنده منتقل شدند.
- **AppNav:** اندیکاتورِ active انیمیشنی (خطِ زیرینِ `ease-expo`). **کرافت:** حذف ایموجی کارت تعهد → گلیفِ SVG؛ شیشه‌ای‌کردنِ کارت‌های گزارش؛ فاصله‌گذاریِ دسکتاپ.
- **پوشش:** dashboard/history/reports/plans/profile/account/notifications/support(+[id])/login.
- **روش:** پایلوتِ داشبورد → تأیید → تعمیم. `tsc` ✅ · `next build` ✅ (۴۴/۴۴). بدون migration.

---

### ۲۰۲۶-۰۶-۰۲ — رادارِ ۶‌بُعدِ ثابت + دو بهبود پشتیبانی (DECISION-050) ✅
- **رادار «نقشهٔ زندگی»:** حذف کامل منطق سه‌حالته (رادار/میله/متن). رادار حالا همیشه روی ۶ بُعدِ ثابت (`work/health/relationships/learning/calm/growth`) رسم می‌شود — متقارن در هر هفته. AI هر دسته را با فیلد `dimension` نگاشت می‌کند؛ گزارش‌های قدیمی با کلیدواژه/fallback. هیستوگرامِ خلاصه همان دسته‌های پویا را نگه داشت.
- **تیکت بسته:** تیکتِ `closed` دیگر قابل پاسخ نیست (API ۴۰۹ + UI). پیش‌تر پاسخ کاربر تیکت را بازگشایی می‌کرد.
- **badge سایدبار پنل:** «تیکت‌ها» و «چت آنلاین» شمارِ زنده (تیکت باز + چت خوانده‌نشده) دارند — `getSupportNavCounts` + poll هر ۲۰ث.
- **تأیید:** `tsc` ✅ · `next build` ✅. بدون migration.

---

### ۲۰۲۶-۰۶-۰۱ — چت آنلاین پشتیبانی (DECISION-049) ✅
- **چه:** کانال سوم ارتباطی مستقل (جدا از همدم/AI و تیکت) — گفتگوی زندهٔ انسانی، PRO-only، فقط ساعات کاری (شنبه–پنجشنبه ۹–۱۷، قابل‌تغییر از پنل).
- **داده (migration `support_live_chat`، تأیید مالک):** `SupportChatSession` (سشن روزانه) + `SupportChatMessage` + `AppSetting` (kv عمومی) + `User.supportChatHiddenUntil` (watermark) + `AdminUser.lastSeenAt` (presence).
- **کاربر:** کارت «پشتیبانی آنلاین» در پروفایل + پنجرهٔ کشویی هم‌خانوادهٔ همدم با نقطهٔ آنلاین، هیستوری روزانهٔ read-only، دکمهٔ پاک‌کردن (نزد پنل محفوظ)، badge خوانده‌نشده. polling تطبیقی پشت لایهٔ `chat-transport` (قابل‌ارتقا به WebSocket).
- **پنل:** کنسول `/admin/livechat` (صف + نمای زنده + پاسخ + heartbeat + خط «کاربر مخفی کرد») + تنظیمات `/admin/livechat/settings`.
- **اعلان پاسخ:** بدون نوتیفیکیشن (خواستهٔ مالک) → فقط badge. **تأیید:** `tsc` ✅.

---

### ۲۰۲۶-۰۶-۰۱ — حذف کامل Mock + رفع باگ روتینگ AI (DECISION-048) ✅
- **باگ:** dev/country=null → INTL → سرویس پیش‌فرض Mock → همهٔ سرویس‌ها (همدم/گزارش/تأمل) موک می‌شدند؛ چت JSON خام موک نشت می‌داد.
- **رفع:** Mock از کل پروژه حذف شد (آداپتر، factory، fallbackها، admin، DB، env/docs). Fallback سراسری اضافه شد تا تنها GapGPT به همهٔ مناطق سرویس دهد. نبودِ سرویس/کلید → خطای واضح، نه موکِ پنهان.
- **تست واقعی:** چت → پاسخ GapGPT واقعی (نه موک). `tsc` ✅ · `next build` ✅. بدون migration.

---

### ۲۰۲۶-۰۶-۰۱ — بازطراحی گزارش هفتگی v3 (DECISION-047) ✅
- **چرا:** تب خلاصه گاهی گمراه‌کننده بود (باگ «۱۰۰٪») و تحلیل کم‌عمق. مالک خواستار نقشِ «تحلیلگر رفتار» + جلوهٔ بصری کلاس‌جهانی شد.
- **سه ریشه رفع شد:** (۱) اعداد حالا در کد قطعی محاسبه می‌شوند نه AI (۲) ورودی AI غنی شد: اسکلت ۷روز + گپ‌ها + سیگنال ۴هفته (۳) mock بازنویسی شد.
- **پیاده‌سازی:** `prompts/weekly-report/v3.fa.md` + `weekly-reflection/v2.fa.md` · `lib/ai/roles/weekly-report/build-input.ts` · `lib/reports/weekly-analysis.ts` · route v3 · mock v3 · `WeeklyReportCard` v3 (نوار ۷روز + هیستوگرام پویا + گلس/انیمیشن).
- **تصمیم‌های مالک:** متریک چندبعدی صادقانه · سیگنال ۴ هفته · نمودار SVG دست‌ساز. بدون migration (سازگاری عقب با v1/v2).
- **تأیید:** `tsc --noEmit` ✅ · `next build` ✅

---

### ۲۰۲۶-۰۶-۰۱ — سیستم نوتیفیکیشن موج ۱ (DECISION-046) ✅
- **چرا:** اولین قدم نقشهٔ راهِ توافق‌شده با مالک. دامنهٔ تأییدشده: فقط زیرساخت + اعلان رویدادی (یادآوری زمان‌محور → موج ۲). State = Zustand.
- **دو لایه:** (۱) toast گذرا (`<ToastHost>` در layout ریشه، روی سایت + پنل) (۲) اعلان ماندگار (مدل `Notification` کاتالوگ‌محور + ناقوس در AppNav + صفحهٔ `/notifications` + کارت پروفایل).
- **پیاده‌سازی:** `src/lib/notifications/{catalog,toast,server}.ts` · `src/components/notifications/*` · `src/app/api/notifications/**` · migration `notifications`.
- **producerها (parity):** `support.replied` (پاسخ پشتیبان→کاربر) + `plan.changed` (تغییر پلن ادمین→اعلان کاربر).
- **توسعه‌پذیری:** نوع جدید = یک ردیف کاتالوگ؛ `channel` برای ارسال بیرونی (push/sms) آینده بدون بازنویسی.
- **تأیید:** `tsc --noEmit` ✅ · `next build` ✅

---

### ۲۰۲۶-۰۵-۲۸ — TASK-009 + معماری AI کامل ✅
- **چرا:** صاحب پروژه اطلاع داد که (۱) Provider واقعی خریداری شده، (۲) چندزبانگی → روی locale نیاز به چند Provider همزمان، (۳) AI چندنقشی است و پرامپت‌ها باید جدا باشند. این الزامات معماری ساده TASK-009 را نامناسب کرد.
- **تصمیمات جدید:**
  - DECISION-028: ProviderRouter — locale-aware routing (Stub در فاز ۱)
  - DECISION-029: پرامپت‌ها در پوشه `/prompts` ریشه — نسخه‌پذیر، locale-aware، جدا از کد
  - DECISION-030: ادغام TASK-009 با TASK-AI-ARCH — معماری از روز اول، نه prototype-then-migrate
  - DECISION-020 آپدیت — timing جدید
- **معماری ۵ لایه:** Consumer → Orchestrator → Registry+Roles → PromptLoader → ProviderRouter → AIAdapter
- **پیاده‌سازی:**
  - `src/lib/ai/{types,registry,prompt-loader,provider-router,observability,orchestrator,bootstrap}.ts`
  - `src/lib/ai/roles/weekly-report/{index,schema}.ts`
  - `prompts/README.md` + `prompts/weekly-report/v1.fa.md`
  - `src/lib/adapters/ai.adapter.ts` — refactor به interface generic
  - `src/lib/adapters/mock-ai.adapter.ts` — بازنویسی data-aware
  - `src/lib/utils/date.ts` — افزودن `getJalaaliWeekRange` و حلقه‌های ۷-روزه
  - `src/types/weekly-report.ts` — Serialized type
  - `src/app/api/reports/weekly/route.ts` — GET + POST idempotent
  - `src/app/reports/weekly/page.tsx` — Server Component
  - `src/components/features/reports/{WeeklyReportCard,GenerateReportButton}.tsx`
  - `src/components/dev/DevAIInspector.tsx` + تب 🧠 در DevDataPanel
  - `src/app/api/dev/ai/invocations/route.ts` — GET (لیست) + DELETE (پاک)
- **نکته کلیدی:** افزودن نقش جدید AI = ۵ دقیقه (پوشه + schema + prompt + register + invoke). بدون لمس Orchestrator/Router/Loader.
- **تأیید:** `tsc --noEmit` ✅ بدون خطا

---

### ۲۰۲۶-۰۵-۲۷ — افزودن ۸ فیچر کلان به نقشه راه ✅
- **چرا:** صاحب پروژه ۸ فیچر بزرگ مطرح کرد (برنامه‌ریزی، نوتیفیکیشن، پروفایل، AI پیشرفته، موبایل، چندزبانگی، ادمین، شبکه اجتماعی) + ۲ نگرانی cross-cutting (معماری AI، تولید داده تستی)
- **خروجی مستندات:**
  - ۵ سند جدید در `docs/features/`: ai-architecture، dev-data-generation، admin-panel، social-network، mobile
  - ۸ DECISION جدید (۰۲۰-۰۲۷) — ۵ مورد با وضعیت ⏳ به‌دلیل تعارض با مانیفست §۱/§۲
  - فازهای ۱.۵، ۲.۵ به نقشه راه افزوده شدند
  - TASKS.md با ~۳۰ تسک جدید (با ساب‌تسک) آپدیت شد
  - TASK-011 (پلن‌ها) و TASK-012 (اشتراک) جایگزین شدند (به TASK-ADMIN-MVP و TASK-SOCIAL-MVP)
- **تعارض‌های ثبت‌شده با مانیفست (نیاز به مرور صاحب پروژه):**
  - DECISION-022: i18n vs §۲ «فارسی اصیل» — حل: فارسی همیشه canonical
  - DECISION-023: نوتیف vs §۲ «بدون فشار» — حل: opt-in default-off، cooldown، لحن
  - DECISION-024: Plan vs §۱ «Task Manager نیست» — حل: مرز ساختاری، تک‌سطحی، بدون deadline
  - DECISION-025: Social vs §۱ «بدون رقابت» — حل: همسویی نه مسابقه، aggregate-only
  - (AI Chat با §۱ «وابستگی» نیز نگرانی دارد — در TASK-AI-CHAT-08 محافظ معماری دیده شده)

### فاز ۱ — TASK-005 (۲۰۲۶-۰۵-۲۷) — ثبت تعهد روزانه ✅
- **چرا:** هسته اصلی MVP — کاربر باید بتواند روزانه یک تعهد ثبت کند
- **پیاده‌سازی:**
  - `src/lib/utils/date.ts` — timezone ایران (UTC+3:30)، تقویم شمسی با `jalaali-js`، canEdit، editTimeRemaining
  - `src/lib/utils/auth-server.ts` — getSessionUser برای Server Components و API Routes
  - `src/types/entry.ts` — SerializedEntry (تاریخ‌ها ISO string برای انتقال Server→Client)
  - `POST /api/entries` — ثبت تعهد + اعتبارسنجی ۵-۵۰۰ کاراکتر + چک یک تعهد در روز
  - `GET /api/entries?today=1` — تعهد امروز
  - `PATCH /api/entries/[id]` — ویرایش در بازه ۲ ساعته + lazy-lock isLocked
  - `src/components/features/entry/EntryForm.tsx` — فرم Client با useTransition + router.refresh()
  - `src/components/features/entry/EntryCard.tsx` — نمایش + ویرایش + countdown ۳۰ ثانیه‌ای
  - `src/app/dashboard/page.tsx` — Server Component با Nav + logout + EntryForm/EntryCard
  - `src/app/api/auth/logout/route.ts` — redirect برای فرم HTML، JSON برای fetch
- **تصمیمات:**
  - DECISION-017: State Management = Zustand (نصب در TASK-006 که واقعاً نیاز باشد)
  - DECISION-018: تاریخچه = صفحه مستقل `/history`
  - DECISION-019: تاریخ شمسی = `jalaali-js`
- **نکته معماری:** داشبورد Server Component است → DB مستقیماً کوئری می‌شود؛ Client Components فقط interaction را مدیریت می‌کنند (useTransition + router.refresh)

---

### فاز ۰ — TASK-LANDING (۲۰۲۶-۰۵-۲۷) — Landing Page پورت به Next.js ✅
- **چرا:** جریان UX درست: `/` (لندینگ) → CTA «شروع کن» → `/login` → `/dashboard`
- **پیاده‌سازی:**
  - `src/app/page.tsx` — Server Component (سرعت بالا، SEO کامل، کل بخش‌های لندینگ)
  - `src/components/features/landing/LandingEffects.tsx` — Client Component برای scroll reveal + parallax
  - CSS های لندینگ (grain، blobs، buttons، reveals، ...) به `globals.css` اضافه شدند
  - Middleware: `/` به PUBLIC_PATHS اضافه شد؛ کاربران logged-in از `/` به `/dashboard`
  - CTA های «شروع کن» → `/login` (با `<Link>` از next/link)
- **نکته معماری:** page.tsx Server Component است و فقط JS افکت‌ها در client قرار دارند — بهترین تعادل بین UX و performance

### فاز ۰ — TASK-DEV-MODE (۲۰۲۶-۰۵-۲۷) — معماری Dev/Prod Mode ✅
- **چرا:** ساخت یک سیستم استاندارد جداسازی dev/prod که در کل پروژه (OTP، AI، پرداخت، …) قابل استفاده باشد. DECISION-016.
- **معماری ۴ لایه:**
  - لایه ۱ — منبع حقیقت: `src/lib/env.ts` (پرچم `IS_DEV_MODE` از `NEXT_PUBLIC_APP_MODE`، با fail-safe = prod)
  - لایه ۲ — محافظ UI: `<DevOnly>` در `src/components/dev/DevOnly.tsx`
  - لایه ۳ — محافظ API: `devOnlyPayload()` در `src/lib/utils/dev-response.ts`
  - لایه ۴ — نشانگر بصری: `<DevModeBadge>` در `src/components/dev/DevModeBadge.tsx` (در root layout)
- **اولین مصرف:** `DevOtpPanel.tsx` — نمایش کد OTP و auto-fill در صفحه login (فقط در dev)
- **تضمین‌ها:**
  - `NEXT_PUBLIC_APP_MODE` inline شده → tree-shaking کد dev از bundle prod
  - دفاع در عمق: API + UI + خود پنل، هر کدام مستقلاً چک می‌کنند
  - قانون اجباری در CLAUDE.md §۱۳ — هیچ فیچر dev-only بدون این لایه‌ها

### فاز ۰ — شروع پروژه
- مستندات پایه ساخته شدند
- معماری و استک فنی تعریف شد
- ابهامات اولیه در QUESTIONS.md ثبت شدند

### فاز ۰ — TASK-004 (۲۰۲۶-۰۵-۲۷) — فاز ۰ کامل شد ✅
- مدل `OtpCode` به Schema اضافه شد + migration دوم اعمال شد
- نصب `jose` برای JWT Edge-compatible
- Utilities: `otp.ts` (تولید، نرمال‌سازی شماره ایران، انقضا) + `session.ts` (JWT sign/verify)
- ۳ API Route برای auth: request-otp، verify-otp، logout
- Middleware با محافظت از مسیرهای خصوصی و redirect دو‌طرفه
- Design system کامل شد: globals.css با PelakFA + tokens برند + glass utilities
- Layout با RTL/fa — metadata همسو
- صفحه login ۲ مرحله‌ای: phone → OTP → dashboard (با countdown، تبدیل عدد فارسی)
- `.env.local` برای dev محلی

### فاز ۰ — TASK-003 (۲۰۲۶-۰۵-۲۷)
- تعریف تایپ‌های AI و SMS در `src/types/`
- پیاده‌سازی Interface های `AIAdapter` و `SMSAdapter` در `src/lib/adapters/`
- `MockAIAdapter`: تولید گزارش فارسی واقعی بر اساس داده‌های هفته (بدون hallucination)، اعداد فارسی
- `MockSMSAdapter`: چاپ OTP در console سرور برای توسعه محلی
- Factory functions در `src/lib/adapters/index.ts` — بر اساس env variable، Provider درست را برمی‌گرداند

### فاز ۰ — TASK-002 (۲۰۲۶-۰۵-۲۷)
- نصب Prisma — به دلیل breaking change در Prisma 7.x به نسخه 6.19.3 LTS downgrade شد (DECISION-013)
- طراحی Schema طبق CLAUDE.md §۷ (۵ مدل: User, DailyEntry, EntryFeedback, GapRecord, WeeklyReport)
- محدودیت‌های SQLite در طراحی رعایت شدند (Enum → String، JSON → String serialized) — DECISION-012
- migration اولیه `20260526214728_init` اعمال شد، `prisma/dev.db` ساخته شد
- Prisma Client singleton با محافظت در برابر Next.js HMR (`src/lib/db/client.ts`)
- Constants و type-guards برای plan و feedback status

### فاز ۰ — TASK-001 (۲۰۲۶-۰۵-۲۷)
- Scaffolding پروژه Next.js 16.x با TypeScript strict، Tailwind v4، App Router و `src/`
- ساختار پوشه طبق CLAUDE.md §۴ کامل شد (با `.gitkeep` در پوشه‌های خالی)
- assets قدیمی (`landing.html`, `Fonts/`, `logo.png`) به `public/` منتقل شدند
- `.env.example` و `.gitignore` (شامل قواعد SQLite) ساخته شدند
- `npm install` موفق؛ `tsc --noEmit` بدون خطا
- DECISION-003 از Postgres به **SQLite** اصلاح شد (در فاز MVP)
- DECISION-011 برای استراتژی نگه‌داشتن `landing.html` ثبت شد

---

### اصلاحاتِ صفحهٔ «برنامه‌ریزی» — ۲۰۲۶-۰۶-۱۳
- **DevDataPanel** از layout حذف شد (هنوز در `IS_DEV_MODE` موجود است)
- **دیتابیس** از کاربرانِ آزمایشی (۴ کاربر) و ادمینِ niloufar پاک شد
- **یک استوری در روز:** گارد `409` در API + `StoryComposer` حالتِ ویرایشِ استوریِ موجود را نشان می‌دهد
- **ویرایش هدف فقط روزِ اول:** `GoalEditModal` + `GoalDeleteModal` (دو انتخاب: رها/حذف‌کامل) + DELETE route
- **همراه از روز ۲:** `companionWindow()` — `before_day_2` جایگزینِ `before_day_3`؛ پیام‌ها آپدیت شدند
- **DayCard:** ری‌دیزاین — ارتفاعِ انعطاف‌پذیر، طراحیِ شیشه‌ایِ شیک، رنگِ mood‌دار
- **مودال‌ها:** بدون اسکرول‌بار داخلی، backdrop قوی‌تر — همسانِ الگوی سراسری
- `tsc --noEmit` ✅ · `next build` ✅

---

*این فایل پس از اتمام هر وظیفه مهم آپدیت می‌شود*
