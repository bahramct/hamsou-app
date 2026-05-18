# راهنمای نصب و راه‌اندازی همسو (Hamsou)

این راهنما شما را از صفر تا اجرای کامل پروژه راهنمایی می‌کند.

---

## پیش‌نیازها

- **Node.js** 18+
- **Bun** (بسته‌مدیر سریع‌تر از npm/yarn)
- **Git**

---

## روش 1: اسکریپت سریع (پیشنهادی)

### Windows
```bash
setup.bat
```

### Linux/Mac
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

این اسکریپت تمام مراحل زیر را خودکار انجام می‌دهد.

---

## روش 2: نصب دستی

### 1. کلون کردن پروژه

```bash
git clone <repository-url>
cd hamsu
```

### 2. نصب Dependencies

```bash
bun install
```

### 3. تنظیم Environment Variables

ایجاد فایل `.env` (اگر وجود ندارد):

```bash
cp .env.example .env
```

ویرایش `.env`:

```env
# Database - استفاده از SQLite محلی
DATABASE_URL="file:/home/z/my-project/db/hamsou.db"

# JWT Secret - فقط برای توسعه
JWT_SECRET="hamsou-dev-secret-key"

# Environment
NODE_ENV="development"

# AI Provider
AI_PROVIDER="zai"
```

**⚠️ نکته مهم:** در محیط production حتماً `JWT_SECRET` را تغییر دهید:

```bash
openssl rand -base64 32
```

**⚠️ نکته مهم در مورد DATABASE_URL:**
- در development از absolute path استفاده می‌شود: `file:/home/z/my-project/db/hamsou.db`
- در production می‌توانید از relative path استفاده کنید: `file:./db/hamsou.db`
- از path های اشتباه مثل `file:../db/hamsou.db` استفاده نکنید

### 4. تولید Prisma Client (بسیار مهم!)

```bash
bun run prisma generate
```

**چرا این مرحله مهم است؟**

Prisma Client باید بعد از هر تغییری در `prisma/schema.prisma` دوباره تولید شود. اگر این کار را انجام ندهید، با خطای زیر مواجه می‌شوید:

```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

### 5. راه‌اندازی دیتابیس

```bash
bun run db:push
```

### 6. اجرای پروژه

**روش پیشنهادی (با auto-restart):**
```bash
bash /home/z/my-project/start-dev-bg.sh
```

این اسکریپت:
- سرور را با تنظیمات زیر اجرا می‌کند: Port `3000`, Host `0.0.0.0`
- اگر سرور crash کرد، خودکار بعد از 3 ثانیه restart می‌کند
- خروجی را در `dev.log` و `startup.log` ذخیره می‌کند
- مستقل از session شما (حتی اگر ترمینال بسته شود، سرور می‌ماند)

**روش ساده (بدون auto-restart - فقط برای تست):**
```bash
bun run dev
```

این دستور سرور را با تنظیمات زیر اجرا می‌کند:
- Port: `3000`
- Host: `0.0.0.0` (قابل دسترس از همه شبکه‌ها)
- Log: خروجی در `dev.log` ذخیره می‌شود

پروژه در آدرس‌های زیر در دسترس خواهد بود:
- `http://localhost:3000`
- `http://0.0.0.0:3000`

---

## ساختار پروژه

```
hamsu/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── dev/          # Development-only endpoints
│   │   │   ├── ai/           # AI-related endpoints
│   │   │   └── ...
│   │   ├── demo/             # Main demo page
│   │   ├── analytics/        # Analytics dashboard
│   │   └── ...
│   ├── components/           # React components
│   │   ├── dev/             # Dev-only components
│   │   ├── ui/              # shadcn/ui components
│   │   └── ...
│   ├── lib/                 # Utility libraries
│   │   ├── ai/              # AI system
│   │   ├── db.ts            # Prisma client
│   │   └── ...
│   └── hooks/               # React hooks
├── prisma/
│   └── schema.prisma        # Database schema
├── db/                      # Database files (git-ignored)
├── docs/                    # Documentation
├── .env                     # Environment configuration (git-ignored)
├── .env.example             # Example environment variables
└── package.json
```

---

## دستورات پرکاربرد Prisma

```bash
# تولید Prisma Client
bun run prisma generate

# اعمال تغییرات schema به دیتابیس
bun run db:push

# ایجاد migration
bun run prisma migrate dev --name migration_name

# مشاهده دیتابیس با GUI
bun run prisma studio

# اعتبارسنجی schema
bun run prisma validate

# فرمت کردن schema
bun run prisma format
```

---

## چک‌لیست نصب

- [ ] `bun install` - نصب dependencies
- [ ] ایجاد و ویرایش `.env` - تنظیم environment variables
- [ ] `bun run prisma generate` - **بسیار مهم!**
- [ ] `bun run db:push` - راه‌اندازی دیتابیس
- [ ] `bash /home/z/my-project/start-dev-bg.sh` - اجرای پروژه با auto-restart
- [ ] باز کردن `http://localhost:3000` در مرورگر

---

## مشکلات رایج

### مشکل: "DATABASE_URL not found"

**راه‌حل:** مطمئن شوید فایل `.env` وجود دارد و `DATABASE_URL` در آن تنظیم شده است.

### مشکل: "Module not found: @/lib/db"

**راه‌حل:** اجرای `bun run prisma generate` برای تولید مجدد Prisma Client.

### مشکل: "Database is readonly"

**راه‌حل 1:** چک کردن path دیتابیس در `.env`:
```bash
cat .env | grep DATABASE_URL
# باید این باشد: DATABASE_URL="file:/home/z/my-project/db/hamsou.db"
```

**راه‌حل 2:** چک کردن دسترسی فایل دیتابیس:
```bash
chmod 666 db/hamsou.db
```

**راه‌حل 3:** ریستارت سرور:
```bash
pkill -9 -f "next dev"
pkill -9 -f "final-runner"
bash /home/z/my-project/start-dev-bg.sh
```

### مشکل: "Dev tools not working"

**راه‌حل:** مطمئن شوید `NODE_ENV="development"` در `.env` تنظیم شده و سرور را ریستارت کنید.

---

## راه‌اندازی محیط Production

برای استقرار در production:

1. ایجاد `.env.production` (یا اصلاح `.env`):
```env
# Database - Production database
DATABASE_URL="file:./db/hamsou-prod.db"

# JWT Secret - حتماً تغییر دهید!
JWT_SECRET="<generate-secure-random-string-here>"

# Environment
NODE_ENV="production"

# AI Provider
AI_PROVIDER="zai"
```

2. ساخت پروژه:
```bash
bun run build
```

3. اجرای سرور production:
```bash
bun run start
```

**نکته:** در production از `start-dev-bg.sh` استفاده نکنید. این اسکریپت فقط برای development است.

---

## منابع بیشتر

- [راهنمای توسعه](../01-development/01-development-guide.md)
- [راهنمای حل مشکلات](../05-troubleshooting/01-common-issues.md)
- [معماری سیستم](../03-architecture/01-system-architecture.md)
