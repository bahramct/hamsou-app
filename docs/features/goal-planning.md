# فیچر «برنامه‌ریزی» — سفرِ یک‌هدفی روایی + کوچِ «همراه»

> منبعِ تصمیم: **DECISION-082** (جایگزینِ DECISION-024). این سند معماریِ اجراییِ فیچر را توضیح می‌دهد.

## جوهر

یک کاربر **یک هدفِ بازه‌ای** تعریف می‌کند (مثلاً «یادگیری گیتار» از تاریخ X تا Y) و در طولِ مسیر،
هر روز یک یا چند **استوریِ روایی** می‌نویسد. از روزِ سوم، کاربرانِ پرو می‌توانند روزی یک‌بار از کوچِ
AI به نامِ **«همراه»** راهنمایی بگیرند. یادآوری‌های اختیاری (درون‌برنامه/ایمیل) کاربر را آرام به مسیرش
دعوت می‌کنند.

## گاردهای ضدِ Task Manager (مانیفست §۱)

- فقط **یک هدفِ فعال** در لحظه (enforce در API، نه DB unique — چون اهدافِ تمام‌شده می‌مانند).
- بدون sub-task، priority، dependency، چک‌باکسِ «انجام شد».
- بدون درصد تکمیل، استریک، امتیاز، مدال، رنک. تنها نمایشِ زمانی: «روز k از n» و «N روز مانده».
- استوری = نوشتهٔ روایی **قابل‌ویرایش** (برخلافِ DailyEntry که قفل می‌شود).
- یادآوری opt-in، خاموش به‌صورت پیش‌فرض، لحنِ آرام (DECISION-023). «همراه» بدون «باید/نباید».
- هستهٔ روزانهٔ همسو (DailyEntry/Feedback/WeeklyReport) **دست‌نخورده** است؛ این فیچر موازی است.

## دو ایجنت — تفکیکِ مهم

| | همدم (`chat-companion`) | همراه (`goal-companion`) |
|---|---|---|
| نقش | دوستِ همدلِ روزمره | تارگت‌منیجر + کوچِ حرفه‌ای |
| دسترسی | همهٔ پلن‌ها (با سقف) | فقط پرو |
| فرکانس | چتِ آزاد روزانه | روزی یک‌بار، روزِ ۳ تا قبل از پایان |
| ورودی | چت + سابقهٔ ۳۰ روز | هدف + استوری‌ها + تعهدها + سیگنال هفتگی + چتِ اخیرِ همدم |

## مدل داده (`prisma/schema.prisma`)

- **Goal** — `userId, title, startDate, endDate, status(active|completed|abandoned)`. تاریخ‌ها begin-of-day ایران (UTC midnight).
- **GoalStory** — `goalId, userId, date, content, mood?(good|neutral|hard), visibility(private|shared), shareToken?`. چند استوری در یک روز مجاز.
- **GoalCompanionInsight** — `goalId, userId, dayKey, dayNumber, aiContent(JSON)`؛ `@@unique([goalId, dayKey])` = سقفِ روزی‌یک‌بار.
- **GoalReminder** — `goalId(unique), userId, enabled, times(CSV HH:mm), channel(inapp|email|both), customMessage?, lastFiredKey`.

## لایه‌ها و فایل‌ها

- **منطقِ تاریخ:** `src/lib/goal/dates.ts` — `goalToday`, `iranDayKey`, `todayKey`, `iranClock`, `totalDays`, `currentDayNumber`, `daysRemaining`, `companionWindow` (قاعدهٔ روزِ ۳ تا قبل از پایان).
- **سرورِ مشترک:** `src/lib/goal/server.ts` — `loadActiveGoalView(userId)` (نمای کاملِ هدفِ فعال + lazy-completion)، serializerها، `isoToDbDate`.
- **استوری‌بورد (client-safe):** `src/lib/goal/storyboard.ts` — `buildDaySlots(...)` + `MOOD_LABELS`.
- **نقشِ AI:** `prompts/goal-companion/v1.fa.md` + `src/lib/ai/roles/goal-companion/{schema,index}.ts` + register در `bootstrap.ts` + ردیف در `admin-catalog.ts::AI_ROLES_ADMIN`.
- **زمان‌بند:** `src/lib/goal/reminder-scheduler.ts::runReminderTick()`.

## API

| Route | متد | کار | گیت |
|------|------|------|------|
| `/api/goal` | GET/POST | نمای فعال / ساختِ هدف (یک فعال؛ شروع ≥ امروز) | `goal.planning` |
| `/api/goal/[id]` | PATCH | edit(title/endIso) / complete / abandon | مالکیت |
| `/api/goal/[id]/story` | POST | افزودنِ استوری | مالکیت |
| `/api/goal/story/[storyId]` | PATCH/DELETE | ویرایش/حذف | مالکیت |
| `/api/goal/[id]/companion` | POST/GET | بینشِ همراه / فهرست | `goal.companion` + پنجره + روزی‌یک‌بار |
| `/api/goal/[id]/reminder` | PUT | کانفیگِ یادآوری | مالکیت |
| `/api/cron/reminders` | GET/POST | تیکِ زمان‌بند | `CRON_SECRET` |
| `/api/dev/goal/reminder-tick` | POST | تیکِ دستیِ dev | `IS_DEV_MODE` |

## زمان‌بندِ یادآوری

`runReminderTick()` همهٔ `GoalReminder` فعالِ روی goalهای `active` را می‌خواند، اسلاتِ ساعتِ فعلیِ ایران
(`iranClock`، با time-travel) را با پنجرهٔ تحملِ ۲۰ دقیقه می‌سنجد، و برای هر «ساعت»ی که رسیده و
`lastFiredKey` آن اسلات نیست، اعلانِ درون‌برنامه (`createNotification("goal.reminder")`) + در صورتِ
کانالِ email/both ایمیل (`sendGoalReminderEmail`) می‌فرستد و `lastFiredKey` را به‌روز می‌کند.

- **prod:** `vercel.json` هر ۱۵ دقیقه `/api/cron/reminders` را صدا می‌زند (Vercel با `Authorization: Bearer $CRON_SECRET`). self-host: همان مسیر با هدرِ `x-cron-secret`.
- **dev (§۱۳):** دکمهٔ «اجرای یادآوری‌های هدف (الان)» در `DevDataPanel` → `/api/dev/goal/reminder-tick`، همراه با time-travel.

## هم‌ترازیِ پنل ادمین

- **پلن:** `goal.planning`/`goal.companion` در کاتالوگ → خودکار در `/admin/plans` (روشن/خاموش per پلن، enforcement فوری).
- **AI:** ردیفِ `goal-companion` در `AI_ROLES_ADMIN` → روتینگ/مدل/پارامتر/Bind از `/admin/ai` + ویرایشِ نسخه‌دارِ پرامپت از `/admin/ai/prompts/goal-companion`.
- **نمای هدفِ کاربر در پنل:** عمداً اضافه نشد — قاعدهٔ حریم‌خصوصی §۷ (محتوای تعهد/استوری هرگز در پنل دیده نمی‌شود).

## آزمونِ سرتاسری

- ساختِ هدف؛ هدفِ دوم → ردِ «یک هدفِ فعال».
- افزودنِ استوری؛ ویرایش/حذف؛ نمایش در استوری‌بورد.
- time-travel به روزِ ۳ → دکمهٔ همراه برای PRO فعال؛ FREE/PLUS → کارتِ ارتقا؛ تلاشِ دومِ همان روز → رد.
- تنظیمِ یادآوری → دکمهٔ dev → اعلانِ ناقوس + (در صورتِ email) لاگِ ارسال؛ اجرای دوباره در همان اسلات → بدونِ تکرار.
- time-travel به بعد از پایان → اعلانِ `goal.completed` + هدف به تاریخچه.
- prod-safety: `/api/dev/goal/reminder-tick` در prod → ۴۰۴؛ `/api/cron/reminders` بدونِ secret → ۴۰۱/۵۰۳.
