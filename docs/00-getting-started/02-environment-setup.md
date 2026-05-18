# تنظیم محیط توسعه همسو (Environment Setup)

در این فایل نحوه تنظیم کامل محیط توسعه و production را یاد می‌گیرید.

---

## فایل‌های Environment

پروژه همسو از 3 فایل environment استفاده می‌کند:

1. **`.env.example`** - الگوی template (ثابت در git)
2. **`.env`** - Environment عمومی (ثابت در git برای تنظیمات پایه)
3. **`.env.local`** - Environment محلی (git-ignored برای تنظیمات شخصی)

---

## فایل .env.example

این فایل به عنوان الگو برای توسعه‌دهندگان جدید استفاده می‌شود:

```env
# Database
DATABASE_URL="file:db/hamsou.db?connection_limit=1"

# JWT Secret
JWT_SECRET="change-this-in-production"

# Environment
NODE_ENV="development"

# AI Provider
AI_PROVIDER="zai"
```

---

## فایل .env (Development Base)

تنظیمات پایه برای محیط توسعه:

```bash
# ============================================================
# Development Environment Configuration
# This file is gitignored - DO NOT commit to version control
# ============================================================

# Database - Development SQLite
DATABASE_URL="file:db/hamsou.db?connection_limit=1"

# JWT Secret - Development Only
JWT_SECRET="hamsou-dev-secret-key"

# Environment
NODE_ENV="development"

# AI Provider - Development
AI_PROVIDER="zai"
```

---

## فایل .env.local (Local Overrides)

این فایل برای override کردن تنظیمات محلی استفاده می‌شود:

```bash
# ============================================================
# Local Environment Configuration
# This file is gitignored - DO NOT commit to version control
# ============================================================

# Database - Local Override (اختیاری)
# DATABASE_URL="file:db/hamsou-local.db?connection_limit=1"

# JWT Secret - Local Override (اختیاری)
# JWT_SECRET="hamsou-local-secret-key"

# Environment
NODE_ENV="development"

# AI Provider - Development
AI_PROVIDER="zai"
```

---

## فایل .env.production (Production)

این فایل فقط برای محیط production استفاده می‌شود:

```bash
# ============================================================
# Production Environment Configuration
# DO NOT commit JWT_SECRET to version control!
# ============================================================

# Database - Production SQLite
DATABASE_URL="file:db/hamsou-prod.db?connection_limit=1"

# JWT Secret - Production (بسیار مهم: تغییر دهید!)
JWT_SECRET="<generate-secure-random-string>"

# Environment
NODE_ENV="production"

# AI Provider - Production
AI_PROVIDER="zai"
```

**تولید JWT Secret امن:**

```bash
openssl rand -base64 32
```

---

## Database Configuration

### Development Database

```env
DATABASE_URL="file:db/hamsou.db?connection_limit=1"
```

- **نوع:** SQLite
- **مسیر:** نسبی به ریشه پروژه
- **Connection Limit:** 1 (برای SQLite کافی است)

### Production Database

گزینه 1: SQLite (ساده):
```env
DATABASE_URL="file:db/hamsou-prod.db?connection_limit=1"
```

گزینه 2: PostgreSQL (پیشنهادی برای production):
```env
DATABASE_URL="postgresql://user:password@host:5432/hamsou"
```

گزینه 3: MySQL:
```env
DATABASE_URL="mysql://user:password@host:3306/hamsou"
```

---

## JWT_SECRET

### Development

```env
JWT_SECRET="hamsou-dev-secret-key"
```

### Production

```env
JWT_SECRET="<random-64-character-string>"
```

**تولید:**
```bash
openssl rand -base64 32
# یا
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## NODE_ENV

```env
NODE_ENV="development"  # برای توسعه
NODE_ENV="production"   # برای استقرار
```

تأثیر NODE_ENV:

| Feature | Development | Production |
|---------|-------------|------------|
| DevToolsPanel | ✅ فعال | ❌ غیرفعال |
| Dev API Routes | ✅ فعال | ❌ غیرفعال |
| Error Logs | ✅ detailed | ⚠️ minimal |
| Performance | ❌ slower | ✅ optimized |

---

## AI_PROVIDER

```env
AI_PROVIDER="zai"        # Z.ai SDK (پیشنهادی)
# AI_PROVIDER="openai"   # OpenAI (توسعه‌یافته)
# AI_PROVIDER="anthropic" # Anthropic (توسعه‌یافته)
```

---

## اولویت بارگذاری فایل‌ها

Next.js فایل‌های env را به این ترتیب بارگذاری می‌کند:

1. `.env.local` (اولویت اول - override همه)
2. `.env.development` یا `.env.production` (بر اساس NODE_ENV)
3. `.env` (پایه)

---

## تست تنظیمات

### بررسی متغیرهای محیطی

```bash
# در پروژه Next.js، می‌توانید از این دستور استفاده کنید:
bun run dev

# و در کد:
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
```

### تست اتصال دیتابیس

```bash
bun run prisma studio
```

### تست API

```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'
```

---

## مشکلات رایج

### مشکل: Environment variables بارگذاری نمی‌شوند

**راه‌حل:**
1. مطمئن شوید نام فایل‌ها درست است (بدون فاصله)
2. سرور را ریستارت کنید: `bun run dev`
3. چک کنید فایل `.gitignore` شامل `.env.local` باشد

### مشکل: JWT_SECRET خطا می‌دهد

**راه‌حل:**
- در production حتماً JWT_SECRET را تغییر دهید
- در توسعه مطمئن شوید همه فایل‌های env یکسان هستند

### مشکل: DATABASE_URL خطا می‌دهد

**راه‌حل:**
- چک کنید پوشه `db/` وجود دارد
- مطمئن شوید دسترسی نوشتن دارید: `chmod 755 db/`

---

## چک‌لیست Environment

- [ ] `.env.example` وجود دارد
- [ ] `.env` با تنظیمات پایه ایجاد شده
- [ ] `.env.local` برای توسعه شخصی ایجاد شده
- [ ] `.env.production` با JWT_SECRET امن آماده است
- [ ] `.gitignore` شامل `.env.local` و `.env.production` است
- [ ] سرور ریستارت شده تا تنظیمات اعمال شوند

---

## منابع بیشتر

- [راهنمای نصب](./01-installation.md)
- [راهنمای توسعه](../01-development/01-development-guide.md)
- [Development vs Production Separation](../05-troubleshooting/01-common-issues.md#development-vs-production-separation)
