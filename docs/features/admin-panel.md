# Admin Panel — پنل مدیریتی همسو

> **زمینه:** پنل ادمین در عمل یک «اپلیکیشن جدا» است که روی همان دیتابیس و adapter ها سوار می‌شود.
> **مقیاس:** ۸ ساب‌سیستم، هر کدام به اندازه چندین TASK اصلی.
> **هدف این سند:** scope بندی، MVP definition، و درخت تسک کامل.
> **منبع:** DECISION-026 (scope MVP vs Full)، فاز ۳ مانیفست (با MVP کوچک در فاز ۲)

---

## ۱. اصول طراحی

| اصل | معنا |
|-----|-------|
| **Separation of Concerns** | پنل ادمین در `/admin/*` با لایه auth/permission جدا |
| **Role-Based Access** | ۳ نقش: `OWNER`، `ADMIN`، `SUPPORT` (RBAC ساده) |
| **Audit Log** | هر عمل ادمین لاگ می‌شود (چه کسی، چه کاری، چه زمان) |
| **No Destructive by Default** | حذف کاربر = soft-delete + گزینه recover ۳۰ روز |
| **Reuse Adapters** | همه ادمین UI روی Adapter های موجود سوار می‌شود (SMS، AI، Payment) |
| **Persian-Native + Direction** | همان قواعد UI اصلی، فارسی، RTL، اعداد فارسی |
| **Mobile-Last** | پنل ادمین desktop-first است (mobile در فاز خیلی بعد) |

---

## ۲. ۸ ساب‌سیستم

### A. داشبورد مدیریتی (Dashboard)
KPI های اصلی، نمودارهای فعالیت، هشدارهای سیستمی.

### B. مدیریت کاربران (User Management)
لیست، فیلتر، جزئیات، تغییر پلن، ban/unban، impersonate (با لاگ).

### C. مدیریت پلن‌ها و اشتراک‌ها (Plans & Subscriptions)
تعریف پلن، قیمت‌ها، feature flags، تخفیف‌ها، کدهای دعوت.

### D. سیستم تیکتینگ و پشتیبانی (Support)
تیکت‌های کاربر، چت پشتیبانی، FAQ مدیریت، assign به اپراتور.

### E. مدیریت محتوا (Content Management)
صفحات استاتیک (about، privacy، terms)، اعلانات سیستمی، email/SMS templates.

### F. داشبورد آماری و گزارش‌گیری (Analytics)
گزارش‌های پیشرفته، export CSV/Excel، cohort analysis (محدود — حریم خصوصی).

### G. مدیریت داده‌ها و لاگ‌ها (Data & Logs)
audit log، error log، database backups، data export.

### H. یکپارچگی‌ها (Integrations)
درگاه پرداخت، سرویس ایمیل، سرویس پیامک، Provider های AI — کانفیگ و monitoring.

---

## ۳. MVP scope (فاز ۲) — حداقل قابل کارکرد

> **DECISION-026:** پنل ادمین کامل = فاز ۳. اما برای راه‌اندازی محصول، یک **MVP ادمین** در فاز ۲ ضروری است.

**MVP شامل:**
- ✅ B: لیست کاربران + جستجو + جزئیات + تغییر دستی پلن
- ✅ C: تعریف پلن‌ها (FREE/PLUS/PRO) با feature flags
- ✅ G (محدود): audit log برای عملیات ادمین
- ✅ H (محدود): فقط monitoring Provider ها (نه کانفیگ runtime)

**خارج از MVP (فاز ۳):**
- A: داشبورد KPI کامل
- D: سیستم تیکتینگ
- E: CMS کامل
- F: Analytics پیشرفته
- G (کامل): backup/export
- H (کامل): config runtime، تعویض Provider بدون restart

---

## ۴. RBAC و Auth  — بازنویسی‌شده در DECISION-036

> ⚠️ این بخش بخشِ RBAC در DECISION-026 (نقش ساده روی `User`، auth مشترک) را **جایگزین** می‌کند. باقی DECISION-026 معتبر است.

### مدل: RBAC کامل granular با هویت ادمین جدا
- **`AdminUser` جدا از `User`:** کارمندان (پشتیبان، تولیدکننده محتوا، …) کاربر نهایی اپ نیستند → سطح حمله جدا، login مستقل، نشت داده غیرممکن.
- **نقش = مجموعه‌ای از permission key.** دسترسی هیچ‌جا به نام نقش hardcode نمی‌شود؛ همیشه `can(perm)` چک می‌شود.

### نقش‌های پایه (isSystem — غیرقابل حذف، permission قابل ویرایش)
| نقش (key) | برچسب | دسترسی پیش‌فرض |
|-----------|-------|----------------|
| `owner` | مالک سایت | همه permissionها + `admins.manage` + `roles.manage` |
| `admin` | ادمین سیستم | همه به‌جز `admins.manage` و `roles.manage` |
| `content` | تولیدکننده محتوا | `content.*`، `dashboard.view` |
| `support` | پشتیبان | `support.*`، `users.read`، `dashboard.view` (بدون تغییر پلن/ban) |

> نقش‌های جدید **بدون migration** فقط با داده اضافه می‌شوند (جوهر ماژولار بودن).

### کاتالوگ permission (منبع‌حقیقت: `src/lib/admin/permissions.ts`)
گروه‌بندی‌شده برای UI:
- **dashboard:** `dashboard.view`
- **users:** `users.read` · `users.plan.write` · `users.ban`
- **plans:** `plans.read` · `plans.write`
- **ai:** `ai.read` · `ai.manage`
- **sms:** `sms.read` · `sms.send` · `sms.manage`
- **payment:** `payment.read` · `payment.manage`
- **support:** `support.read` · `support.respond`
- **content:** `content.read` · `content.write`
- **system:** `admins.manage` · `roles.manage` · `audit.read`

### Auth ادمین (DECISION-038 — جایگزین OTPِ ۰۳۶)
- ورود در `/admin/login` با **نام کاربری + رمز عبور** (نه OTP). **ادمین auto-create نمی‌شود**.
- **hashing:** scrypt داخلی (`src/lib/admin/password.ts`)؛ رمز هرگز plain ذخیره نمی‌شود.
- **پیچیدگی:** حداقل ۱۰ کاراکتر + حداقل ۳ از ۴ دسته.
- **مالک اول:** seed از env `ADMIN_OWNER_USERNAME`/`ADMIN_OWNER_PASSWORD`.
- **ادمین‌های دیگر:** owner نام کاربری می‌سازد، سیستم رمز پیچیده auto-generate می‌کند، `mustChangePassword=true` → تغییر اجباری در ورود اول.
- **brute-force:** ۵ تلاش ناموفق → قفل ۱۵ دقیقه (ثبت در AuditLog).
- session: کوکی جدا `hamsoo-admin-session` (۱۲ ساعت)، payload `{ adminId, roleKey }`.
- permissionها در **هر request از DB** resolve می‌شوند (تغییر نقش فوری اعمال می‌شود).
- **فاز ۳:** MFA دوم (TOTP) برای `owner`/`admin`.

---

## ۵. مدل داده — بازنویسی‌شده در DECISION-036

### RBAC (هویت و دسترسی ادمین)
```
AdminUser
├── id
├── username (unique)         ← هویت ورود (DECISION-038)
├── passwordHash              ← scrypt "salt:hash"
├── mustChangePassword: Bool  ← اجبار تغییر در ورود اول
├── phone?                     ← اختیاری، فقط تماس
├── displayName
├── roleId                    → AdminRole
├── isActive: Boolean
├── failedLoginAttempts: Int  ← محافظت brute-force
├── lockedUntil?              ← تا این زمان قفل
├── createdAt
└── lastLoginAt?

AdminRole
├── id
├── key (unique)          ← owner | admin | content | support | ...
├── label                  ← فارسی
├── description?
├── isSystem: Boolean      ← نقش پایه؛ غیرقابل حذف
└── createdAt

AdminPermission
├── id
├── key (unique)          ← "users.plan.write"
├── label                  ← برچسب فارسی برای UI
└── group                  ← "users" | "ai" | ...

AdminRolePermission        ← join (many-to-many)
├── roleId
└── permissionId           @@id([roleId, permissionId])

AdminAuditLog
├── id
├── actorId               → AdminUser (کیست)
├── action                 ← "user.plan.change" | "admin.login" | ...
├── targetType? / targetId?
├── meta?                   ← JSON serialized
└── createdAt
```

### تغییر روی User موجود
```
User
  + isBanned: Boolean  ← ban از پنل (DECISION-026 §حریم/امنیت)
  // نکته: فیلد role روی User اضافه نمی‌شود — هویت ادمین جدا است (DECISION-036)
  // deletedAt (soft-delete) هنگام ساخت ماژول حذف کاربر اضافه می‌شود — نه الان

Plan
├── id
├── code: String   ← FREE | PLUS | PRO
├── name: String
├── priceIRR: Int
├── billingCycle: String  ← MONTHLY | YEARLY | LIFETIME
├── featureFlags: String  ← JSON serialized
└── isActive: Boolean

Subscription
├── id
├── userId
├── planId
├── startedAt
├── expiresAt
├── status: String  ← ACTIVE | EXPIRED | CANCELED
├── paymentRef: String?  ← شناسه پرداخت
└── createdAt

Ticket (فاز ۳)
├── id
├── userId
├── subject
├── status: String  ← OPEN | IN_PROGRESS | RESOLVED | CLOSED
├── assignedToUserId: String?
└── createdAt

TicketMessage (فاز ۳)
├── id
├── ticketId
├── authorUserId
├── content
└── createdAt

AuditLog
├── id
├── actorUserId      ← کیست
├── action: String   ← USER_BAN | PLAN_CHANGE | LOGIN | ...
├── targetType: String?
├── targetId: String?
├── meta: String      ← JSON serialized
└── createdAt

Announcement (فاز ۳)
├── id
├── title
├── content
├── audience: String  ← ALL | PLAN_FREE | PLAN_PLUS | ...
├── publishedAt
└── isActive
```

---

## ۶. درخت تسک

### TASK-ADMIN-MVP | پنل ادمین MVP (فاز ۲)
- **اولویت:** 🟠 High
- **وابستگی:** TASK-PROFILE-BASE، TASK-AI-ARCH

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-ADMIN-MVP-01 | افزودن `role` و `isBanned` به User + migration |
| TASK-ADMIN-MVP-02 | middleware: محافظت از `/admin/*` بر اساس role |
| TASK-ADMIN-MVP-03 | layout اختصاصی ادمین (`src/app/admin/layout.tsx`) با Nav جدا |
| TASK-ADMIN-MVP-04 | صفحه `/admin/users` — لیست + جستجو + فیلتر پلن |
| TASK-ADMIN-MVP-05 | صفحه `/admin/users/[id]` — جزئیات + تغییر پلن + ban |
| TASK-ADMIN-MVP-06 | مدل `Plan` + seed برای FREE/PLUS/PRO |
| TASK-ADMIN-MVP-07 | صفحه `/admin/plans` — مدیریت پلن‌ها و feature flags |
| TASK-ADMIN-MVP-08 | مدل `AuditLog` + helper `logAdminAction()` |
| TASK-ADMIN-MVP-09 | صفحه `/admin/audit` — مرور audit log |
| TASK-ADMIN-MVP-10 | صفحه `/admin/integrations` — monitoring providers (read-only) |

### TASK-ADMIN-DASHBOARD | داشبورد KPI (فاز ۳)
- **وابستگی:** TASK-ADMIN-MVP

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-ADMIN-DASH-01 | تعریف KPI ها: کاربر فعال روزانه، تعداد تعهد روزانه، گزارش تولید شده |
| TASK-ADMIN-DASH-02 | API های aggregation (با cache) |
| TASK-ADMIN-DASH-03 | UI نمودارها (انتخاب lib در DECISION-* بعدی — recharts/visx/...) |
| TASK-ADMIN-DASH-04 | filter بازه زمانی + drill-down |

### TASK-ADMIN-SUPPORT | سیستم تیکتینگ (فاز ۳)
- **وابستگی:** TASK-ADMIN-MVP، TASK-NOTIF-* (برای اطلاع‌رسانی)

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-ADMIN-SUP-01 | مدل Ticket + TicketMessage |
| TASK-ADMIN-SUP-02 | UI کاربر: `/support` — ساخت تیکت، تاریخچه |
| TASK-ADMIN-SUP-03 | UI ادمین: `/admin/tickets` — inbox، assign |
| TASK-ADMIN-SUP-04 | چت داخل تیکت (real-time در فاز بعد) |
| TASK-ADMIN-SUP-05 | یکپارچگی با Notification (نوتیف تیکت جدید/پاسخ) |

### TASK-ADMIN-CMS | مدیریت محتوا (فاز ۳)
- **وابستگی:** TASK-ADMIN-MVP

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-ADMIN-CMS-01 | مدل Announcement + targeting بر اساس پلن |
| TASK-ADMIN-CMS-02 | UI ساخت اعلان + preview |
| TASK-ADMIN-CMS-03 | نمایش اعلان در داشبورد کاربر |
| TASK-ADMIN-CMS-04 | template editor برای SMS/email (متغیرها {name}، …) |
| TASK-ADMIN-CMS-05 | صفحات استاتیک قابل ویرایش (about، privacy، terms) |

### TASK-ADMIN-ANALYTICS | آماری پیشرفته (فاز ۳)
- **وابستگی:** TASK-ADMIN-DASHBOARD

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-ADMIN-AN-01 | export CSV/Excel (با حذف PII اختیاری) |
| TASK-ADMIN-AN-02 | cohort analysis (با احتیاط حریم خصوصی) |
| TASK-ADMIN-AN-03 | retention curves |
| TASK-ADMIN-AN-04 | درخواست export GDPR-style (data takeout) |

### TASK-ADMIN-DATA | داده‌ها و لاگ‌ها (فاز ۳)
- **وابستگی:** TASK-ADMIN-MVP

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-ADMIN-DATA-01 | error log aggregation + UI |
| TASK-ADMIN-DATA-02 | backup خودکار SQLite (یا Postgres در فاز ۳) |
| TASK-ADMIN-DATA-03 | UI restore from backup (با تأیید چندمرحله‌ای) |

### TASK-ADMIN-INTEG | یکپارچگی‌ها (فاز ۳)
- **وابستگی:** TASK-ADMIN-MVP، TASK-PAYMENT (که خودش زیربخش است)

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-ADMIN-INTEG-SMS | UI تنظیم Provider SMS (Kavenegar/Melipayamak/Mock) + تست ارسال |
| TASK-ADMIN-INTEG-AI | UI انتخاب AI Provider per نقش + تست + token monitoring |
| TASK-ADMIN-INTEG-PAY | UI درگاه پرداخت (Zarinpal/IDPay/...) — همراه TASK-PAYMENT |
| TASK-ADMIN-INTEG-EMAIL | UI Provider email (Mailgun/SES/...) + template testing |
| TASK-ADMIN-INTEG-HEALTH | health check dashboard همه integrations |

### TASK-PAYMENT | درگاه پرداخت (پیش‌نیاز Admin INTEG-PAY)
- **فاز:** ۲ (همراه TASK-PLAN-* و TASK-ADMIN-MVP-06/07)
- **وابستگی:** Adapter pattern (طبق DECISION-002)

| ساب‌تسک | توضیح |
|---------|--------|
| TASK-PAYMENT-01 | `PaymentAdapter` interface |
| TASK-PAYMENT-02 | `MockPaymentAdapter` (در dev، با اتصال به dev-data) |
| TASK-PAYMENT-03 | مدل Subscription + جریان پرداخت |
| TASK-PAYMENT-04 | callback handler از درگاه |
| TASK-PAYMENT-05 | `ZarinpalAdapter` (فاز ۲ یا ۳ — تصمیم در زمان نزدیک شدن) |
| TASK-PAYMENT-06 | invoice/receipt تولید فارسی |

---

## ۷. حریم خصوصی و امنیت

- ادمین هرگز content تعهد کاربر را نمی‌بیند مگر با اذن صریح (impersonate برای پشتیبانی، با لاگ)
- AuditLog **immutable** — هیچ ادمینی نمی‌تواند audit خودش را پاک کند
- Soft-delete کاربر = داده‌ها به مدت ۳۰ روز قابل بازیابی، سپس hard-delete
- export کاربر فقط با تأیید او (TASK-ADMIN-AN-04)

---

## ۸. تعارض با مانیفست — هیچ مستقیم

پنل ادمین یک ابزار **داخلی** است؛ بر تجربه کاربر تأثیر مستقیم ندارد. اما:
- ⚠️ **هشدار:** نباید تبدیل به ابزاری شود که از طریق آن «پیام انگیزشی» یا «مقایسه» به کاربر ارسال می‌شود — DECISION-024 و §۱ مانیفست. اعلان‌ها (Announcements) باید filter محتوایی داشته باشند.

---

*آخرین بروزرسانی: ۲۰۲۶-۰۵-۲۷ — ساخت اولیه*
