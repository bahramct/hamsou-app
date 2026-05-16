# همسو (Hamsou) - نقشه راه پروژه (Roadmap)

## توضیحات کلی

**همسو** یک پلتفرم شخصی برای همسویی و رشد فردی است که به کاربران کمک می‌کند تا:
- تعهدات روزانه خود را تعیین و پیگیری کنند
- در پایان روز بازتاب (Reflection) داشته باشند
- برنامه‌های هفتگی و ماهانه تدوین کنند
- از هوش مصنوعی برای گزارش‌دهی و تحلیل استفاده کنند
- نوتیفیکیشن‌های هوشمند دریافت کنند
- پیشرفت خود را تحلیل و بهینه کنند

---

## 🎯 فاز 1: سیستم احراز هویت (Authentication System)
**وضعیت: ✅ تکمیل شده**

### 1.1 ثبت‌نام کاربر
- [x] API ثبت‌نام با شماره تلفن
- [x] ارسال کد تایید (اختیاری - پیاده‌سازی با SMS gateway)
- [x] ذخیره‌سازی اطلاعات کاربر در دیتابیس
- [x] تولید JWT Token

### 1.2 ورود کاربر
- [x] API ورود با شماره تلفن
- [x] بررسی اعتبار کاربر
- [x] تولید JWT Token
- [x] مدیریت نشست کاربر

### 1.3 احراز هویت در سمت کلاینت
- [x] ذخیره توکن در localStorage
- [x] هدر Auth برای API requests
- [x] مدیریت logout
- [x] محافظت از روت‌ها (Middleware)

### 1.4 رابط کاربری
- [x] صفحه ورود (Login Page)
- [x] فرم ثبت‌نام
- [x] اعتبارسنجی فرم‌ها
- [x] پیام‌های خطا و موفقیت
- [x] ریسپانسیو طراحی

---

## 🎯 فاز 2: سیستم تعهدات (Commitments System)
**وضعیت: ✅ تکمیل شده**

### 2.1 API تعهدات
- [x] ایجاد تعهد جدید (POST /api/commitments)
- [x] دریافت لیست تعهدات (GET /api/commitments)
- [x] دریافت تعهدات امروز (GET /api/commitments/today)
- [x] آپدیت وضعیت تعهد (PATCH /api/commitments/[id])
- [x] حذف تعهد (DELETE /api/commitments/[id])

### 2.2 مدل داده‌ای تعهدات
```prisma
model Commitment {
  id          String   @id @default(cuid())
  title       String
  description String?
  category    String
  priority    String   // high, medium, low
  status      String   // pending, completed, skipped
  targetDate  DateTime
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 2.3 رابط کاربری تعهدات
- [x] لیست تعهدات روزانه
- [x] فرم ایجاد تعهد جدید
- [x] مارک کردن تعهد به عنوان انجام شده
- [x] حذف تعهد
- [x] فیلتر بر اساس وضعیت
- [x] نمایش تاریخچه تعهدات
- [x] آمار تعهدات هفتگی

### 2.4 ویژگی‌های اضافی
- [x] دسته‌بندی تعهدات (کاری، شخصی، سلامتی، یادگیری)
- [x] اولویت‌بندی (بالا، متوسط، پایین)
- [x] نوتیفیکیشن یادآوری تعهدات (در فاز 5 پیاده‌سازی شد)

---

## 🎯 فاز 3: سیستم بازتاب (Reflections System)
**وضعیت: ✅ تکمیل شده**

### 3.1 API بازتاب‌ها
- [x] ثبت بازتاب روزانه (POST /api/reflections)
- [x] دریافت لیست بازتاب‌ها (GET /api/reflections)
- [x] دریافت بازتاب یک روز خاص (GET /api/reflections?date=YYYY-MM-DD)
- [x] آپدیت بازتاب (PATCH /api/reflections/[id])

### 3.2 مدل داده‌ای بازتاب‌ها
```prisma
model Reflection {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  date              DateTime @unique
  achievements      String?  @db.Text
  challenges        String?  @db.Text
  learnings         String?  @db.Text
  gratitude         String?  @db.Text
  mood              String?  // happy, neutral, sad, stressed, motivated
  overallRating     Int?     // 1-5
  tomorrowGoals     String?  @db.Text
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 3.3 رابط کاربری بازتاب‌ها
- [x] فرم بازتاب روزانه
- [x] سوالات هدایت‌کننده:
  - امروز چه موفقیت‌هایی داشتی؟
  - با چه چالش‌هایی مواجه شدی؟
  - چه چیزهایی یاد گرفتی؟
  - از چه چیزی شکرگزار هستی؟
  - احساس کلی امروزت چطور بود؟
  - برای فردا چه اهدالی داری؟
- [x] نمایش تاریخچه بازتاب‌ها
- [x] گراف خلق‌وخوی روزانه
- [x] آرشیو بازتاب‌ها بر اساس تاریخ

### 3.4 هوش مصنوعی برای بازتاب‌ها
- [x] تحلیل بازتاب‌های هفته با AI
- [x] تولید گزارش هفتگی خودکار
- [x] شناسایی الگوهای رفتاری
- [x] پیشنهادات بهبود

---

## 🎯 فاز 4: سیستم برنامه‌ریزی (Plans System)
**وضعیت: ✅ تکمیل شده**

### 4.1 API برنامه‌ها
- [x] ایجاد برنامه جدید (POST /api/plans)
- [x] دریافت لیست برنامه‌ها (GET /api/plans)
- [x] دریافت برنامه خاص (GET /api/plans/[id])
- [x] آپدیت برنامه (PATCH /api/plans/[id])
- [x] حذف برنامه (DELETE /api/plans/[id])

### 4.2 مدل داده‌ای برنامه‌ها
```prisma
model Plan {
  id          String   @id @default(cuid())
  title       String
  description String?
  type        String   // weekly, monthly
  startDate   DateTime
  endDate     DateTime?
  goals       String   @db.Text  // JSON array
  progress    Int      @default(0) // 0-100
  status      String   @default("active") // active, completed, paused
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4.3 رابط کاربری برنامه‌ها
- [x] صفحه مدیریت برنامه‌ها (/my-plans)
- [x] فرم ایجاد برنامه هفتگی/ماهانه
- [x] لیست اهداف هر برنامه
- [x] نمایش پیشرفت (Progress Bar)
- [x] وصل کردن تعهدات به برنامه‌ها
- [x] آپدیت خودکار پیشرفت برنامه از طریق تعهدات
- [x] تاریخچه برنامه‌ها
- [x] وضعیت برنامه‌ها (فعال، تکمیل شده، متوقف شده)

### 4.4 ویژگی‌های پیشرفته
- [x] قالب‌های آماده برنامه
- [x] کپی برنامه‌های قبلی
- [x] نوتیفیکیشن تکمیل برنامه
- [x] نوتیفیکیشن پیشرفت برنامه (25%, 50%, 75%)

---

## 🎯 فاز 5: سیستم نوتیفیکیشن (Notification System)
**وضعیت: ✅ تکمیل شده (MVP)**

### 5.1 API نوتیفیکیشن‌ها
- [x] ایجاد نوتیفیکیشن (POST /api/notifications/internal/create)
- [x] دریافت لیست نوتیفیکیشن‌ها (GET /api/notifications)
- [x] مارک کردن به عنوان خوانده شده (PATCH /api/notifications/[id])
- [x] حذف نوتیفیکیشن (DELETE /api/notifications/[id])
- [x] مارک کردن همه به عنوان خوانده شده (PATCH /api/notifications/mark-all-read)
- [x] API تست برای توسعه (POST /api/dev/create-test-notification)

### 5.2 مدل داده‌ای نوتیفیکیشن‌ها
```prisma
model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  title       String
  message     String   @db.Text
  type        String   // commitment_reminder, reflection_reminder, plan_completed, weekly_report, achievement, plan_progress
  read        Boolean  @default(false)
  actionUrl   String?
  createdAt   DateTime @default(now())
}
```

### 5.3 انواع نوتیفیکیشن‌ها
- [x] یادآوری تعهدات روزانه
- [x] یادآوری بازتاب روزانه
- [x] نوتیفیکیشن تکمیل برنامه
- [x] نوتیفیکیشن گزارش هفتگی AI
- [x] نوتیفیکیشن دستاوردها (Achievement)
- [x] نوتیفیکیشن پیشرفت برنامه (25%, 50%, 75%, 100%)

### 5.4 رابط کاربری نوتیفیکیشن‌ها
- [x] آیکون زنگوله در هدر
- [x] نمایش تعداد نوتیفیکیشن‌های خوانده نشده
- [x] Dropdown لیست نوتیفیکیشن‌ها
- [x] مارک کردن به عنوان خوانده شده با کلیک
- [x] دکمه حذف نوتیفیکیشن
- [x] لینک به صفحه مرتبط (Action URL)
- [x] اسکرول لیست نوتیفیکیشن‌ها
- [x] استایل‌دهی متناسب با نوع نوتیفیکیشن

### 5.5 نوتیفیکیشن‌های خودکار
- [x] نوتیفیکیشن هنگام تکمیل برنامه (100%)
- [x] نوتیفیکیشن پیشرفت برنامه (25%, 50%, 75%)
- [x] نوتیفیکیشن تکمیل بازتاب با افزایش پیشرفت برنامه

### 5.6 ابزارهای توسعه
- [x] پنل Dev Tools برای تست نوتیفیکیشن‌ها
- [x] ایجاد نوتیفیکیشن تست با انواع مختلف
- [x] فانکشن `sendNotification()` برای استفاده در سمت سرور

### 5.7 ویژگی‌های آینده (Optional - پیاده‌سازی نشده)
- [ ] نوتیفیکیشن‌های زمان‌بندی شده (Scheduled Notifications)
- [ ] نوتیفیکیشن گزارش هفتگی خودکار
- [ ] نوتیفیکیشن Streak (روزهای متوالی)
- [ ] صفحه مدیریت نوتیفیکیشن‌ها
- [ ] تنظیمات نوتیفیکیشن برای کاربر
- [ ] Push Notifications (پشتیبانی مرورگر)

---

## 🎯 فاز 6: سیستم گزارش‌دهی و تحلیل پیشرفته (Advanced Analytics & Reports)
**وضعیت: 🔄 85% تکمیل شده (PDF Export موکوف شده)**

### 6.1 داشبورد تحلیلی (Analytics Dashboard)
- [x] صفحه داشبورد پیشرفت (/analytics)
- [x] گراف‌های تعاملی با Chart.js یا Recharts
- [x] فیلتر بر اساس بازه زمانی (هفته، ماه، سال)
- [x] مقایسه دوره‌های مختلف

### 6.2 متریک‌های کلیدی
- [x] نرخ تکمیل تعهدات (Completion Rate)
- [x] روندهای خلق‌وخوی (Mood Trends)
- [x] تحلیل دسته‌بندی‌های تعهد
- [x] میانگین بازتاب‌های روزانه
- [x] آمار برنامه‌های تکمیل شده
- [x] Streak Tracker (روزهای متوالی فعالیت)

### 6.3 گزارش‌های تصویری
- [x] نمودار خطی پیشرفت زمانی
- [x] نمودار دایره‌ای توزیع تعهدات
- [x] نمودار میله‌ای تکمیل هفتگی
- [x] Heatmap فعالیت (مانند GitHub)
- [x] Word Cloud از کلمات کلیدی بازتاب‌ها

### 6.4 گزارش‌های قابل دانلود
- [⚠️] خروجی PDF از گزارش ماهانه (نصفه‌کاره - موکوف شده، مشکل فارسی و تمپلیت‌ها)
- [x] خروجی Excel از داده‌ها
- [x] قالب‌های آماده گزارش
- [x] اشتراک‌گذاری报告

### 6.5 بینش‌های AI-Powered
- [ ] شناسایی الگوهای مخرب
- [ ] پیش‌بینی موفقیت برنامه‌ها
- [ ] پیشنهاد اهداف هوشمند
- [ ] تحلیل عوامل موثر بر موفقیت
- [ ] توصیه‌های شخصی‌سازی شده

### 6.6 API تحلیل‌ها
- [ ] GET /api/analytics/overview - آمار کلی
- [ ] GET /api/analytics/commitments - تحلیل تعهدات
- [ ] GET /api/analytics/reflections - تحلیل بازتاب‌ها
- [ ] GET /api/analytics/plans - تحلیل برنامه‌ها
- [ ] GET /api/analytics/trends - روندها
- [ ] GET /api/analytics/insights - بینش‌های AI

---

## 🎯 فاز 7: قابلیت‌های اجتماعی (Social Features)
**وضعیت: 🔄 60% تکمیل شده (7.1, 7.2, 7.3)**

### 7.1 پروفایل کاربری
- [x] صفحه پروفایل (/profile)
- [x] آپلود تصویر پروفایل
- [x] bio و اطلاعات شخصی
- [x] نمایش آمار عمومی
- [ ] تنظیمات حریم خصوصی

### 7.2 اشتراک‌گذاری دستاوردها
- [x] اشتراک‌گذاری تعهدات تکمیل شده
- [x] اشتراک‌گذاری Streak
- [x] تولید تصویر برای سوشال مدیا
- [x] دکمه‌های اشتراک‌گذاری (Twitter, LinkedIn, etc.)
- [x] لینک اشتراک‌گذاری عمومی

### 7.3 جامعه کاربران (Community) - اختیاری
- [x] فید عمومی دستاوردها
- [x] لایک و کامنت روی پست‌ها
- [x] دنبال کردن کاربران
- [x] لیست کاربران با قابلیت جستجو و فالو/آنفالو
- [x] چالش‌های گروهی
- [x] لیدربورد هفتگی/ماهانه با توضیح امتیازدهی
- [x] ابزارهای توسعه برای داده‌های تستی جامعه
- [x] سیستم پاکسازی داده‌های تستی قدیمی

### 7.4 سیستم دوستی و هم‌تیمی
- [ ] ارسال درخواست دوستی
- [ ] مشاهده پروفایل دوستان
- [ ] اشتراک‌گذاری برنامه‌ها با دوستان
- [ ] Accountability Partners (شریک پاسخ‌گویی)
- [ ] یادآوری متقابل

### 7.5 API قابلیت‌های اجتماعی
- [x] GET/PUT /api/profile - مدیریت پروفایل
- [x] POST /api/achievements/share - اشتراک‌گذاری دستاورد
- [x] GET /api/achievements/generate-image - تولید تصویر دستاورد
- [x] GET /api/achievements/share-info - دریافت اطلاعات دستاورد
- [x] GET /api/community/feed - فید عمومی
- [x] POST /api/community/posts - ایجاد پست
- [x] POST/DELETE /api/community/posts/[id]/like - لایک/آنلایک
- [x] POST /api/community/posts/[id]/comments - ایجاد کامنت
- [x] DELETE /api/community/comments/[id] - حذف کامنت
- [x] GET /api/community/users - لیست کاربران با جستجو
- [x] POST /api/community/users/[id]/follow - فالو کردن کاربر
- [x] DELETE /api/community/users/[id]/follow - آنفالو کردن کاربر
- [x] POST/DELETE/GET /api/community/follow - مدیریت فالو (قدیمی)
- [x] GET/POST /api/community/challenges - لیست و ایجاد چالش
- [x] POST/DELETE /api/community/challenges/[id]/join - پیوستن/خروج از چالش
- [x] GET /api/community/leaderboard - لیدربورد
- [x] POST /api/dev/create-leaderboard-test-data - ایجاد داده‌های تستی جامعه
- [x] DELETE /api/dev/clear-leaderboard-test-data - حذف داده‌های تستی جامعه
- [x] GET /api/dev/check-leaderboard-test-data - بررسی وجود داده‌های تستی
- [ ] GET /api/friends - مدیریت دوستان

---

## 🎯 فاز 8: قابلیت‌های AI پیشرفته (Advanced AI Features)
**وضعیت: ⏳ در انتظار پیاده‌سازی**

### 8.1 دستیار هوشمند (AI Assistant)
- [ ] چت‌بات اختصاصی همسو
- [ ] پاسخ به سوالات درباره پیشرفت
- [ ] پیشنهاد اهداف بر اساس تاریخچه
- [ ] تحلیل عمیق داده‌ها
- [ ] راهنمایی برای بهبود

### 8.2 پیشنهاد هوشمند تعهدات
- [ ] تحلیل برنامه‌های قبلی
- [ ] پیشنهاد تعهدات مناسب
- [ ] تنظیم خودکار بر اساس ظرفیت
- [ ] یادگیری از رفتار کاربر
- [ ] بهینه‌سازی زمان‌بندی

### 8.3 تحلیل احساسی (Sentiment Analysis)
- [ ] تحلیل احساسات در بازتاب‌ها
- [ ] شناسایی الگوهای استرس
- [ ] هشدارهای سلامت روان
- [ ] پیشنهاد تکنیک‌های مدیریت استرس
- [ ] ردیابی بهبود سلامت روان

### 8.4 تولید محتوا
- [ ] تولید گزارش‌های تصویری با AI
- [ ] ایجاد quotes الهام‌بخش
- [ ] تولید summary هفتگی
- [ ] خلاصه‌سازی داده‌های ماهانه
- [ ] تولید motivational content

### 8.5 API های AI پیشرفته
- [ ] POST /api/ai/chat - چت با دستیار
- [ ] POST /api/ai/suggest-commitments - پیشنهاد تعهد
- [ ] POST /api/ai/analyze-sentiment - تحلیل احساسی
- [ ] POST /api/ai/generate-report - تولید گزارش
- [ ] POST /api/ai/insights - بینش‌های عمیق

---

## 🎯 فاز 9: بهینه‌سازی و عملکرد (Optimization & Performance)
**وضعیت: ⏳ در انتظار پیاده‌سازی**

### 9.1 بهینه‌سازی Frontend
- [ ] Code Splitting و Lazy Loading
- [ ] Image Optimization
- [ ] Bundle Size Reduction
- [ ] Caching Strategy
- [ ] Service Worker برای Offline Mode

### 9.2 بهینه‌سازی Backend
- [ ] Database Indexing
- [ ] Query Optimization
- [ ] API Response Caching
- [ ] Rate Limiting
- [ ] Connection Pooling

### 9.3 تست و کیفیت
- [ ] Unit Tests (Jest)
- [ ] Integration Tests
- [ ] E2E Tests (Playwright)
- [ ] Performance Monitoring
- [ ] Error Tracking (Sentry)

### 9.4 Security Hardening
- [ ] HTTPS Enforcement
- [ ] CSRF Protection
- [ ] XSS Prevention
- [ ] SQL Injection Prevention
- [ ] Security Headers
- [ ] Audit Logging

### 9.5 Accessibility (a11y)
- [ ] WCAG 2.1 Compliance
- [ ] Keyboard Navigation
- [ ] Screen Reader Support
- [ ] ARIA Labels
- [ ] Focus Management
- [ ] Color Contrast

### 9.6 i18n (Internationalization)
- [ ] پشتیبانی از زبان‌های مختلف
- [ ] RTL/LTR Support
- [ ] Date/Time Localization
- [ ] Number Formatting
- [ ] Translation Files

---

## 🎯 فاز 10: دیپلوی و Production (Deployment & Production)
**وضعیت: ⏳ در انتظار پیاده‌سازی**

### 10.1 محیط Production
- [ ] تنظیم Environment Variables
- [ ] Database Migration
- [ ] CDN Configuration
- [ ] Load Balancing
- [ ] Auto Scaling

### 10.2 Monitoring & Logging
- [ ] Application Monitoring (APM)
- [ ] Error Tracking
- [ ] Performance Metrics
- [ ] User Analytics
- [ ] Custom Dashboards

### 10.3 CI/CD Pipeline
- [ ] GitHub Actions Configuration
- [ ] Automated Testing
- [ ] Automated Deployment
- [ ] Rollback Strategy
- [ ] Blue-Green Deployment

### 10.4 Backup & Recovery
- [ ] Database Backups (Automated)
- [ ] Disaster Recovery Plan
- [ ] Data Export/Import
- [ ] Redundancy Setup

### 10.5 Documentation
- [ ] API Documentation (Swagger/OpenAPI)
- [ ] Developer Guide
- [ ] User Manual
- [ ] Deployment Guide
- [ ] Troubleshooting Guide

### 10.6 Support & Maintenance
- [ ] Ticket System
- [ ] FAQ Section
- [ ] Contact Support
- [ ] Feedback System
- [ ] Changelog

---

## 🎯 فاز 11: اپلیکیشن موبایل (Mobile App) - اختیاری
**وضعیت: ⏳ در انتظار تصمیم**

### 11.1 Native App (React Native)
- [ ] طراحی UI برای موبایل
- [ ] Push Notifications
- [ ] Offline Support
- [ ] Biometric Authentication
- [ ] Background Sync

### 11.2 PWA (Progressive Web App)
- [ ] PWA Manifest
- [ ] Service Worker
- [ ] Offline Capability
- [ ] Install Prompt
- [ ] App Icon & Splash Screen

---

## 🎯 فاز 12: پنل مدیریت ادمین (Admin Panel)
**وضعیت: ⏳ در انتظار پیاده‌سازی**

### 12.1 دسترسی و امنیت
- [ ] صفحه ورود ادمین (/admin)
- [ ] احراز هویت دو مرحله‌ای (2FA) برای ادمین‌ها
- [ ] Role-Based Access Control (RBAC)
- [ ] IP Whitelist برای دسترسی به پنل
- [ ] لاگ تمام اکشن‌های ادمین
- [ ] محدودیت تعداد تلاش‌های ناموفق ورود

### 12.2 داشبورد مدیریتی
- [ ] آمار کلی کاربران (کل، فعال جدید امروز/هفته/ماهانه)
- [ ] نرخ رشد کاربران (Growth Rate)
- [ ] نرخ چرن (Churn Rate)
- [ ] نرخ تبدیل Free به Paid
- [ ] نرخ بازگشت کاربران (Retention Rate)
- [ ] درآمد ماهانه/سالانه (Revenue)
- [ ] نمودارهای رشد (Line Charts)
- [ ] توزیع پلن‌های کاربران (Pie Chart)
- [ ] آمار تیکت‌های پشتیبانی (باز، در حال بررسی، بسته شده)

### 12.3 مدیریت کاربران
- [ ] لیست تمام کاربران با فیلترهای پیشرفته
  - [ ] فیلتر بر اساس پلن (Free, Plus, Pro)
  - [ ] فیلتر بر اساس تاریخ ثبت‌نام
  - [ ] فیلتر بر اساس آخرین فعالیت
  - [ ] فیلتر بر اساس وضعیت (فعال، غیرفعال، مسدود)
- [ ] جستجوی کامل (Full-text Search)
  - [ ] جستجو بر اساس نام
  - [ ] جستجو بر اساس شماره تلفن
  - [ ] جستجو بر اساس User ID
- [ ] مشاهده پروفایل کامل هر کاربر
  - [ ] اطلاعات شخصی
  - [ ] تاریخچه پلن‌ها
  - [ ] تاریخچه پرداخت‌ها
  - [ ] آمار فعالیت‌ها
- [ ] مشاهده آمار تفصیلی کاربر
  - [ ] تعداد تعهدات
  - [ ] نرخ تکمیل
  - [ ] Streak (روزهای متوالی)
  - [ ] تعداد برنامه‌ها
  - [ ] تعداد بازتاب‌ها
- [ ] مدیریت پلن کاربر
  - [ ] ارتقا به Plus
  - [ ] ارتقا به Pro
  - [ ] تخفیف‌دهی (کد تخفیف)
  - [ ] لغو اشتراک (با فاصله)
- [ ] ارسال پیام به کاربر
  - [ ] نوتیفیکیشن درون‌برنامه‌ای
  - [ ] ایمیل
  - [ ] SMS
- [ ] مدیریت وضعیت حساب کاربر
  - [ ] مسدود کردن (Ban)
  - [ ] فعال کردن (Unban)
  - [ ] حذف حساب (با احتیاط و تأیید)
- [ ] مشاهده لاگ فعالیت‌های کاربر
  - [ ] تاریخچه ورود/خروج
  - [ ] تاریخچه تغییر پلن
  - [ ] تاریخچه پرداخت‌ها
  - [ ] گزارش‌های تولید شده

### 12.4 مدیریت پلن‌ها و اشتراک‌ها
- [ ] داشبورد اشتراک‌ها
  - [ ] لیست تمام اشتراک‌های فعال
  - [ ] لیست کاربران هر پلن
  - [ ] اشتراک‌های منقضی شده
  - [ ] اشتراک‌های لغو شده
- [ ] مدیریت مالی
  - [ ] درآمد ماهانه تفکیک‌شده بر اساس پلن
  - [ ] درآمد سالانه
  - [ ] گزارش مالی قابل دانلود (CSV, PDF)
  - [ ] پیش‌بینی درآمد
- [ ] مدیریت پلن‌ها
  - [ ] ایجاد پلن جدید
  - [ ] ویرایش پلن‌های موجود (نام، قیمت، فیچرها)
  - [ ] غیرفعال/فعال کردن پلن
  - [ ] تعیین فیچرهای هر پلن
- [ ] مدیریت کدهای تخفیف و پروموشن
  - [ ] ایجاد کد تخفیف (درصد یا مبلغ ثابت)
  - [ ] تعیین مدت اعتبار کد
  - [ ] محدودیت تعداد استفاده
  - [ ] تخصیص به پلن خاص
  - [ ] آمار استفاده از کدها
- [ ] مدیریت اشتراک‌های کاربر
  - [ ] مشاهده تاریخچه تغییرات پلن
  - [ ] لغو اشتراک (با تاریخ پایان)
  - [ ] تمدید اشتراک
  - [ ] بازپرداخت (Refund)

### 12.5 سیستم تیکتینگ و پشتیبانی
- [ ] داشبورد تیکت‌ها
  - [ ] تعداد تیکت‌های باز
  - [ ] تعداد تیکت‌های در حال بررسی
  - [ ] تعداد تیکت‌های بسته شده
  - [ ] میانگین زمان پاسخ‌دهی
  - [ ] رضایت کاربران (Feedback)
- [ ] مدیریت تیکت‌ها
  - [ ] لیست تمام تیکت‌ها
  - [ ] فیلتر بر اساس وضعیت
  - [ ] فیلتر بر اساس اولویت (کم، متوسط، بالا، فوری)
  - [ ] فیلتر بر اساس نوع (فنی، صورتحساب، پیشنهاد، گزارش باگ)
  - [ ] فیلتر بر اساس ادمین مسئول
  - [ ] فیلتر بر اساس تاریخ ایجاد
- [ ] ایجاد و مدیریت تیکت‌ها
  - [ ] ایجاد تیکت جدید (از طرف کاربر)
  - [ ] ایجاد تیکت توسط ادمین
  - [ ] ویرایش اطلاعات تیکت
  - [ ] انتقال تیکت به ادمین دیگر
  - [ ] تغییر اولویت تیکت
- [ ] چت و مکاتبه با کاربر
  - [ ] سیستم چت برای هر تیکت
  - [ ] ارسال پیام متنی
  - [ ] افزودن فایل و ضمیمه
  - [ ] پشتیبانی از ایموجی
  - [ ] آپلود تصویر/فایل
- [ ] مدیریت پاسخ‌ها
  - [ ] تگ‌بندی تیکت‌ها
  - [ ] Canned Responses (پاسخ‌های آماده)
  - [ ] ایجاد و مدیریت Canned Responses
  - [ ] پاسخ سریع با پاسخ‌های آماده
- [ ] بستن تیکت
  - [ ] بستن تیکت با نتیجه
  - [ ] درخواست بازخورد از کاربر
  - [ ] نظرسنجی رضایت (1-5 stars)
  - [ ] جمع‌آوری بازخورد

### 12.6 مدیریت محتوا
- [ ] ارسال نوتیفیکیشن انبوه
  - [ ] نوتیفیکیشن Push (In-App)
  - [ ] نوتیفیکیشن Email
  - [ ] نوتیفیکیشن SMS
  - [ ] انتخاب گیرندگان (همه، یک پلن، کاربران خاص)
  - [ ] برنامه‌ریزی ارسال (Scheduled)
  - [ ] آمار باز شدن نوتیفیکیشن
- [ ] مدیریت پیام‌های درون‌برنامه‌ای
  - [ ] ایجاد بنر و پیام اعلان
  - [ ] نمایش در صفحه اصلی
  - [ ] نمایش در داشبورد
  - [ ] تعیین مدت نمایش
  - [ ] LInk به صفحه یا اکشن
- [ ] مدیریت محتوای آموزشی
  - [ ] ایجاد و ویرایش راهنماها (Guides)
  - [ ] ایجاد و ویرایش مستندات
  - [ ] مدیریت FAQ
  - [ ] ویدیوهای آموزشی
  - [ ] تصاویر و گرافیک
- [ ] مدیریت خبرنامه
  - [ ] ایجاد خبرنامه
  - [ ] مدیریت لیست مشترکین
  - [ ] ارسال ایمیل انبوه
  - [ ] آمار باز کردن و کلیک

### 12.7 داشبورد آماری و گزارش‌گیری
- [ ] آمار کاربران
  - [ ] نمودار رشد کاربران (Line Chart)
  - [ ] تعداد کاربران جدید در بازه‌های زمانی
  - [ ] نرخ فعال‌بودن کاربران
  - [ ] میانگین زمان حضور کاربران
- [ ] آمار مالی
  - [ ] درآمد ماهانه
  - [ ] درآمد سالانه
  - [ ] توزیع درآمد بر اساس پلن
  - [ ] پیش‌بینی درآمد آینده
- [ ] آمار تیکتینگ
  - [ ] تعداد تیکت‌ها در بازه‌های زمانی
  - [ ] میانگین زمان پاسخ‌دهی
  - [ ] نرخ حل تیکت‌ها
  - [ ] رضایت کاربران
- [ ] گزارش‌های قابل دانلود
  - [ ] گزارش کاربران (CSV, Excel)
  - [ ] گزارش مالی (PDF, Excel)
  - [ ] گزارش تیکت‌ها (CSV)
  - [ ] گزارش فعالیت‌ها (CSV)
  - [ ] گزارش‌های سفارشی

### 12.8 مدیریت داده‌ها
- [ ] بکاپ‌گیری (Backup)
  - [ ] بکاپ خودکار روزانه
  - [ ] بکاپ دستی
  - [ ] بکاپ قبل از تغییرات مهم
  - [ ] نگهداری 30 روز بکاپ
- [ ] بازیابی داده‌ها (Restore)
  - [ ] بازیابی از بکاپ
  - [ ] انتخاب تاریخ بکاپ
  - [ ] پیش‌نمایش قبل از بازیابی
  - [ ] بازیابی انتخابی (جداول خاص)
- [ ] مدیریت داده‌های قدیمی
  - [ ] مشاهده حجم دیتابیس
  - [ ] پاکسازی داده‌های قدیمی
  - [ ] آرشیو داده‌های قدیمی
  - [ ] تنظیمات نگهداری خودکار
- [ ] خروجی و ورودی داده‌ها
  - [ ] Export کل دیتابیس (SQL)
  - [ ] Export داده‌های کاربران (CSV, JSON)
  - [ ] Import داده‌ها از فایل
  - [ ] مهاجرت داده‌ها (Migration)

### 12.9 امنیت و لاگ‌ها
- [ ] لاگ تمام اکشن‌های ادمین
  - [ ] لاگ ورود/خروج ادمین
  - [ ] لاگ تغییرات کاربران
  - [ ] لاگ تغییرات پلن‌ها
  - [ ] لاگ ارسال نوتیفیکیشن‌ها
- [ ] مدیریت دسترسی‌ها (RBAC)
  - [ ] ایجاد نقش‌های مختلف (Admin, Moderator, Support)
  - [ ] تخصیص دسترسی‌ها به هر نقش
  - [ ] مدیریت ادمین‌ها
  - [ ] افزودن/حذف ادمین
  - [ ] ویرایش دسترسی‌های ادمین
- [ ] تنظیمات امنیتی
  - [ ] فعال/غیرفعال کردن 2FA
  - [ ] IP Whitelist
  - [ ] محدودیت تعداد تلاش‌های ورود
  - [ ] تنظیمات رمز عبور
- [ ] لاگ‌های سیستم
  - [ ] مشاهده لاگ‌های API
  - [ ] مشاهده لاگ‌های خطا
  - [ ] مشاهده لاگ‌های اطلاعاتی
  - [ ] فیلتر و جستجو در لاگ‌ها
  - [ ] خروجی لاگ‌ها
- [ ] نظارت و مانیتورینگ
  - [ ] مشاهده ترافیک لحظه‌ای
  - [ ] شناسایی ترافیک مشکوک
  - [ ] Rate Limiting
  - [ ] Blocked IPs
  - [ ] Security Alerts

### 12.10 یکپارچگی‌ها (Integrations)
- [ ] اتصال به درگاه پرداخت
  - [ ] زرین‌پال (ZarinPal)
  - [ ] آیدی‌پرد (IDPay)
  - [ ] پی‌پینگ (PingPing)
  - [ ] مدیریت تراکنش‌ها
  - [ ] تایید پرداخت‌ها
  - [ ] بازپرداخت
- [ ] اتصال به سرویس ایمیل
  - [ ] SendGrid
  - [ ] Mailgun
  - [ ] AWS SES
  - [ ] مدیریت Template‌ها
  - [ ] ارسال ایمیل انبوه
- [ ] اتصال به سرویس SMS
  - [ ] کاوه‌نگار (Kavenegar)
  - [ ] ملی پیامک (Meli Payamak)
  - [ ] فراز SMS (Faraz SMS)
  - [ ] مدیریت ارسال انبوه
- [ ] اتصال به Analytics
  - [ ] Google Analytics 4
  - [ ] Mixpanel
  - [ ] Amplitude
  - [ ] دشبورد تحلیل کاربران
- [ ] Webhooks
  - [ ] ایجاد Webhook برای رویدادها
  - [ ] مدیریت Webhookها
  - [ ] ارسال رویدادها به سرویس‌های خارجی
  - [ ] Log ارسال‌های Webhook

### 12.11 API های ادمین
- [ ] GET /api/admin/dashboard - داشبورد مدیریتی
- [ ] GET /api/admin/users - لیست کاربران
- [ ] GET /api/admin/users/[id] - جزئیات کاربر
- [ ] PATCH /api/admin/users/[id]/plan - تغییر پلن کاربر
- [ ] PATCH /api/admin/users/[id]/status - تغییر وضعیت کاربر
- [ ] DELETE /api/admin/users/[id] - حذف کاربر
- [ ] GET /api/admin/subscriptions - لیست اشتراک‌ها
- [ ] GET /api/admin/revenue - آمار درآمد
- [ ] GET /api/admin/tickets - لیست تیکت‌ها
- [ ] POST /api/admin/tickets - ایجاد تیکت
- [ ] PATCH /api/admin/tickets/[id] - بروزرسانی تیکت
- [ ] POST /api/admin/tickets/[id]/messages - ارسال پیام
- [ ] GET /api/admin/analytics - آمار پیشرفته
- [ ] POST /api/admin/notifications/broadcast - نوتیفیکیشن انبوه
- [ ] GET /api/admin/logs - مشاهده لاگ‌ها
- [ ] POST /api/admin/backup - بکاپ‌گیری
- [ ] POST /api/admin/restore - بازیابی داده‌ها

### 12.12 UI Components
- [ ] Sidebar Navigation
- [ ] Dashboard با Cards و Charts
- [ ] Data Tables با Pagination و Sorting
- [ ] Filters و Search
- [ ] Modal dialogs
- [ ] Toast Notifications
- [ ] Loading States و Skeletons
- [ ] Empty States
- [ ] Error Boundaries
- [ ] Dark Mode Support

---

## 📊 خلاصه پیشرفت کلی

| فاز | عنوان | وضعیت | پیشرفت |
|-----|-------|-------|--------|
| 1 | سیستم احراز هویت | ✅ تکمیل شده | 100% |
| 2 | سیستم تعهدات | ✅ تکمیل شده | 100% |
| 3 | سیستم بازتاب | ✅ تکمیل شده | 100% |
| 4 | سیستم برنامه‌ریزی | ✅ تکمیل شده | 100% |
| 5 | سیستم نوتیفیکیشن | ✅ تکمیل شده (MVP) | 90% |
| 6 | گزارش‌دهی و تحلیل | 🔄 85% (PDF موکوف) | 85% |
| 7 | قابلیت‌های اجتماعی | 🔄 60% (7.1, 7.2, 7.3) | 60% |
| 8 | AI پیشرفته | ⏳ شروع نشده | 0% |
| 9 | بهینه‌سازی | ⏳ شروع نشده | 0% |
| 10 | دیپلوی | ⏳ شروع نشده | 0% |
| 11 | اپلیکیشن موبایل | ⏳ شروع نشده | 0% |
| 12 | پنل مدیریت ادمین | ⏳ شروع نشده | 0% |

**پیشرفت کلی پروژه:** **~58%** (7.1 فاز از 12 فاز اصلی)

---

## 🚀 اولویت‌های بعدی

برای ادامه توسعه، پیشنهاد می‌شود فازها را به این ترتیب پیاده‌سازی کنید:

1. **فاز 6 (Analytics):** تکمیل دید و تحلیل پیشرفت کاربر
2. **فاز 12 (Admin Panel):** مدیریت کاربران و سیستم
3. **فاز 8 (AI پیشرفته):** افزودن ارزش بیشتر با AI
4. **فاز 9 (بهینه‌سازی):** آماده‌سازی برای Production
5. **فاز 10 (دیپلوی):** راه‌اندازی محیط واقعی
6. **فاز 7 (Social):** افزودن جنبه اجتماعی (اختیاری)
7. **فاز 11 (Mobile):** توسعه اپلیکیشن موبایل (اختیاری)

---

## 📝 نکات مهم

- هر فاز باید قبل از شروع فاز بعدی به طور کامل تست شود
- مستندسازی API باید به‌روز نگه داشته شود
- کد باید تمیز و قابل نگهداری باشد
- تست‌های واحد و یکپارچگی نوشته شوند
- بازخورد کاربران جمع‌آوری و تحلیل شود

---

**آخرین بروزرسانی:** 2025-01-30
**نسخه:** 1.4.1
**وضعیت پروژه:** در حال توسعه (Development)
**تغییرات نسخه 1.4.1:**
- بهبود فاز 7.3: جامعه کاربران (Community)
  - افزودن تب "کاربران" با قابلیت جستجو و فالو/آنفالو
  - API: GET /api/community/users - لیست کاربران با جستجو
  - API: POST /api/community/users/[id]/follow - فالو کردن کاربر
  - API: DELETE /api/community/users/[id]/follow - آنفالو کردن کاربر
  - کامپوننت UsersList.tsx با UI کامل
  - API: POST /api/dev/create-leaderboard-test-data - ایجاد داده‌های تستی جامعه با چالش‌ها
  - API: DELETE /api/dev/clear-leaderboard-test-data - حذف کامل داده‌های تستی
  - API: GET /api/dev/check-leaderboard-test-data - بررسی وجود داده‌های تستی
  - اضافه شدن توضیح نحوه محاسبه امتیاز در لیدربورد:
    * هر پست: ۱۰ امتیاز
    * هر لایک دریافتی: ۲ امتیاز
    * هر کامنت دریافتی: ۳ امتیاز
    * هر فالوور: ۱ امتیاز
  - اصلاح مشکلات فیلد نام در Prisma Schema:
    * Challenge: userId → creatorId, target → targetValue
    * Like: userId → likerId
    * Comment: userId → authorId
    * اضافه کردن فیلدهای type و category برای مدل Challenge
  - پاکسازی داده‌های تستی قدیمی از دیتابیس
  - ابزارهای توسعه در DevToolsPanel برای مدیریت داده‌های تستی
  - بهبود مدیریت دکمه‌های ایجاد/حذف داده‌های تستی
- پروژه به 58% پیشرفت رسیده

**تغییرات نسخه 1.4.0:**
- تکمیل فاز 7.3: جامعه کاربران (Community)
  - فید عمومی دستاوردها با فیلتر (همه، دنبال‌شده‌ها، دستاوردها)
  - ایجاد و مدیریت پست‌ها (ایجاد، حذف)
  - سیستم لایک و آنلایک پست‌ها
  - سیستم کامنت‌گذاری با قابلیت پاسخ
  - سیستم فالو/آنفالو کاربران
  - چالش‌های گروهی (ایجاد، پیوستن، خروج)
  - لیدربورد هفتگی/ماهانه/همیشه با امتیازدهی
  - کامپوننت‌های UI: CommunityFeed, PostCard, Leaderboard, ChallengesList
  - API routes: /api/community/feed, /api/community/posts, /api/community/posts/[id]/like, /api/community/posts/[id]/comments, /api/community/comments/[id], /api/community/follow, /api/community/challenges, /api/community/challenges/[id]/join, /api/community/leaderboard
- پروژه به 58% پیشرفت رسیده

**تغییرات نسخه 1.3.0:**
- تکمیل فاز 7.1: پروفایل کاربری (User Profile)
  - صفحه پروفایل (/profile) با طراحی ریسپانسیو
  - آپلود تصویر پروفایل (حداکثر 5MB)
  - ویرایش نام و bio
  - نمایش آمار کاربر
  - API routes: /api/profile, /api/profile/stats, /api/profile/upload
- تکمیل فاز 7.2: اشتراک‌گذاری دستاوردها (Achievement Sharing)
  - تولید تصویر SVG برای سوشال مدیا (3 نوع: تعهد، Streak، تکمیل برنامه)
  - API: POST /api/achievements/share, GET /api/achievements/generate-image, GET /api/achievements/share-info
  - کامپوننت ShareButton با دکمه‌های اشتراک‌گذاری (توییتر، لینکدین، تلگرام)
  - صفحه عمومی اشتراک‌گذاری (/share/achievement/[token])
  - لینک‌های اشتراک‌گذاری با اعتبار 30 روز
- پروژه به 56% پیشرفت رسیده

**تغییرات نسخه 1.2.0:**
- تکمیل فاز 6 (Analytics) - به جز PDF Export
- PDF Export موکوف شده (مشکل فارسی و تمپلیت‌ها)
- تکمیل Word Cloud و Visualizations
- Excel Export کامل کار می‌کنه
- اشتراک‌گذاری گزارش‌ها فعال شد

**تغییرات نسخه 1.1.0:**
- اضافه شدن فاز 12 (Admin Panel)
- تکمیل بخش 6.3 (Visualizations)
- اضافه شدن قابلیت خروجی PDF/Excel برای پلن‌های Pro/Plus
- اضافه شدن ابزار توسعه برای تغییر پلن
