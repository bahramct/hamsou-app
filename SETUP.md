# راه‌اندازی پروژه همسو (Hamsou)

## مشکل Prisma Client

اگر ارور زیر را دریافت کردید:
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

این یعنی Prisma Client تولید نشده است. راه‌حل:

## راه‌اندازی سریع (Windows)

### روش 1: استفاده از اسکریپت setup (پیشنهادی)
```bash
setup.bat
```

### روش 2: دستی
```bash
# 1. نصب dependencies
bun install

# 2. تولید Prisma Client (خیلی مهم!)
bun run prisma generate

# 3. راه‌اندازی دیتابیس
bun run db:push

# 4. ایجاد داده‌های تستی
bun run scripts/seed-database.ts

# 5. اجرای پروژه
bun run dev
```

## راه‌اندازی سریع (Linux/Mac)

```bash
# استفاده از اسکریپت setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# یا دستی
bun install
bun run prisma generate
bun run db:push
bun run scripts/seed-database.ts
bun run dev
```

## علت مشکل

Prisma Client باید بعد از هر تغییری در `prisma/schema.prisma` دوباره تولید شود. این کار با دستور زیر انجام می‌شود:

```bash
bun run prisma generate
```

## چرا این مشکل پیش می‌آید؟

1. **node_modules حذف شده است** - وقتی node_modules پاک می‌شود، Prisma Client هم پاک می‌شود
2. **Schema تغییر کرده است** - هر تغییری در schema نیاز به generate مجدد دارد
3. **پروژه clone شده** - در یک سیستم جدید، Prisma Client وجود ندارد
4. **پکیج‌ها آپدیت شده‌اند** - آپدیت Prisma نیاز به generate مجدد دارد

## نکات مهم

### همیشه قبل از اجرای پروژه
```bash
bun run prisma generate
```

### بعد از تغییر schema.prisma
```bash
bun run prisma generate
bun run db:push
```

### بعد از نصب پروژه در سیستم جدید
```bash
bun install
bun run prisma generate
bun run db:push
```

## ساختار پوشه node_modules

برای اطمینان از صحت نصب، ساختار زیر باید وجود داشته باشد:
```
node_modules/
├── @prisma/
│   └── client/
│       ├── index.d.ts
│       ├── index.js
│       ├── libquery_engine/
│       └── ...
├── prisma/
│   └── (پوشه Prisma CLI)
└── ...
```

## بررسی صحت نصب

```bash
# بررسی وجود Prisma Client
ls node_modules/@prisma/client

# یا در Windows PowerShell
Test-Path node_modules\@prisma\client

# تست import در TypeScript
node -e "require('@prisma/client')"
```

## اگر مشکل ادامه داشت

### 1. پاک کردن کامل و نصب مجدد
```bash
# حذف node_modules
rm -rf node_modules
# یا در Windows
rmdir /s /q node_modules

# حذف .next
rm -rf .next
# یا در Windows
rmdir /s /q .next

# نصب مجدد
bun install

# تولید Prisma Client
bun run prisma generate

# راه‌اندازی دیتابیس
bun run db:push
```

### 2. بررسی نسخه Prisma
```bash
bun run prisma --version
```

نسخه باید 6.x باشد.

### 3. بررسی schema
```bash
bun run prisma validate
```

اگر خطایی نشان داد، schema را اصلاح کنید.

### 4. مشاهده خطاهای Prisma
```bash
bun run prisma generate --verbose
```

## دستورات پرکاربرد Prisma

```bash
# تولید Prisma Client
bun run prisma generate

# اعمال تغییرات schema به دیتابیس
bun run db:push
# یا
bun run prisma db push

# ایجاد migration
bun run prisma migrate dev --name migration_name

# مشاهده دیتابیس با GUI
bun run prisma studio

# اعتبارسنجی schema
bun run prisma validate

# فرمت کردن schema
bun run prisma format
```

## تست صحت کارکرد

```bash
# 1. اجرای پروژه
bun run dev

# 2. تست API
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'

# یا با اسکریپت تست
bun run scripts/test-api.ts
```

## خلاصه

**مشکل:** Prisma Client تولید نشده است
**راه‌حل:** `bun run prisma generate`
**وقتی اجرا شود:**
- بعد از نصب پروژه
- بعد از تغییر schema.prisma
- بعد از حذف node_modules

---

## Checklist راه‌اندازی

- [ ] `bun install` - نصب dependencies
- [ ] `bun run prisma generate` - **بسیار مهم!**
- [ ] `bun run db:push` - راه‌اندازی دیتابیس
- [ ] `bun run scripts/seed-database.ts` - داده‌های تستی
- [ ] `bun run dev` - اجرای پروژه

اگر همه این مراحل را انجام دهید، پروژه باید درست کار کند! 🚀
