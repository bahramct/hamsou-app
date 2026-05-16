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
commit 43d78e2
feat: complete phase 7.3 - Community Features

- Add Community models to Prisma schema (Post, Like, Comment, Follow, Challenge, ChallengeParticipant)
- Create API routes for community feed, posts, likes, comments, follow, challenges, leaderboard
- Create UI Components: CommunityFeed, PostCard, Leaderboard, ChallengesList
- Update roadmap.md and roadmap-progress.md
- Version: 1.4.0
```

### نسخه فعلی
1.4.0-dev

### پیشرفت کلی
~58% (7.1 فاز از 12 فاز اصلی)

---

## 🔑 دسترسی‌های مهم

### توکن گیت‌هاب
```
[احراز هویت از طریق GitHub CLI انجام می‌شود - توکن در اینجا ذخیره نمی‌شود]
```

### ریپوزیتوری
```
https://github.com/bahramct/hamsou-app.git
```

<div dir="rtl">

⚠️ **هشدار مهم**: قبل از هر commit و push به گیت‌هاب، حتماً از من بپرسید و اجازه بگیرید. هرگز بدون اجازه من، کدی را push نکنید.

</div>

---

## 📂 فایل‌های کلیدی برای مطالعه

### 1. فایل‌های نقشه راه
- **roadmap.md** - نقشه راه کامل پروژه با تمام فازها
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
- **src/components/community/** - کامپوننت‌های جامعه (CommunityFeed, PostCard, Leaderboard, ChallengesList)
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
```

</div>

### 2. قوانین توسعه
- همیشه از `write_file` tool برای نوشتن فایل‌ها استفاده کنید
- از `read` tool برای خواندن فایل‌ها استفاده کنید
- کد باید TypeScript باشد (نه JavaScript خالص)
- از API routes استفاده کنید (نه Server Actions) در backend
- از shadcn/ui components استفاده کنید
- استایل با Tailwind CSS 4
- همیشه responsive طراحی کنید
- هیچ test code ننویسید مگر اینکه من درخواست کنم

### 3. بعد از اتمام هر فیچر
<div dir="rtl">

- یک راهنمای تست UI کامل برای من بنویسید
- فقط تست UI را توضیح بدهید (نه API و backend)
- مرحله به مرحله توضیح بدهید که من باید چه کار کنم
- در انتها یک چک‌لیست بدهید

</div>

### 4. قبل از شروع کار
- فایل `roadmap.md` را بخوانید تا بفهمید در چه مرحله‌ای هستیم
- فایل `roadmap-progress.md` را بخوانید تا ببینید چه چیزهایی تکمیل شده
- اگر کاربر بپرسد "کجاییم و چی مونده؟"، پاسخ باید بر اساس این دو فایل باشد

---

## 🎯 وضعیت فعلی پروژه (به روز شده: 2025-01-30)

### فازهای تکمیل شده (100%)
1. ✅ فاز 1: سیستم احراز هویت (Authentication System)
2. ✅ فاز 2: سیستم تعهدات (Commitments System)
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
   - ⏳ 7.4: سیستم دوستی و هم‌تیمی - شروع نشده
   - ⏳ 7.5: API های باقی‌مانده - شروع نشده

### فازهای شروع نشده
8. ⏳ فاز 8: قابلیت‌های AI پیشرفته (0%)
9. ⏳ فاز 9: بهینه‌سازی و عملکرد (0%)
10. ⏳ فاز 10: دیپلوی و Production (0%)
11. ⏳ فاز 11: اپلیکیشن موبایل (0%)
12. ⏳ فاز 12: پنل مدیریت ادمین (0%)

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

### فاز 7.3 - جامعه کاربران (Community)
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
- `POST/DELETE/GET /api/community/follow` - فالو/آنفالو
- `GET/POST /api/community/challenges` - لیست و ایجاد چالش
- `POST/DELETE /api/community/challenges/[id]/join` - پیوستن/خروج
- `GET /api/community/leaderboard` - لیدربورد

#### کامپوننت‌های UI اضافه شده
- `CommunityFeed` - فید اصلی با 3 تب (فید، چالش‌ها، لیدربورد)
- `PostCard` - کارت پست با لایک، کامنت، اشتراک‌گذاری
- `Leaderboard` - لیدربورد هفتگی/ماهانه/همیشه
- `ChallengesList` - لیست چالش‌ها با قابلیت پیوستن

#### صفحات اضافه شده
- `/community` - صفحه جامعه
- دکمه Users در هدر `/demo` برای دسترسی به جامعه

---

## 🚀 مسیر توسعه بعدی

### اولویت 1: تکمیل فاز 7 (قابلیت‌های اجتماعی)
<div dir="rtl">

اگر کاربر بخواهد ادامه دهیم:

1. **فاز 7.4: سیستم دوستی و هم‌تیمی**
   - ارسال درخواست دوستی
   - مشاهده پروفایل دوستان
   - اشتراک‌گذاری برنامه‌ها با دوستان
   - Accountability Partners (شریک پاسخ‌گویی)
   - یادآوری متقابل

2. **فاز 7.5: تکمیل API های باقی‌مانده**
   - GET /api/friends - مدیریت دوستان

</div>

### اولویت 2: تکمیل فاز 6 (گزارش‌دهی و تحلیل)
<div dir="rtl">

- رفع مشکل PDF Export (اگر کاربر بخواهد)
- تکمیل بینش‌های AI-Powered

</div>

### اولویت 3: شروع فاز 8 (AI پیشرفته)
- چت‌بات اختصاصی همسو
- پیشنهاد هوشمند تعهدات
- تحلیل احساسی

---

## 📚 منابع برای مطالعه

### فایل‌های مستندات
- `roadmap.md` - نقشه راه کامل
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
2. لینک گیت‌هاب و توکن
3. قوانین مهم (به خصوص قاعده "بدون اجازه push نکنید")
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
**نسخه**: 1.4.0
**توسعه‌دهنده**: Z.ai Code (با راهنمایی Bahram Chaboki)

</div>
