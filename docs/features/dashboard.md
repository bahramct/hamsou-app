# داشبوردِ یکپارچه — «امروز + مسیرِ من»

> منبع: DECISION-092 (TASK-28). اجرا فازبندی‌شده. این سند فاز ۱ را پوشش می‌دهد.

## چرا؟
فیچرها «جزیره‌ای» بودند و `/dashboard` پس از ثبتِ تعهد بن‌بست می‌شد. هدف: یک داشبوردِ یکپارچه که جزیره‌ها را به‌صورتِ پنجره‌های زنده کنارِ هم می‌آورد، بدونِ شکستنِ هستهٔ تک‌تمرکز و خط‌قرمزهای مانیفست (بدون استریک/نمره/گیمیفیکیشن).

## ساختار (فاز ۱)
صفحهٔ `src/app/dashboard/page.tsx` (Server Component):

```
① ردیفِ بالا (grid دو‌ستونه):
   [ TodayPanel (کادر سبز) ]  [ هیروِ «امروز» (گیت‌دار) ]
② «مسیرِ من» (بِنتو، flex با ارتفاعِ هم‌تراز):
   [ GoalTile (هیرو) ] [ PulseTile ]
                       [ RecentTile ]
   [ ReportTile ]      [ PlanTile ]
```

### هیروِ «امروز» — دست‌نخورده
گیتینگِ قبلی **بدونِ تغییر** فقط به اسلاتِ هیرو منتقل شد:
`activeFreeze → FreezeActiveBanner · pendingFeedback → FeedbackForm · pendingGap → GapForm · entry → EntryCard · else → EntryForm`.
`EntryForm`/`EntryCard` (و FreezePill داخلشان) تغییر نکردند. برخلافِ قبل، حالا بِنتو و کادر سبز **همیشه** نمایش داده می‌شوند (حتی هنگام گیت).

### کادر سبز — `TodayPanel.tsx` (client)
همان `.glass` بقیهٔ کارت‌ها (هماهنگی با دیزاین‌سیستم). ساعتِ عقربه‌ایِ **نقطه‌ایِ شفافِ live** (`requestAnimationFrame`، عقربهٔ ثانیه `sage`) + ساعتِ دیجیتال + تاریخِ جلالی + سلامِ زمان‌آگاه + **نوارِ هفتگی** (هر روز با نقطهٔ فعالیت؛ تعهدِ آن روز در hover). ناحیهٔ ساعت `flex-1` تا کادر هم‌قدِ ستونِ هیرو شود (بدونِ خلأ). انتخابِ مالک: «هفتگی + ساعتِ نقطه‌ای».

### تایل‌ها — `src/components/features/dashboard/`
- **GoalTile** — هدفِ فعال از `loadActiveGoalView`: عنوان، روز X از Y، استوریِ امروز، پنلِ همراه (`flex-1`؛ Pro=آخرین بینش، غیر‌Pro=معرفیِ آرامِ قفلِ نرم)، CTA «بازکردنِ هدف». بدونِ هدف → دعوتِ آرام.
- **PulseTile** — «نبضِ هفته»: ۷ سلولِ دسته‌ای (wrote/empty/freeze/future) + راهنما + جملهٔ **اول‌شخص** («این هفته ۴ روز نوشتم…»). فقط در این تایلِ داشبورد.
- **RecentTile** — ۳ تعهدِ آخر + دکمه‌ای که **مودالِ ۳۰‌روزه** را باز می‌کند (جایگزینِ صفحهٔ /history).
- **ReportTile** — خلاصهٔ آخرین `WeeklyReport` (parse از `aiContent.content`) یا دعوت.
- **PlanTile** — پلنِ مؤثر + روزهای مانده + موجودیِ کیف + میان‌برِ کیف‌پول/پشتیبانی/ارتقا.

### داده
- helperِ `src/lib/dashboard/activity.ts::getWeekActivity(userId)` — هفتهٔ جاری (`getCurrentWeekRange`) per روز: `{ dateIso, jalaliDay, weekdayShort, isToday, state, entryContent }` از `DailyEntry` + `GapRecord(type:"freeze")`. مصرف: `TodayPanel` + `PulseTile`. قطعی، بدون AI.
- بازاستفاده: `loadActiveGoalView`، آخرین `WeeklyReport`، `getEffectivePlan`، `formatJalali`/`jalaaliTodayParts`/`JALALI_MONTH_NAMES`.

## تاریخچه
صفحهٔ مستقلِ `/history` و آیتمِ navbarِ آن **حذفِ کامل** شدند؛ تاریخچه حالا فقط مودالِ ۳۰‌روزه (`RecentHistoryModal`) از داشبورد است. ماژول‌های `HistoryList`/`HistoryItem`/`api/history`/`types/history` پاک شدند.

## هم‌ترازی ادمین↔پروژه
فاز ۱ هیچ فیچرِ ادمینی اضافه/تغییر نکرد؛ گیتِ پلن (`goal.companion`) دست‌نخورده. ✅

## فازهای بعد
- **فاز ۲ ✅ (DECISION-093):** هدف/چالش (`Goal.type`، `db push`) + سقفِ ۳۰ روز (toast، در ساخت+ویرایش) + `GoalTypeBadge` در هدر/داشبورد/تاریخچه + `JourneyRail` (خطِ تختِ فلش‌دار + نشانِ همراه، جایگزینِ `DayCard`) + navbar «برنامه‌ریزی و چالش». جزئیات: `docs/features/goal-planning.md`.
- **فاز ۳ ✅ (DECISION-094):** «کتابخانهٔ مسیرها» (کارت‌های پرروح در پایینِ `/goal` + بازنویسیِ `/goal/history`) + «بازخوانیِ سفر» (`JourneyRecapModal` + `GET /api/goal/[id]/recap`). **طرحِ یکپارچه‌سازی کامل شد.**

## تست
`npx tsc --noEmit` ✅ · `npx next build` ✅. بررسیِ بصری: همهٔ حالت‌های هیرو (بدون‌تعهد/تعهد/بازخورد/گپ/فریز)، مودالِ ۳۰‌روزه، ساعتِ زنده، دارک‌مود + موبایل.
