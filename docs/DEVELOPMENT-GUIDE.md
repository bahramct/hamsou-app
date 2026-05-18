# راهنمای توسعه و جلوگیری از مشکلات

## 📋 فهرست

1. [مشکل اصلی و ریشه‌یابی](#مشکل-اصلی-و-ریشهیابی)
2. [راه حل‌های پیاده‌سازی شده](#راه-حلهای-پیادهسازی-شده)
3. [نکات مهم توسعه](#نکات-مهم-توسعه)
4. [چک‌لیست قبل از commit](#چکلیست-قبل-از-commit)

---

## مشکل اصلی و ریشه‌یابی

### چرا فیچرها خراب می‌شن؟

در جریان توسعه، مشاهده شد که هر بار فیچر جدیدی اضافه می‌شد، بخش‌هایی از سیستم که قبلاً کار می‌کردند خراب می‌شدند. مثلاً:

1. **خطای "attempt to write a readonly database"** در DevToolsPanel
2. **سرور مدام خاموش و روشن می‌شد**

### ریشه‌یابی:

#### مشکل ۱: Database Path اشتباه در .env

**مسیر فایل‌های مشکل‌دار:**
- `.env`
- `.env.local`

**مشکل:**
```bash
# ❌ اشتباه
DATABASE_URL="file:../db/hamsou.db?connection_limit=1"
```

این path از root پروژه یک پوشه بالاتر می‌رود (`../`) در حالی که دیتابیس در `db/hamsou.db` قرار داره.

**راه حل:**
```bash
# ✅ درست
DATABASE_URL="file:db/hamsou.db?connection_limit=1"
```

#### مشکل ۲: سرور مدام خاموش می‌شد

**دلیل:**
وقتی `bun run dev` با `nohup` یا `&` در background اجرا می‌شد، به خاطر pipe با `tee` و مدیریت session، process بعد از مدتی kill می‌شد.

**راه حل:**
استفاده از اسکریپت `.zscripts/dev.sh` که از `disown` استفاده می‌کند.

---

## راه حل‌های پیاده‌سازی شده

### 1. اصلاح Environment Variables

**فایل‌های اصلاح شده:**
- `prisma/schema.prisma` - استفاده از `env("DATABASE_URL")` به جای path سخت‌کد شده
- `.env` - اصلاح path دیتابیس
- `.env.local` - اصلاح path دیتابیس

**وضعیت:** ✅ تکمیل شده

### 2. محیط Development و Production

#### سطوح حفاظت برای DevToolsPanel:

**سطح ۱: داخل کامپوننت**
```typescript
// src/components/dev/dev-tools-panel.tsx
// Don't render in production
if (process.env.NODE_ENV === 'production') {
  return null;
}
```

**سطح ۲: در صفحه‌ها**
```typescript
// src/app/demo/page.tsx
{/* Dev Tools Panel - فقط در محیط توسعه */}
{process.env.NODE_ENV === 'development' && (
  <div className="mt-8">
    <DevToolsPanel />
  </div>
)}
```

#### متغیرهای محیطی:

**در `.env` و `.env.local`:**
```bash
NODE_ENV="development"
JWT_SECRET="hamsou-dev-secret-key-change-in-production"
AI_PROVIDER="z-ai"
DATABASE_URL="file:db/hamsou.db?connection_limit=1"
```

**در production:**
```bash
NODE_ENV="production"
JWT_SECRET="should-be-changed-in-production"
DATABASE_URL="file:./db/hamsou.db?connection_limit=1"
```

### 3. ساختار دیتابیس و Prisma

**نکته مهم:**
- همیشه از `env("DATABASE_URL")` در `prisma/schema.prisma` استفاده کن
- هیچ‌وقت path رو سخت‌کد نکن

**مثال درست:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // ✅ درست
}
```

**مثال غلط:**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:../db/hamsou.db"  // ❌ اشتباه
}
```

### 4. اجرای سرور توسعه

**روش درست:**
```bash
bash .zscripts/dev.sh
```

**اسکریپت dev.sh چه کار می‌کنه؟**
1. بسته‌ها رو نصب می‌کنه (`bun install`)
2. دیتابیس رو sync می‌کنه (`bun run db:push`)
3. سرور رو در background اجرا می‌کنه
4. از `disown` استفاده می‌کنه تا process پایدار بمونه

**روش‌های غلط:**
```bash
# ❌ این روش‌ها باعث خاموش شدن سرور میشن
nohup bun run dev &
bun run dev &
./node_modules/.bin/next dev -p 3000 &
```

---

## نکات مهم توسعه

### ۱. محیط Development vs Production

**قانون طلایی:**
> هر چیزی که برای development هست، باید با `process.env.NODE_ENV` کنترل بشه.

**لیست کامپوننت‌های development-only:**
- `DevToolsPanel`
- API routes در `src/app/api/dev/*`

### ۲. تغییرات در Environment Variables

**قبل از تغییر .env:**
1. چک کن path دیتابیس درست هست (`db/` نه `../db/`)
2. اطمینان حاصل کن `NODE_ENV` روی `development` هست
3. اگر JWT_SECRET رو عوض کردی، احتمالاً کاربر log out میشه

**بعد از تغییر .env:**
1. سرور رو ریستارت کن
2. دیتابیس رو sync کن: `bun run db:push`

### ۳. تغییرات در Prisma Schema

**قبل از تغییر schema:**
1. بکاپ از دیتابیس بگیر
2. مطمئن شو از `env("DATABASE_URL")` استفاده می‌کنی

**بعد از تغییر schema:**
```bash
bun run db:generate  # regenerate Prisma Client
bun run db:push      # sync schema with database
```

### ۴. استفاده از DevToolsPanel

**DevToolsPanel چی کار می‌کنه؟**
- تولید داده‌های تستی
- تغییر پلن کاربری (local)
- پاک کردن داده‌های تستی
- تست نوتیفیکیشن‌ها
- تست لیدربورد

**مهم:** DevToolsPanel فقط در development کار می‌کنه. در production کاملاً حذف میشه.

---

## چک‌لیست قبل از commit

قبل از اینکه فیچر جدیدی رو commit کنی، این چک‌لیست رو اجرا کن:

### 1. چک کردن Environment Variables
- [ ] `DATABASE_URL` path درست هست (`db/hamsou.db` نه `../db/hamsou.db`)
- [ ] `NODE_ENV` روی `development` در dev و `production` در production
- [ ] `JWT_SECRET` در development فرق می‌کنه با production

### 2. چک کردن Prisma
- [ ] schema از `env("DATABASE_URL")` استفاده می‌کنه
- [ ] بعد از تغییر schema: `bun run db:generate` و `bun run db:push` اجرا شده

### 3. چک کردن کامپوننت‌های Dev-Only
- [ ] همه چیزهایی که فقط برای development هستن با `process.env.NODE_ENV` کنترل میشن
- [ ] DevToolsPanel دو لایه حفاظتی داره (داخل کامپوننت و در صفحه)

### 4. تست سرور
- [ ] سرور با `.zscripts/dev.sh` اجرا شده
- [ ] سرور پایدار می‌مونه و خاموش نمیشه
- [ ] API routes درست کار می‌کنن
- [ ] DevToolsPanel در development هست و در production نیست

### 5. تست فیچر
- [ ] فیچر جدید کار می‌کنه
- [ ] فیچرهای قبلی هنوز کار می‌کنن
- [ ] هیچ خطایی در console نیست

### 6. دیتابیس
- [ ] می‌تونی به دیتابیس بنویسی (خطای readonly نداریم)
- [ ] می‌تونی از دیتابیس بخونی
- [ ] داده‌های تستی با DevToolsPanel ساخته و پاک میشن

---

## مشکل‌های رایج و راه حل

### مشکل: "attempt to write a readonly database"

**دلایل احتمالی:**
1. `DATABASE_URL` path اشتباه داره (`../db/` به جای `db/`)
2. Prisma schema path سخت‌کد شده
3. فایل دیتابیس permission اشتباه داره

**راه حل:**
```bash
# 1. چک کردن .env و .env.local
cat .env | grep DATABASE_URL

# 2. اصلاح path
DATABASE_URL="file:db/hamsou.db?connection_limit=1"

# 3. چک کردن prisma/schema.prisma
# باید اینطوری باشه:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

# 4. ریستارت سرور
killall node
bash .zscripts/dev.sh
```

### مشکل: سرور مدام خاموش میشه

**دلیل:**
استفاده از `nohup bun run dev &` یا روش‌های مشابه

**راه حل:**
```bash
# ✅ استفاده از اسکریپت dev.sh
bash .zscripts/dev.sh
```

### مشکل: فیچر قبلی خراب شده

**چک‌ها:**
1. آیا `.env` تغییر کرده؟
2. آیا `prisma/schema.prisma` تغییر کرده؟
3. آیا دیتابیس sync شده؟

**راه حل:**
```bash
# 1. ریستارت سرور
killall node
bash .zscripts/dev.sh

# 2. Sync دیتابیس
bun run db:push

# 3. تست کردن DevToolsPanel
# (اگر این کار کنه، مشکل از دیتابیس حل شده)
```

---

## خلاصه

### نکات کلیدی برای جلوگیری از خراب شدن فیچرها:

1. **Environment Variables:**
   - همیشه path دیتابیس رو چک کن (`db/` نه `../db/`)
   - NODE_ENV رو درست تنظیم کن

2. **Prisma:**
   - همیشه از `env("DATABASE_URL")` استفاده کن
   - بعد از تغییر schema، دیتابیس رو sync کن

3. **Dev-Only Components:**
   - با `process.env.NODE_ENV` کنترل کن
   - دو لایه حفاظتی داشته باش (داخل کامپوننت و در صفحه)

4. **سرور:**
   - از `.zscripts/dev.sh` استفاده کن
   - از `nohup bun run dev &` استفاده نکن

5. **تست:**
   - بعد از هر فیچر جدید، فیچرهای قبلی رو هم تست کن
   - DevToolsPanel رو تست کن (اگر این کار کنه، دیتابیس درسته)

---

## آخرین بروزرسانی

- **تاریخ:** ۲۰۲۵-۰۱-XX
- **نسخه:** 1.0.0
- **تغییرات:**
  - اصلاح DATABASE_URL در .env و .env.local
  - اصلاح prisma/schema.prisma برای استفاده از env
  - مستندسازی راهنمای توسعه
