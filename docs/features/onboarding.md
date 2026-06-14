# فیچر onboarding — سفرِ خوش‌آمدگوییِ سبکِ Notion

> منبع: DECISION-086 (نسخهٔ اول) + DECISION-088 (ریدیزاینِ Notion + toggle ادمین + پرسشِ شخصی‌ساز).
> هدف: کاهشِ فاصلهٔ کاربرِ تازه‌وارد تا اولین تعهدِ معنادار، بدون نقضِ مانیفست
> (سکوت بصری، بدون گیمیفیکیشن، بدون فشار).

## فلسفه

بنچ‌مارک: Notion (پرسشِ راهبردیِ کوتاه که تجربه را شخصی می‌کند، یاد دادن حین انجام) +
Calm / Headspace (روایتِ آرام). best practice ۲۰۲۶: سفرِ کوتاه (۳–۵ پرده)، شخصی‌سازی بر
اساسِ ۱ پرسش که واقعاً تجربه را تغییر دهد، رساندنِ کاربر به اولین اقدامِ معنادار در < ۶۰ ثانیه.

تصمیم‌های قطعی (پرسشِ ویژوال از صاحب پروژه):
- **قالب:** سفرِ رواییِ تمام‌صفحه، سبکِ Notion — پس‌زمینهٔ **تمیز** (بدون `AmbientField`)، پرده‌های
  تک‌تمرکز، گذارِ نرم و سریع.
- **شخصی‌سازی:** روایت + یک **پرسشِ شخصی‌سازِ راهبردی** + هویت (نامِ کاربر + نامِ همدم).
- **پایان:** هدایتِ نرم به اولین تعهد (لحنِ متناسب با انگیزهٔ انتخابی).
- **کنترلِ ادمین:** سفر از پنل (`/admin/settings`) قابلِ روشن/خاموش است (هم‌ترازی سایت↔پنل).

## پنج پرده

| # | پرده | محتوا |
|---|------|-------|
| ۰ | خوش‌آمد | «هر روز یک تعهدِ کوچک. فردا یک بازخوردِ صادق. در پایانِ هفته نگاهی عمیق.» — لحنِ مانیفست |
| ۱ | پرسشِ شخصی‌ساز | «چه چیزی تو را به همسو آورد؟» — ۴ گزینه (نظمِ روزانه/آرامش/خودشناسی/تغییرِ مشخص)، **اختیاری** |
| ۲ | نام تو | `displayName` (≤ ۵۰) |
| ۳ | نام همدم | `companionName` (≤ ۳۰)، پیش‌فرض از تنظیماتِ ادمین |
| ۴ | اولین قدم | CTA «اولین تعهدم را بنویسم» → ذخیره + هدایت به داشبورد |

- هر پرده **قابلِ رد شدن** است (دکمهٔ آرامِ «رد شدن»). رد شدن هم `onboardedAt` را ست می‌کند.
- نقطه‌های پیشرفت ساده (بدون درصد/امتیاز). قانونِ متنِ دکمه (DECISION-053) رعایت شده.
- **گاردِ ضدِ Task Manager:** پرسشِ شخصی‌ساز «انگیزه» را می‌پرسد، نه «هدف/تسک»؛ کاملاً اختیاری.

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
                                              (displayName + companionName + onboardedAt)
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
| فلوِ کلاینت (۵ پرده) | `src/components/features/onboarding/OnboardingFlow.tsx` |
| کاتالوگِ انگیزه | `src/lib/onboarding/motives.ts` |
| API پایان | `src/app/api/onboarding/complete/route.ts` (`displayName`/`companionName`/`motive`) |
| روتینگِ OTP | `src/app/api/auth/verify-otp/route.ts` (`isNew`) + `src/app/login/page.tsx` |
| روتینگِ ایمیل | `src/app/settings/profile/page.tsx` (ریدایرکت) |
| راهنماییِ داشبورد | `src/components/features/entry/EntryForm.tsx` (`hamsoo_welcome_hint`) |
| toggle ادمین | `src/lib/settings/site.ts` + `/admin/settings` + `/api/admin/settings` |
| نمایشِ انگیزه در پنل | `src/app/admin/(panel)/users/[id]/page.tsx` |

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
