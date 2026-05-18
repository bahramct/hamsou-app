# راهنمای PDF Export - گزارش‌های فارسی

## مقدمه

سیستم PDF Export (خروجی PDF) Hamsou برای تولید گزارش‌های تحلیلی جامع و حرفه‌ای با حمایت کامل فارسی طراحی شده است. این سیستم چندین قالب مختلف ارائه می‌دهد که هر یک برای نیازهای خاصی بهینه‌شده‌اند.

## معماری

### کامپوننت‌های اصلی

```
Frontend (Client)
├── /src/components/analytics/pdf-export.tsx
│   └── PDFExport Component (UI)
│
API (Server)
├── /src/app/api/analytics/export/pdf/route.ts
│   └── PDF Generation Endpoint
│
Utilities
├── /src/lib/pdf-templates.ts
│   └── AnalyticsReportTemplate Class
├── /src/lib/pdf-helpers.ts
│   └── Helper Functions
└── /src/lib/pdf-font-loader.ts
    └── Persian Font Support
```

## استفاده

### سمت کلاینت (Frontend)

```jsx
import { PDFExport } from '@/components/analytics/pdf-export';

export function AnalyticsPage() {
  return (
    <div>
      <PDFExport timeRange="30d" />
    </div>
  );
}
```

**Props:**
- `timeRange` (string): بازه‌ی زمانی - `7d`, `30d`, `90d`, یا `all`

### سمت سرور (Backend)

**Endpoint:**
```
GET /api/analytics/export/pdf?range=30d&template=default
```

**Query Parameters:**
- `range` (optional): بازه زمانی (`7d`, `30d`, `90d`, `all`)
- `template` (optional): قالب (`default`, `minimalist`, `detailed`, `executive`)

**مثال:**
```javascript
const response = await fetch('/api/analytics/export/pdf?range=30d&template=default', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const blob = await response.blob();
// دانلود فایل...
```

## قالب‌های موجود

### 1. DEFAULT (پیش‌فرض)
- **رنگ**: Indigo و Violet
- **محتوا**: تمام بخش‌ها
- **بهترین برای**: استفاده‌ی عمومی
- **ویژگی‌ها**:
  - هدر رنگی
  - اطلاعات کاربر
  - جداول آمار و روندها
  - بخش بینش‌ها
  - footer

### 2. MINIMALIST
- **رنگ**: سیاه و خاکستری
- **محتوا**: فقط اساسی‌ها
- **بهترین برای**: پرینت
- **ویژگی‌ها**:
  - بدون رنگ پس‌زمینه
  - بدون اطلاعات کاربر
  - بدون footer
  - صرفه‌جویی در جوهر/رنگ

### 3. DETAILED
- **رنگ**: Emerald و Cyan
- **محتوا**: جزئیات کامل
- **بهترین برای**: ارائه‌ای تفصیلی
- **ویژگی‌ها**:
  - پس‌زمینه رنگی
  - تمام جزئیات
  - رنگبندی جذاب
  - فرمت‌بندی دقیق

### 4. EXECUTIVE
- **رنگ**: Red و Orange
- **محتوا**: خلاصه KPIها
- **بهترین برای**: مدیریت
- **ویژگی‌ها**:
  - بدون جداول هفتگی
  - فقط آمار کلیدی
  - بینش‌های اجمالی
  - مختصر و تمیز

## ساختار PDF

### هدر
```
╔════════════════════════════════════════════╗
║       گزارش تحلیلی همسو                  ║
║    گزارش پیشرفت شما در ۳۰ روز اخیر    ║
╚════════════════════════════════════════════╝
```

### بخش اطلاعات
```
اطلاعات گزارش
نام کاربر: علی رضایی
شماره تماس: ۰۹۱۲۳۴۵۶۷۸۹
تاریخ گزارش: ۱۵ اردیبهشت ۱۴۰۳
نوع پلن: pro
```

### جداول
1. **جدول خلاصه آمار**
   - کل تعهدات
   - تعهدات تکمیل‌شده
   - نرخ تکمیل
   - کل بازتاب‌ها
   - برنامه‌ها

2. **جدول روند هفتگی**
   - هفته
   - کل تعهدات
   - تعهدات تکمیل‌شده
   - درصد تکمیل

### بخش بینش‌ها
- تحلیل عملکرد بر اساس نرخ تکمیل
- تحلیل روزهای متوالی (Streak)
- تحلیل برنامه‌ها
- تحلیل بازتاب‌ها

### فوتر
```
────────────────────────────────────────────
تولید شده توسط همسو | پلتفرم رشد شخصی شما
```

## ویژگی‌های فنی

### حمایت فارسی
- ✅ فونت Vazirmatn (Persian)
- ✅ تبدیل اعداد انگلیسی به فارسی (۰-۹)
- ✅ RTL (راست به چپ) صحیح
- ✅ نام‌های فارسی برای دسته‌بندی‌ها

### مدیریت صفحات
- ✅ Page breaks خودکار
- ✅ Pagination برای داده‌های زیاد
- ✅ Footer بر روی تمام صفحات
- ✅ Header بر روی صفحه اول

### Error Handling
- ✅ احراز هویت (401)
- ✅ مجوز (403)
- ✅ خطاهای سرور (500)
- ✅ پیام‌های خطای فارسی

## ایجاد PDF با کد

```typescript
import { AnalyticsReportTemplate } from '@/lib/pdf-templates';
import { ReportTemplate } from '@/lib/pdf-template-types';

// ایجاد template
const template = new AnalyticsReportTemplate(ReportTemplate.DEFAULT);

// تولید PDF
const pdfBuffer = template.generateReport({
  userData: {
    name: 'علی رضایی',
    phone: '0912345678',
    subscriptionPlan: 'pro',
  },
  stats: {
    totalCommitments: 85,
    completedCommitments: 72,
    completionRate: 84.7,
    totalReflections: 30,
    totalPlans: 5,
    completedPlans: 2,
    currentStreak: 12,
  },
  trends: [
    { week: 'هفته ۱', total: 14, completed: 11, rate: 79 },
    { week: 'هفته ۲', total: 15, completed: 13, rate: 87 },
    // ... more weeks
  ],
  range: '30d',
});

// استفاده از buffer...
```

## محدودیت‌ها و شرایط

### پلن‌های مجاز
- ✅ Pro
- ✅ Plus
- ❌ Free
- ❌ Basic

### موارد خطا
- احراز هویت نشده → 401
- پلن نامناسب → 403
- بازه زمانی نامعتبر → استفاده از default
- Template نامعتبر → استفاده از default

## تست محلی

```bash
# 1. نصب dependencies
npm install

# 2. شروع سرور
npm run dev

# 3. رفتن به صفحه analytics
open http://localhost:3000/analytics

# 4. دانلود PDF
# - کلیک بر دکمه "دانلود PDF"
# - انتخاب template
# - دانلود فایل فارسی
```

## Troubleshooting

### مشکل: خطای 401 (Unauthorized)
**حل**: اطمینان از صحت token در localStorage
```javascript
console.log(localStorage.getItem('token'));
```

### مشکل: خطای 403 (Permission Denied)
**حل**: کاربر باید Pro یا Plus plan داشته باشد
```typescript
// در API
const userPlan = (userData.subscriptionPlan || 'free').toLowerCase();
if (userPlan !== 'pro' && userPlan !== 'plus') {
  return NextResponse.json({ error: 'Plan required' }, { status: 403 });
}
```

### مشکل: PDF خالی یا ناقص
**حل**: بررسی لاگ‌های `[PDF Export]` در console
```bash
tail -50 dev.log | grep "\[PDF Export\]"
```

### مشکل: فارسی درست نمایش داده نمی‌شود
**حل**: فونت Vazirmatn بارگیری شده است؟
```typescript
loadVazirmatnFont(doc); // باید بعد از new jsPDF() فراخوانی شود
```

## توسعه‌ی آینده

### ویژگی‌های پیشنهادی
- [ ] نمودارهای تصویری (Bar charts, Line charts)
- [ ] تولید چندین فایل PDF (Batch)
- [ ] ارسال PDF به ایمیل
- [ ] ذخیره PDF روی سرور
- [ ] تولید PDF بر اساس فرمت‌های دیگر
- [ ] بیش‌تر درجات‌ی رنگی

## منابع

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [jsPDF AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [Vazirmatn Font](https://github.com/rastikerdar/vazirmatn)
- [Persian Styling Guide](./PERSIAN-STYLING.md)

---

**نسخه**: 1.0.0
**آخرین به‌روزرسانی**: 2025-05-16
**وضعیت**: ✅ Production Ready
