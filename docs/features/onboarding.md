# فیچر onboarding — سفرِ خوش‌آمدگوییِ سبکِ Notion

> منبع: DECISION-086 (نسخهٔ اول) + DECISION-088 (ریدیزاینِ Notion + toggle ادمین + پرسشِ شخصی‌ساز)
> + DECISION-089 (سازندهٔ کاملِ اسلایدها در پنل + حذفِ اسلایدِ همدم).
> هدف: کاهشِ فاصلهٔ کاربرِ تازه‌وارد تا اولین تعهدِ معنادار، بدون نقضِ مانیفست
> (سکوت بصری، بدون گیمیفیکیشن، بدون فشار).

## فلسفه

بنچ‌مارک: Notion (پرسشِ راهبردیِ کوتاه که تجربه را شخصی می‌کند، یاد دادن حین انجام) +
Calm / Headspace (روایتِ آرام). best practice ۲۰۲۶: سفرِ کوتاه (۳–۵ پرده)، شخصی‌سازی بر
اساسِ ۱ پرسش که واقعاً تجربه را تغییر دهد، رساندنِ کاربر به اولین اقدامِ معنادار در < ۶۰ ثانیه.

تصمیم‌های قطعی (پرسشِ ویژوال از صاحب پروژه):
- **قالب:** سفرِ رواییِ تمام‌صفحه، سبکِ Notion — پس‌زمینهٔ **تمیز** (بدون `AmbientField`)، پرده‌های
  تک‌تمرکز، گذارِ نرم و سریع.
- **شخصی‌سازی:** روایت + یک **پرسشِ شخصی‌سازِ راهبردی** + نامِ کاربر. (نامِ همدم دیگر در سفر نیست — DECISION-089.)
- **پایان:** هدایتِ نرم به اولین تعهد.
- **کنترلِ ادمین:** سفر از پنل (`/admin/settings`) قابلِ روشن/خاموش + **ساختِ کاملِ اسلایدها** (DECISION-089).

## اسلایدها — قابلِ مدیریت از پنل (DECISION-089)

اسلایدها **هاردکد نیستند**؛ از `AppSetting` (کلید `onboarding.config`، JSON) خوانده و در پنل ساخته می‌شوند.
انواعِ اسلاید:

| نوع | کارکرد | محدودیت |
|-----|--------|---------|
| `narrative` | متنِ محض (عنوان/بدنه/زیرنویس/دکمه) | نامحدود — افزودن/حذف/جابجایی |
| `name` | ورودیِ نامِ کاربر (`displayName`) | حداکثر یکی، قابلِ خاموش‌کردن |
| `motive` | پرسشِ انگیزه (`onboardingMotive`) — برچسبِ گزینه‌ها ویرایش‌پذیر، slug ثابت | حداکثر یکی، قابلِ خاموش‌کردن |
| `final` | دکمهٔ پایان → ذخیره + هدایت به داشبورد | **همیشه یکی، همیشه آخر، حذف‌ناپذیر** |

- پیش‌فرض (`DEFAULT_ONBOARDING_CONFIG`): خوش‌آمد(روایی) → انگیزه → نام → پایان. **بدونِ اسلایدِ همدم.**
- placeholderِ `{name}` در متن‌ها → نامِ کاربر (یا حذفِ نرم اگر نباشد).
- هر پرده **قابلِ رد شدن** است؛ رد شدن هم `onboardedAt` را ست می‌کند. قانونِ متنِ دکمه (DECISION-053) رعایت شده.
- **گاردِ ضدِ Task Manager:** پرسشِ انگیزه می‌پرسد نه «هدف/تسک»؛ کاملاً اختیاری.
- نرمال‌سازیِ امن (`normalizeOnboardingConfig`): دقیقاً یک final (آخر)، حداکثر یک name/motive؛ ورودیِ نامعتبر → پیش‌فرض.

## نامِ همدم — admin-controlled (DECISION-089)

کاربر **هیچ‌جا** نمی‌تواند نامِ همدم را تغییر دهد: اسلایدِ همدم حذف شد، `companionName` از
`onboarding/complete` و `PATCH /api/profile` برداشته شد. منبعِ حقیقت = `chat.companion.defaultName`
(تنظیماتِ AI ادمین). `layout.tsx` هنگامِ null بودنِ `companionName` همان پیش‌فرضِ ادمین را می‌خواند
(هم‌تراز با `api/chat/messages`) تا هدرِ FAB/ChatWindow و پیامِ خوش‌آمد یکی باشند.

## انگیزهٔ ورود (motive)

- کاتالوگِ پایدار در `src/lib/onboarding/motives.ts` (slug + برچسبِ فارسی). مقدارِ ذخیره‌شده = **slug**
  (مقاوم در برابرِ تغییرِ متن). فیلد: `User.onboardingMotive String?` (nullable، DECISION-088).
- **استفادهٔ معنادار (هم‌ترازی):** (۱) لحنِ پردهٔ پایانیِ سفر؛ (۲) نمایش در پنلِ ادمین
  (`/admin/users/[id]` → «انگیزهٔ ورود») به‌عنوان زمینهٔ پشتیبانی. (آینده: زمینهٔ AIِ همدم/همراه.)

## کنترلِ ادمین (toggle)

- کلید: `onboarding.enabled` در `AppSetting` (پیش‌فرض روشن). resolver: `isOnboardingEnabled()`
  در `src/lib/settings/site.ts`.
- بخشِ پنل: `/admin/settings` («تنظیمات سایت») — permissionهای `settings.read` / `settings.manage`.
- **گِیتِ هم‌تراز** (هر سه نقطهٔ ورود به سفر این را چک می‌کنند): `onboarding/page.tsx`،
  `verify-otp` (`isNew`)، و ریدایرکتِ `settings/profile`. خاموش‌کردن = کاربرِ جدید مستقیم به داشبورد.

## معماری

```
verify-otp (isNew = onboardedAt===null) ─┐
                                          ├─► /onboarding ─► OnboardingFlow
email: profile (!needsPassword && !onboardedAt) ─┘            │
                                                              ▼
                                              POST /api/onboarding/complete
                                              (displayName + motive + onboardedAt)
                                                              │
                                                              ▼
                                              /dashboard (?hint از sessionStorage)
```

- **فیلدِ داده:** `User.onboardedAt DateTime?` — null یعنی هنوز سفر را ندیده.
  هنگامِ افزودن، **همهٔ کاربرانِ موجود backfill شدند** تا فقط کاربرانِ واقعاً جدید وارد سفر شوند.
- **گارد:** `/onboarding` اگر `onboardedAt` ست باشد → `/dashboard`.
- **هم‌ترازیِ همدم:** پیش‌فرضِ نامِ همدم از `getAiConfig(companionDefaultName)` (همان منبعِ پنلِ ادمین).

## فایل‌ها

| نقش | فایل |
|------|------|
| صفحهٔ سرور + گارد + گِیتِ toggle | `src/app/onboarding/page.tsx` + `loading.tsx` |
| فلوِ کلاینت (config-driven) | `src/components/features/onboarding/OnboardingFlow.tsx` |
| پیکربندیِ اسلایدها (types/Zod/default/normalize/getOnboardingConfig) | `src/lib/onboarding/config.ts` |
| کاتالوگِ slugهای انگیزه | `src/lib/onboarding/motives.ts` |
| API پایان | `src/app/api/onboarding/complete/route.ts` (`displayName`/`motive` — بدونِ companionName) |
| روتینگِ OTP | `src/app/api/auth/verify-otp/route.ts` (`isNew`) + `src/app/login/page.tsx` |
| روتینگِ ایمیل | `src/app/settings/profile/page.tsx` (ریدایرکت) |
| راهنماییِ داشبورد | `src/components/features/entry/EntryForm.tsx` (`hamsoo_welcome_hint`) |
| toggle + سازندهٔ اسلاید (ادمین) | `src/lib/settings/site.ts` + `/admin/settings` + `/api/admin/settings` + `OnboardingBuilder` |
| نمایشِ انگیزه در پنل | `src/app/admin/(panel)/users/[id]/page.tsx` (`motiveLabelFromConfig`) |
| شارژِ دستیِ کیف‌پول (هم‌ترازی) | `/api/admin/users/[id]/wallet` + `AdminWalletCharge` + `adjustBalance` + اعلانِ `wallet.adjusted` |

## رفع ایرادهای هم‌بسته (DECISION-086)

1. **مودالِ فریز تمام‌صفحه:** `Portal` (`src/components/ui/Portal.tsx`) → `FreezeModal` از body رندر می‌شود
   تا از containing-blockِ transform-دارِ والد (`animate-fade-up` با `fill-mode:both`) فرار کند.
2. **نامِ کاربر در خوش‌آمدِ همدم:** placeholderِ `{{USER}}` در templateِ خوش‌آمد
   (`renderWelcome` در `api/chat/messages` + fallbackِ `ChatWindow`)؛ مستندِ پنل در `AiSettingsForm`.
3. **کاربرِ OTP نو → onboarding:** بخشِ روتینگ بالا.

## تستِ سرتاسری (dev)

- کاربرِ جدید با OTP → پس از تأیید کد به `/onboarding` (نه داشبورد).
- رد کردن در هر پرده → `onboardedAt` ست، دیگر دیده نمی‌شود.
- تکمیل با نام → داشبورد + راهنماییِ یک‌بارهٔ خوش‌آمد + همدم با نامِ کاربر سلام می‌کند.
- مودالِ فریز → کلِ صفحه محو، تمام‌صفحه.
- کاربرِ قدیمی (backfill) → بدونِ سفر، مستقیم داشبورد.
