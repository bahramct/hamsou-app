# Documentation (مستندات)

مستندات کامل پروژه همسو (Hamsou).

---

## ساختار مستندات

```
docs/
├── README.md                    # این فایل
├── 00-getting-started/          # شروع و نصب
│   ├── 01-installation.md
│   └── 02-environment-setup.md
├── 01-development/              # راهنمای توسعه
│   ├── 01-development-guide.md
│   ├── 02-dev-tools.md
│   ├── 03-git-workflow.md
│   └── 04-agent-guidelines.md
├── 02-deployment/               # راهنمای استقرار
│   ├── 01-deployment-guide.md
│   └── 02-pm2-guide.md
├── 03-architecture/             # معماری سیستم
│   ├── 01-system-architecture.md
│   └── 02-ai-implementation.md
├── 04-features/                 # قابلیت‌ها
│   ├── 01-ai-report.md
│   └── 02-pdf-export.md
├── 05-troubleshooting/          # حل مشکلات
│   ├── 01-common-issues.md
│   └── 02-platform-specific.md
└── 06-planning/                 # برنامه‌ریزی
    ├── 01-roadmap.md
    ├── 02-roadmap-progress.md
    └── 03-refactor-todos.md
```

---

## شروع سریع

### اگر تازه وارد هستید:

1. **[نصب و راه‌اندازی](00-getting-started/01-installation.md)** ← شروع از اینجا!
2. [تنظیم Environment](00-getting-started/02-environment-setup.md)

### اگر توسعه‌دهنده هستید:

1. [راهنمای توسعه](01-development/01-development-guide.md)
2. [Dev Tools](01-development/02-dev-tools.md)
3. [Git Workflow](01-development/03-git-workflow.md)

### اگر می‌خواهید پروژه را استقرار کنید:

1. [راهنمای Deployment](02-deployment/01-deployment-guide.md)
2. [مدیریت با PM2](02-deployment/02-pm2-guide.md)

### اگر با خطا مواجه شدید:

1. [مشکلات رایج](05-troubleshooting/01-common-issues.md) ← شروع از اینجا!
2. [مشکلات پلتفرم](05-troubleshooting/02-platform-specific.md)

### اگر می‌خواهید ساختار پروژه را بفهمید:

1. [معماری سیستم](03-architecture/01-system-architecture.md)
2. [پیاده‌سازی AI](03-architecture/02-ai-implementation.md)

### اگر روی فیچر خاصی کار می‌کنید:

1. [AI Report](04-features/01-ai-report.md)
2. [PDF Export](04-features/02-pdf-export.md)

### اگر می‌خواهید آینده پروژه را بدانید:

1. [نقشه راه](06-planning/01-roadmap.md)
2. [پیشرفت فیچرها](06-planning/02-roadmap-progress.md)
3. [رفکتورها](06-planning/03-refactor-todos.md)

---

## استاندارد نام‌گذاری

- همه فایل‌ها با **حروف کوچک** و **خط تیره** (`-`)
- شماره‌گذاری برای ترتیب خواندن: `01-xxx.md`, `02-xxx.md`
- بدون تکرار محتوا
- هر محتوا فقط در یک فایل

---

## اصول طراحی مستندات

### 1. بدون همپوشانی
- هر محتوا فقط در یک فایل
- از cross-reference استفاده کنید

### 2. به‌روز و دقیق
- مستندات باید با کد هماهنگ باشد
- تغییرات مهم باید در مستندات منعکس شود

### 3. قابل جستجو
- از عناوین مشخص و کلمات کلیدی استفاده کنید
- ساختار hierarchical (تو در تو)

### 4. مثال‌محور
- همیشه کد نمونه ارائه دهید
- مثال‌ها باید واقعی و قابل اجرا باشند

---

## مشارکت در مستندات

### قبل از تغییر مستندات:

1. چک کنید آیا فایل مشابه وجود دارد
2. از ساختار موجود پیروی کنید
3. از استاندارد نام‌گذاری استفاده کنید

### اضافه کردن مستند جدید:

1. فایل را در پوشه مناسب قرار دهید
2. نام‌گذاری طبق استاندارد
3. README پوشه را آپدیت کنید
4. Cross-reference اضافه کنید

### به‌روزرسانی مستندات:

1. تغییرات را واضح و دقیق بنویسید
2. تاریخ و version را آپدیت کنید
3. اگر نیاز بود، related docs را هم آپدیت کنید

---

## مشکلات با مستندات؟

اگر مستندات:
- ناقص است
- اشتباه است
- قدیمی است
- گیج‌کننده است

لطفاً issue ایجاد کنید یا مستقماً pull request بفرستید.

---

## آخرین بروزرسانی

- **تاریخ:** 2025-01-18
- **نسخه:** 2.0.0
- **تغییرات:**
  - بازسازی کامل ساختار docs/
  - حذف فایل‌های تکراری و بی‌فایده
  - دسته‌بندی منطقی
  - استاندارد نام‌گذاری
  - README برای هر پوشه
