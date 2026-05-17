# AI Resume - ادامه توسعه پروژه همسو (Hamsou)

<div dir="rtl">

این فایل دستورالعمل کامل برای ادامه توسعه پروژه همسو است. اگر سشن قبلی منقضی شد یا چت ترمینیت شد، فقط محتوای این فایل را کپی کنید و در چت جدید paste کنید.

</div>

---

## 📋 اطلاعات کلی پروژه

### نام پروژه
همسو (Hamsou) - پلتفرم شخصی برای همسویی و رشد فردی

### توضیحات کوتاه
پلتفرمی برای تعیین و پیگیری تعهدات روزانه، بازتاب (Reflection) روزانه، برنامه‌ریزی هفتگی/ماهانه، گزارش‌دهی با AI، و قابلیت‌های اجتماعی (جامعه، چالش، لیدربورد).

### لینک گیت‌هاب
https://github.com/bahramct/hamsou-app

### آخرین کامیت
```
commit [latest]
feat: v1.7.0 - Implement Hamsu Concept and Improve Smart Suggestions

Features:
- ✅ Complete Hamsu (همسو) concept implementation:
  - One commitment per day
  - Reflection only on the next day (not same day)
  - Calendar-based system (not behavior-based)
  - History shows only commitments with completed reflections from past days
  - Removed "Reflect Now" button (conflicts with Hamsu concept)
- ✅ Smart Suggestions improvements:
  - Minimum 7 days data validation before suggesting
  - Error message when insufficient data: "این قسمت برای ارائه صحیح پیشنهادات به حداقل داده‌های یک هفته شما نیاز دارد"
  - Separated card expansion from suggestion generation
  - Button text changes based on state:
    - Closed: "تنظیم پیشنهاد هوشمند"
    - Open: "دریافت پیشنهادات هوشمند"
  - Fixed history filter to show only commitments with reflections from past days
- ✅ Fixed test data generation (past days only)

Phase 8 (Advanced AI Features): 40% complete (8.1.1, 8.2)
Overall Progress: 68%
```

### نسخه فعلی
1.7.0

### پیشرفت کلی
~68% (7.1 فاز از 12 فاز اصلی + فاز 13+ به عنوان چشم‌انداز)

---

## 🔑 دسترسی‌های مهم

### ریپوزیتوری
```
https://github.com/bahramct/hamsou-app.git
```

<div dir="rtl">

⚠️ **هشدار مهم**: قبل از هر commit و push به گیت‌هاب، حتماً از من بپرسید و اجازه بگیرید. هرگز بدون اجازه من، کدی را push نکنید.
⚠️ **امنیت**: هیچ‌وقت توکن‌ها، API keys یا اطلاعات حساس را در کد یا فایل‌های پروژه ذخیره و commit نکنید.

</div>

---

## 📂 فایل‌های کلیدی برای مطالعه

### 1. فایل‌های نقشه راه
- **roadmap.md** - نقشه راه کامل پروژه با تمام فازها (شامل فاز 13+: همسوگرام)
- **roadmap-progress.md** - وضعیت دقیق تکمیل هر فیچر

### 2. اسکیمای دیتابیس
- **prisma/schema.prisma** - مدل‌های دیتابیس (User, Commitment, Reflection, Plan, Notification, Post, Like, Comment, Follow, Challenge, ChallengeParticipant, etc.)

### 3. فایل‌های مهم
- **src/lib/auth.ts** - توابع احراز هویت (verifyToken)
- **src/lib/api.ts** - توابع API client (authApiGet, authApiPost, etc.)
- **src/lib/db.ts** - Prisma client
- **src/app/page.tsx** - صفحه اصلی (redirect به /demo)
- **src/app/demo/page.tsx** - داشبورد اصلی

### 4. کامپوننت‌های مهم
- **src/components/community/** - کامپوننت‌های جامعه (CommunityFeed, PostCard, Leaderboard, ChallengesList, UsersList)
- **src/components/analytics/** - کامپوننت‌های تحلیلی
- **src/components/notifications/** - کامپوننت‌های نوتیفیکیشن
- **src/components/ui/** - کامپوننت‌های shadcn/ui

### 5. فایل‌های کاربر
- **agent-guidelines.md** - قوانین کار (این فایل را حتماً بخوانید!)

---

## ⚠️ قوانین مهم (باید رعایت کنید)

### 1. قوانین گیت‌هاب
<div dir="rtl">

- **هرگز بدون اجازه من به گیت‌هاب push نکنید**
- قبل از هر push، حتماً از من بپرسید
- اگر فایلی تغییر دادید، ابتدا در لوکال commit کنید، بعد اجازه بگیرید، سپس push کنید
- برای commit کردن از این فرمت استفاده کنید:

```
feat: description
fix: description
docs: update files
refactor: description
test: description
chore: description
```

</div>

### 2. قوانین امنیت
- **هیچ‌وقت توکن‌ها، API keys، رمزها یا اطلاعات حساس را در کد یا فایل‌های پروژه ذخیره نکنید**
- از environment variables برای اطلاعات حساس استفاده کنید
- فایل‌های حاوی secrets را به .gitignore اضافه کنید
- هیچ‌وقت credentials را در commit ها push نکنید

### 3. قوانین توسعه
- همیشه از `write_file` tool برای نوشتن فایل‌ها استفاده کنید
- از `read` tool برای خواندن فایل‌ها استفاده کنید
- کد باید TypeScript باشد (نه JavaScript خالص)
- از API routes استفاده کنید (نه Server Actions) در backend
- از shadcn/ui components استفاده کنید
- استایل با Tailwind CSS 4
- همیشه responsive طراحی کنید
- هیچ test code ننویسید مگر اینکه من درخواست کنم

### 4. بعد از اتمام هر فیچر
<div dir="rtl">

- یک راهنمای تست UI کامل برای من بنویسید
- فقط تست UI را توضیح بدهید (نه API و backend)
- مرحله به مرحله توضیح بدهید که من باید چه کار کنم
- در انتها یک چک‌لیست بدهید

</div>

### 5. قبل از شروع کار
- فایل `roadmap.md` را بخوانید تا بفهمید در چه مرحله‌ای هستیم
- فایل `roadmap-progress.md` را بخوانید تا ببینید چه چیزهایی تکمیل شده
- اگر کاربر بپرسد "کجاییم و چی مونده؟"، پاسخ باید بر اساس این دو فایل باشد

---

## 🎯 وضعیت فعلی پروژه (به روز شده: 2025-01-30)

### فازهای تکمیل شده (100%)
1. ✅ فاز 1: سیستم احراز هویت (Authentication System)
2. ✅ فاز 2: سیستم تعهدات (Commitments System) - **با کانسپت همسو (Hamsu)**
   - یک تعهد در هر روز
   - بازتاب فقط در روز بعد (نه همان روز)
   - سیستم مبتنی بر تقویم (نه رفتار کاربر)
   - تاریخچه فقط تعهدات با بازتاب تکمیل شده
3. ✅ فاز 3: سیستم بازتاب (Reflections System)
4. ✅ فاز 4: سیستم برنامه‌ریزی (Plans System)

### فازهای نزدیک به تکمیل
5. ✅ فاز 5: سیستم نوتیفیکیشن (90% - MVP کامل)
   - همه چیز کار می‌کند بجز نوتیفیکیشن‌های زمان‌بندی شده و Push Notifications

6. 🔄 فاز 6: گزارش‌دهی و تحلیل پیشرفته (85%)
   - داشبورد تحلیلی کامل کار می‌کند
   - نمودارها، Heatmap، Word Cloud همه کار می‌کنند
   - Excel Export کامل است
   - ⚠️ PDF Export موکوف شده (مشکل فارسی و تمپلیت‌ها)

7. 🔄 فاز 7: قابلیت‌های اجتماعی (60%)
   - ✅ 7.1: پروفایل کاربری - کامل
   - ✅ 7.2: اشتراک‌گذاری دستاوردها - کامل
   - ✅ 7.3: جامعه کاربران (Community) - کامل
     - فید عمومی دستاوردها
     - لایک و کامنت
     - فالو/آنفالو کاربران
     - لیست کاربران با جستجو
     - چالش‌های گروهی
     - لیدربورد با توضیح امتیازدهی
   - ⏳ 7.4: سیستم دوستی و هم‌تیمی - شروع نشده (حیاتی!)
   - ⏳ 7.5: API های باقی‌مانده - شروع نشده

### فازهای شروع نشده
8. 🔄 فاز 8: قابلیت‌های AI پیشرفته (40% - 8.1.1, 8.2 تکمیل شده)
   - ✅ 8.1.1: چت‌بات اختصاصی همسو (کامل)
     - Chat Widget با دکمه شناور و انیمیشن iPhone-style
     - Quick Prompts (۵ پیشنهاد سریع)
     - Voice Input با Web Speech API و پشتیبانی فارسی
     - Persian Numbers در تمام چت
     - ذخیره‌سازی تاریخچه چت در دیتابیس
     - پیام خوش‌آمدگویی شخصی‌سازی شده
     - پشتیبانی کامل RTL
     - API Routes: POST /api/chat/send, GET /api/chat/history, GET /api/chat/welcome, POST /api/chat/clear
   - ✅ 8.2: پیشنهاد هوشمند تعهدات (کامل)
     - تحلیل برنامه‌های قبلی
     - پیشنهاد تعهدات مناسب
     - تنظیم خودکار بر اساس ظرفیت
     - یادگیری از رفتار کاربر
     - بهینه‌سازی زمان‌بندی
     - اعتبارسنجی حداقل ۷ روز داده
     - جدا کردن باز کردن کارت از تولید پیشنهاد
     - اصلاح تولید داده‌های تستی
   - ⏳ 8.3: تحلیل احسالی (Sentiment Analysis)
9. ⏳ فاز 9: بهینه‌سازی و عملکرد (0%)
10. ⏳ فاز 10: دیپلوی و Production (0%)
11. ⏳ فاز 11: اپلیکیشن موبایل (0%)
12. ⏳ فاز 12: پنل مدیریت ادمین (0%)

### فاز چشم‌انداز (Visionary)
13. 🌟 فاز 13+: همسوگرام - شبکه اجتماعی همسویی رشد فردی
   - کانسپت: پیشرفت دیده می‌شه، نه جاهات
   - اینستاگرام: سفر، غذا، لباس | همسوگرام: تلاش، رشد، انضباط
   - پس از تکمیل فازهای 1-12 با جمع‌آوری بازخورد از کاربران

---

## 🔧 محیط توسعه

### دستورات مهم
```bash
# نصب دیتابیس
bun run db:push

# اجرای سرور در background
bun run dev

# چک کردن کد
bun run lint

# مشاهده دیتابیس
bun run prisma studio

# خواندن لاگ‌های سرور
tail -100 /home/z/my-project/dev.log
```

### مسیر پروژه
```
/home/z/my-project
```

### پورت
- Next.js: 3000
- Dev server: 3000 (همیشه در background اجرا شود)

### زبان و direction
<div dir="rtl">

- UI باید RTL باشد (dir="rtl")
- زبان فارسی
- اعداد فارسی (با تابع toPersianNumber)
- تاریخ‌ها با date-fns و locale fa-IR

</div>

---

## 📝 ویژگی‌های اخیراً اضافه شده

### فاز 2.5 - کانسپت همسو (Hamsu) - نسخه 1.7.0
**تاریخ**: 2025-01-30

#### مفهوم اصلی همسو
همسو یک سیستم تعهد و بازتاب مبتنی بر تقویم است با اصول زیر:
- یک تعهد در هر روز
- بازتاب فقط در روز بعد (نه همان روز)
- سیستم مبتنی بر تقویم (نه رفتار کاربر)
- تاریخچه فقط تعهدات با بازتاب تکمیل شده از روزهای گذشته

#### تغییرات در رابط کاربری
- حذف دکمه "ثبت بازتف همین حالا" (تعارض با کانسپت همسو)
- تغییرات منطقی در `/src/app/demo/page.tsx`:
  - روزهای گذشته بدون بازتاب → نمایش فرم بازتاب
  - تعهد امروز بدون بازتاب → نمایش وضعیت fresh (بدون درخواست بازتاب)
  - تعهد امروز با بازتاب → نمایش نتیجه
  - بدون تعهد امروز → نمایش فرم ایجاد تعهد
- فیلتر تاریخچه: فقط نمایش تعهدات با بازتاب تکمیل شده از روزهای گذشته

#### تغییرات در SmartSuggestionCard
- اعتبارسنجی حداقل ۷ روز داده قبل از ارائه پیشنهاد
- پیام خطا: "این قسمت برای ارائه صحیح پیشنهادات به حداقل داده‌های یک هفته شما نیاز دارد، شما می‌توانید از هفته دوم از این ویژگی استفاده کنید"
- جدا کردن باز کردن کارت از تولید پیشنهاد:
  - `handleExpandCard`: فقط باز کردن کارت
  - `handleGetSuggestions`: تولید پیشنهاد با تنظیمات فعلی
- تغییر متن دکمه بر اساس وضعیت:
  - بسته: "تنظیم پیشنهاد هوشمند"
  - باز شده: "دریافت پیشنهادات هوشمند"

#### تغییرات در تولید داده‌های تستی
- API: `/src/app/api/dev/generate-test-data/route.ts`
- همیشه تعهدات امروز را قبل از تولید حذف می‌کند
- داده‌های تستی فقط برای روزهای گذشته (نه امروز)

---

### فاز 8.1 - چت‌بات اختصاصی همسو (AI Chatbot) - نسخه 1.5.0
**تاریخ**: 2025-01-30

#### مدل دیتابیس اضافه شده
- `ChatMessage` - پیام‌های چت با فیلدهای:
  - id, userId, role (user/assistant/system), content, chatType, metadata
  - timestamp, createdAt, updatedAt

#### API Routes اضافه شده
- `POST /api/chat/send` - ارسال پیام به AI
- `GET /api/chat/history` - دریافت تاریخچه چت
- `GET /api/chat/welcome` - پیام خوش‌آمدگویی شخصی‌سازی شده
- `POST /api/chat/clear` - پاک کردن تاریخچه چت

#### کامپوننت UI اضافه شده
- `ChatWidget` - ویجت چت شناور با ویژگی‌های:
  - دکمه شناور در گوشه پایین سمت چپ (RTL)
  - پنجره چت با انیمیشن iPhone-style (cubic-bezier)
  - Quick Prompts (۵ دکمه پیشنهاد سریع):
    - 📊 تحلیل هفته
    - 🎯 پیشنهاد هدف
    - 💡 راهنمایی بهبود
    - 📝 خلاصه امروز
    - ⭐ انگیزه
  - Voice Input با Web Speech API:
    - پشتیبانی از زبان فارسی (fa-IR)
    - نمایش وضعیت ضبط با رنگ قرمز
    - مدیریت خطا برای مرورگرهای غیرپشتیبان
  - Persian Numbers (تبدیل اعداد به فارسی در همه‌جا)
  - پیام خوش‌آمدگویی شخصی‌سازی شده بر اساس نام و آمار کاربر
  - ذخیره‌سازی تاریخچه چت در دیتابیس
  - پشتیبانی کامل RTL
  - سایز استاندارد چت (340px عرض، 200px ارتفاع ناحیه پیام‌ها)

#### ویژگی‌های فنی
- استفاده از Web Speech API برای ورودی صوتی
- استفاده از تابع toPersianText() برای تبدیل اعداد
- Toast notifications برای خطاها و موفقیت‌ها
- Auto-scroll به آخرین پیام
- Loading states با spinner
- دکمه پاک کردن تاریخچه چت

---

### فاز 7.3 - جامعه کاربران (Community) - نسخه 1.4.1
**تاریخ**: 2025-01-30

#### مدل‌های دیتابیس اضافه شده
- `Post` - پست‌های جامعه
- `Like` - لایک‌های پست‌ها
- `Comment` - کامنت‌ها با قابلیت پاسخ
- `Follow` - رابطه فالو بین کاربران
- `Challenge` - چالش‌های گروهی
- `ChallengeParticipant` - شرکت‌کنندگان در چالش‌ها

#### API Routes اضافه شده
- `GET /api/community/feed` - فید عمومی با فیلتر
- `POST /api/community/posts` - ایجاد پست
- `POST/DELETE /api/community/posts/[id]/like` - لایک/آنلایک
- `POST /api/community/posts/[id]/comments` - ایجاد کامنت
- `DELETE /api/community/comments/[id]` - حذف کامنت
- `GET /api/community/users` - لیست کاربران با جستجو
- `POST /api/community/users/[id]/follow` - فالو کردن کاربر
- `DELETE /api/community/users/[id]/follow` - آنفالو کردن کاربر
- `GET/POST /api/community/follow` - فالو/آنفالو (قدیمی)
- `GET/POST /api/community/challenges` - لیست و ایجاد چالش
- `POST/DELETE /api/community/challenges/[id]/join` - پیوستن/خروج
- `GET /api/community/leaderboard` - لیدربورد
- `POST /api/dev/create-leaderboard-test-data` - ایجاد داده‌های تستی
- `DELETE /api/dev/clear-leaderboard-test-data` - حذف داده‌های تستی
- `GET /api/dev/check-leaderboard-test-data` - بررسی داده‌های تستی

#### کامپوننت‌های UI اضافه شده
- `CommunityFeed` - فید اصلی با 3 تب (فید، چالش‌ها، لیدربورد)
- `PostCard` - کارت پست با لایک، کامنت، اشتراک‌گذاری
- `Leaderboard` - لیدربورد هفتگی/ماهانه/همیشه
- `ChallengesList` - لیست چالش‌ها با قابلیت پیوستن
- `UsersList` - لیست کاربران با جستجو و فالو/آنفالو

#### اصلاحات Schema
- `Challenge`: userId → creatorId, target → targetValue
- `Like`: userId → likerId
- `Comment`: userId → authorId
- اضافه کردن فیلدهای type و category برای مدل Challenge

---

## 🚀 مسیر توسعه بعدی

### اولویت 1: تکمیل فاز 7 (قابلیت‌های اجتماعی) - قبل از فاز 8
<div dir="rtl">

اگر کاربر بخواهد ادامه دهیم:

1. **فاز 7.4: سیستم دوستی و هم‌تیمی** (حیاتی!)
   - ارسال درخواست دوستی
   - مشاهده پروفایل دوستان
   - اشتراک‌گذاری برنامه‌ها با دوستان
   - **Accountability Partners** (شریک پاسخ‌گویی) - مهم‌ترین فیچر!
   - یادآوری متقابل

2. **فاز 7.5: تکمیل API های باقی‌مانده**
   - GET /api/friends - مدیریت دوستان

3. **تنظیمات حریم خصوصی (7.1.5)**
   - Private/Public profile
   - کنترل دسترسی به دستاوردها

</div>

### اولویت 2: تکمیل فاز 6 (گزارش‌دهی و تحلیل)
<div dir="rtl">

- رفع مشکل PDF Export (اگر کاربر بخواهد)
- تکمیل بینش‌های AI-Powered

</div>

### اولویت 3: ادامه فاز 8 (AI پیشرفته) - در حال توسعه
<div dir="rtl">

فاز 8.1 (چت‌بات اختصاصی همسو) تکمیل شده است. می‌توانید ادامه دهید با:

1. **فاز 8.2: پیشنهاد هوشمند تعهدات**
   - تحلیل برنامه‌های قبلی
   - پیشنهاد تعهدات مناسب
   - تنظیم خودکار بر اساس ظرفیت
   - یادگیری از رفتار کاربر
   - بهینه‌سازی زمان‌بندی

2. **فاز 8.3: تحلیل احسالی (Sentiment Analysis)**
   - تحلیل احساسات در بازتف‌ها
   - شناسایی الگوهای استرس
   - هشدارهای سلامت روان
   - پیشنهاد تکنیک‌های مدیریت استرس
   - ردیابی بهبود سلامت روان

3. **فاز 8.4: تولید محتوا با AI**
   - تولید گزارش‌های تصویری با AI
   - ایجاد quotes الهام‌بخش
   - تولید summary هفتگی
   - خلاصه‌سازی داده‌های ماهانه
   - تولید motivational content

</div>

### چشم‌انداز بلندمدت
- فاز 13+: همسوگرام - شبکه اجتماعی پیشرفته همسویی رشد فردی

---

## 📚 منابع برای مطالعه

### فایل‌های مستندات
- `roadmap.md` - نقشه راه کامل (شامل فاز 13+ همسوگرام)
- `roadmap-progress.md` - پیشرفت دقیق
- `README.md` - معرفی پروژه (برای گیت‌هاب)
- `agent-guidelines.md` - قوانین کار

### مستندات فنی
- Prisma: `prisma/schema.prisma`
- Auth: `src/lib/auth.ts`
- API: `src/lib/api.ts`
- DB: `src/lib/db.ts`

---

## 💡 نکات مهم برای توسعه

### 1. استفاده از z-ai-web-dev-sdk
<div dir="rtl">

- این SDK فقط باید در backend استفاده شود
- هرگز در client side استفاده نکنید
- برای AI features از این SDK استفاده کنید

</div>

### 2. احراز هویت
<div dir="rtl">

- تابع `verifyToken(request)` را از `@/lib/auth` import کنید
- هرگز تابع `auth()` استفاده نکنید (وجود ندارد)
- در همه API routes باید verifyToken را صدا بزنید

```typescript
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await verifyToken(request);
  // ...
}
```

</div>

### 3. استفاده از دیتابیس
```typescript
import { db } from '@/lib/db';

// مثال
const posts = await db.post.findMany();
```

### 4. استفاده از API در client
```typescript
import { authApiGet, authApiPost } from '@/lib/api';

const data = await authApiGet('/api/commitments/today');
const result = await authApiPost('/api/commitments', { text: '...' });
```

### 5. استایل‌دهی
- از Tailwind CSS 4 استفاده کنید
- از shadcn/ui components استفاده کنید
- همیشه responsive طراحی کنید
- از اعداد و رنگ‌های ثابت استفاده نکنید (مگر در طراحی سیستم)

### 6. کامپوننت‌های UI
- همه کامپوننت‌های shadcn/ui در `src/components/ui/` موجود هستند
- اول چک کنید اگر کامپوننتی وجود دارد، استفاده کنید
- اگر وجود ندارد، بسازید

---

## 🧪 بعد از هر فیچر - راهنمای تست UI

<div dir="rtl">

بعد از اینکه فیچری را پیاده‌سازی کردید، باید برای من یک راهنمای تست کامل بنویسید. این راهنما باید فقط شامل تست UI باشد (نه API و backend).

### ساختار راهنمای تست:

```
## 🧪 راهنمای تست [نام فیچر]

### مرحله 1: [توضیح مرحله]
[دستورات و انتظارات]

### مرحله 2: [توضیح مرحله]
[دستورات و انتظارات]

...

### ✅ چک‌لیست نهایی
- [ ] آیتم 1
- [ ] آیتم 2
...
```

### نکات:
- فقط تست UI را بنویسید
- مرحله به مرحله توضیح دهید
- برای هر مرحله بنویسید چه انتظاری دارید
- در انتها یک چک‌لیست کامل بدهید
- اگر دکمه‌ای باید در منو اضافه شده باشد، حتماً ذکر کنید

</div>

---

## 📞 اگر سوالی دارید

<div dir="rtl">

اگر در حین توسعه سوال دارید یا نمی‌دانید چه باید بکنید:

1. اول فایل `roadmap.md` را بخوانید
2. سپس فایل `roadmap-progress.md` را بخوانید
3. اگر هنوز سوال دارید، از کاربر بپرسید

</div>

---

## 🎯 خلاصه

<div dir="rtl">

این فایل تمام اطلاعاتی است که برای ادامه توسعه نیاز دارید:

1. اطلاعات کلی پروژه
2. لینک گیت‌هاب
3. قوانین مهم (به خصوص قاعده "بدون اجازه push نکنید" و "هیچ‌وقت توکن ذخیره نکنید")
4. وضعیت فعلی پروژه
5. فایل‌های کلیدی برای مطالعه
6. ویژگی‌های اخیراً اضافه شده
7. مسیر توسعه بعدی
8. نکات مهم برای توسعه
9. راهنمای نوشتن تست UI

وقتی وارد چت جدید می‌شوید، فقط محتوای این فایل را کپی و paste کنید تا بتوانید ادامه دهید.

</div>

---

<div dir="rtl">

**آخرین بروزرسانی**: 2025-01-30
**نسخه**: 1.7.0
**توسعه‌دهنده**: Z.ai Code (با راهنمایی Bahram Barazandeh - بهرام برازنده)

</div>
