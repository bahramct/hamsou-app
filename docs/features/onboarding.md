# فیچر onboarding — سفرِ رواییِ تمام‌صفحه

> منبع: DECISION-086. هدف: کاهشِ فاصلهٔ کاربرِ تازه‌وارد تا اولین تعهدِ معنادار،
> بدون نقضِ مانیفست (سکوت بصری، بدون گیمیفیکیشن، بدون فشار).

## فلسفه

بنچ‌مارک: Calm / Headspace (روایتِ آرام، شخصی‌سازیِ کوتاه) و Notion (یاد دادن حین انجام).
best practice ۲۰۲۶: سفرِ کوتاه (۳–۵ پرده)، شخصی‌سازی بر اساس ۱–۲ پرسش که واقعاً تجربه را
تغییر دهد، رساندنِ کاربر به اولین اقدامِ معنادار در کمتر از ۶۰ ثانیه.

تصمیم‌های قطعی (پرسشِ ویژوال از صاحب پروژه):
- **قالب:** سفرِ رواییِ تمام‌صفحه.
- **شخصی‌سازی:** فقط هویت — نامِ کاربر + نامِ همدم (بدون هدف/نیت → گاردِ ضدِ Task Manager).
- **پایان:** هدایتِ نرم به اولین تعهد.

## چهار پرده

| # | پرده | محتوا |
|---|------|-------|
| ۰ | روایت | «هر روز یک تعهدِ کوچک. فردا یک بازخوردِ صادق. در پایانِ هفته نگاهی عمیق.» — لحنِ مانیفست |
| ۱ | نام تو | `displayName` (≤ ۵۰) |
| ۲ | نام همدم | `companionName` (≤ ۳۰)، پیش‌فرض از تنظیماتِ ادمین |
| ۳ | اولین قدم | CTA «اولین تعهدم را بنویسم» → ذخیره + هدایت به داشبورد |

- هر پرده **قابلِ رد شدن** است (دکمهٔ آرامِ «رد شدن»). رد شدن هم `onboardedAt` را ست می‌کند.
- نقطه‌های پیشرفت ساده (بدون درصد/امتیاز). قانونِ متنِ دکمه (DECISION-053) رعایت شده.

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
| صفحهٔ سرور + گارد | `src/app/onboarding/page.tsx` |
| فلوِ کلاینت (۴ پرده) | `src/components/features/onboarding/OnboardingFlow.tsx` |
| API پایان | `src/app/api/onboarding/complete/route.ts` |
| روتینگِ OTP | `src/app/api/auth/verify-otp/route.ts` (`isNew`) + `src/app/login/page.tsx` |
| روتینگِ ایمیل | `src/app/settings/profile/page.tsx` (ریدایرکت) |
| راهنماییِ داشبورد | `src/components/features/entry/EntryForm.tsx` (`hamsoo_welcome_hint`) |

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
