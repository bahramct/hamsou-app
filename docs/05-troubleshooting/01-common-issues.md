# راهنمای حل مشکلات رایج (Common Issues)

این راهنما مشکلات رایج پروژه همسو و راه‌حل‌های آن‌ها را پوشش می‌دهد.

---

## 1. مشکلات Prisma Client

### 1.1 Prisma Client Not Initialized

**علائم:**
```
@prisma/client did not initialize yet. Please run "prisma generate"
Error: Cannot find module '@/lib/db'
```

**علت:** Prisma Client هنوز generate نشده است.

**راه‌حل:**
```bash
bun run prisma generate
```

**راه‌حل دائمی:** با `postinstall` در package.json، Prisma Client به صورت خودکار بعد از `bun install` generate می‌شود.

---

### 1.2 Module Not Found: @/lib/db

**علائم:**
```
Error: Cannot find module '@/lib/db'
Module not found: Can't resolve '@/lib/db'
```

**راه‌حل:**
```bash
bun install
bun run prisma generate
```

---

### 1.3 Database File Not Found

**علائم:**
```
Error: Database file not found
Unable to open database file
```

**راه‌حل:**
```bash
mkdir -p db
bun run db:push
```

---

### 1.4 Readonly Database

**علائم:**
```
Error: attempt to write a readonly database
```

**دلایل احتمالی:**
1. `DATABASE_URL` path اشتباه داره (`../db/` یا `db/` به جای absolute path)
2. Prisma schema path سخت‌کد شده
3. فایل دیتابیس permission اشتباه داره

**راه‌حل:**
```bash
# 1. چک کردن .env
cat .env | grep DATABASE_URL
# باید: DATABASE_URL="file:/home/z/my-project/db/hamsou.db"

# 2. چک کردن prisma/schema.prisma
# باید اینطوری باشه:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

# 3. ریستارت سرور
pkill -9 -f "next dev"
pkill -9 -f "final-runner"
bash /home/z/my-project/start-dev-bg.sh
```

---

## 2. مشکلات API

### 2.1 500 Internal Server Error

**علائم:**
```
POST /api/auth/send-otp 500
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**علت:** API به صفحه error (HTML) برمی‌گردد به جای JSON.

**راه‌حل:**
```bash
# 1. چک کردن Prisma
bun run prisma generate

# 2. چک کردن لاگ سرور
tail -f dev.log

# 3. ریستارت سرور
pkill -9 -f "next dev"
pkill -9 -f "final-runner"
bash /home/z/my-project/start-dev-bg.sh
```

---

### 2.2 CORS یا Network Error

**علائم:**
```
Failed to fetch
TypeError: Failed to fetch
CORS policy error
```

**راه‌حل:**
```bash
# 1. چک کردن سرور
ps aux | grep "next dev"

# 2. چک کردن daemon
ps aux | grep "final-runner"

# 3. تست با curl
curl -4 http://localhost:3000/api/auth/send-otp \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'
```

---

### 2.3 API Routes خطای Undefined Property

**علائم:**
```
TypeError: Cannot read properties of undefined (reading 'id')
TypeError: Cannot read properties of undefined (reading 'userId')
```

**علت:** استفاده از `user.id` به جای `user.userId`.

**قانون طلایی:**
> تابع `verifyToken` از `@/lib/auth` همیشه `{ userId, phone }` برمی‌گردونه. همیشه از `user.userId` استفاده کن، نه `user.id`.

**راه‌حل:**
```typescript
// ❌ غلط
const user = await verifyToken(request);
const data = await db.model.findMany({
  where: { userId: user.id }  // user.id undefined هست!
});

// ✅ درست
const user = await verifyToken(request);
const data = await db.model.findMany({
  where: { userId: user.userId }
});
```

---

## 3. مشکلات Authentication

### 3.1 Token نامعتبر یا منقضی شده

**علائم:**
```
{"error": "توکن نامعتبر است"}
401 Unauthorized
{"error": "Invalid token"}
```

**دلایل:**
1. Token منقضی شده (30 روز)
2. JWT_SECRET تغییر کرده و token با secret قبلی ساخته شده
3. Token در localStorage به درستی ذخیره نشده است

**راه‌حل:**
```javascript
// در console مرورگر
localStorage.clear()
// سپس رفرش کن و دوباره login کن
```

---

### 3.2 همه APIها خطای "invalid signature"

**علائم:**
```
Token verification error: Error [JsonWebTokenError]: invalid signature
401 Unauthorized on ALL API calls
```

**علت:** JWT_SECRET mismatch بین `.env` و `src/lib/auth.ts`.

**تشخیص:**
```bash
# چک کردن .env
cat .env | grep JWT_SECRET
# باید: JWT_SECRET="hamsou-dev-secret-key"

# چک کردن src/lib/auth.ts
grep JWT_SECRET src/lib/auth.ts
# باید: const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';
```

**راه‌حل:**
```bash
# 1. اصلاح .env
JWT_SECRET="hamsou-dev-secret-key"

# 2. ریستارت سرور
pkill -9 -f "next dev"
pkill -9 -f "final-runner"
bash /home/z/my-project/start-dev-bg.sh

# 3. کاربر localStorage.clear() کنه و دوباره login کنه
```

---

## 4. Development vs Production Separation

### 4.1 DevToolsPanel در Production نمایش داده می‌شود

**علت:** `process.env.NODE_ENV` درست تنظیم نشده است.

**راه‌حل:**
```bash
# در .env.production
NODE_ENV="production"

# و در کد:
if (process.env.NODE_ENV === 'production') {
  return null;
}
```

**چک‌لیست حفاظتی:**
- [ ] DevToolsPanel با `process.env.NODE_ENV === 'production'` کنترل می‌شود
- [ ] همه Dev API routes با `process.env.NODE_ENV !== 'development'` کنترل می‌شوند
- [ ] `DISABLE_DEV_TOOLS` برای disable سریع وجود دارد

---

### 4.2 Environment Variables بارگذاری نمی‌شوند

**راه‌حل:**
```bash
# 1. چک کردن نام فایل‌ها (بدون فاصله)
ls -la .env*

# 2. ریستارت سرور
pkill -9 -f "next dev"
pkill -9 -f "final-runner"
bash /home/z/my-project/start-dev-bg.sh
```

---

## 5. مشکلات پلتفرم

### 5.1 Windows: Prisma Client Error

**علائم:**
```
Error: @prisma/client did not initialize yet
```

**راه‌حل:**
```powershell
# 1. حذف node_modules و .next
rmdir /s /q node_modules
rmdir /s /q .next

# 2. نصب مجدد
bun install
bun run prisma generate
bun run db:push
```

---

### 5.2 Port 3000 در حال استفاده است

**علائم:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**راه‌حل:**
```bash
# پیدا کردن پروسه
lsof -i :3000
# یا
netstat -tlnp | grep :3000

# کشتن پروسه
kill -9 <PID>

# یا با پورت دیگری
PORT=3001 ./node_modules/.bin/next dev -p 3001 -H 0.0.0.0
```

---

## 6. راهنمای دیباگ کردن

### 6.1 چک کردن لاگ سرور
```bash
tail -f dev.log
```

### 6.2 چک کردن لاگ‌های daemon
```bash
tail -f startup.log
tail -f /tmp/hamsu-daemon.log
```

### 6.3 تست API با curl
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'
```

### 6.4 مشاهده دیتابیس
```bash
bun run prisma studio
```

### 6.5 چک کردن Console مرورگر
- F12 یا Ctrl+Shift+I
- تب Console برای errorها
- تب Network برای requestها

---

## 7. دستورات ضروری

```bash
# نصب وابستگی‌ها
bun install

# تولید Prisma Client
bun run prisma generate

# ایجاد/به‌روزرسانی دیتابیس
bun run db:push

# مشاهده دیتابیس
bun run prisma studio

# چک کردن کد
bun run lint

# شروع سرور (با auto-restart - پیشنهادی)
bash /home/z/my-project/start-dev-bg.sh

# یا شروع سرور (بدون auto-restart - فقط برای تست)
bun run dev
```

---

## 8. چک‌لیست قبل از گزارش مشکل

- [ ] `bun install` اجرا شده
- [ ] `bun run prisma generate` اجرا شده
- [ ] `bun run db:push` اجرا شده
- [ ] سرور با `bash /home/z/my-project/start-dev-bg.sh` اجرا شده
- [ ] daemon در حال اجراست (`ps aux | grep "final-runner"`)
- [ ] `tail -f dev.log` چک شده
- [ ] `tail -f startup.log` چک شده
- [ ] Console مرورگر چک شده
- [ ] Network tab مرورگر چک شده
- [ ] JWT_SECRET هماهنگ است

---

## منابع بیشتر

- [راهنمای توسعه](../01-development/01-development-guide.md)
- [راهنمای نصب](../00-getting-started/01-installation.md)
