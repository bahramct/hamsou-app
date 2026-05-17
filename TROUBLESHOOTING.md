# راهنمای حل مشکلات - همسو (Hamsou)

## مشکل شماره 1: ارور 500 در API و Prisma Client not initialized

### علائم
```
POST /api/auth/send-otp 500
@prisma/client did not initialize yet. Please run "prisma generate"
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### علت
Prisma Client هنوز generate نشده است.

### راه‌حل
```bash
# روش 1: اجرای دستی
bun run prisma generate

# روش 2: ریستارت سرور
pkill -f "bun run dev"
bun run dev
```

### راه‌حل دائمی (پیشنهادی)
با اضافه کردن `postinstall` به package.json، Prisma Client به صورت خودکار بعد از `bun install` generate می‌شود.

---

## مشکل شماره 2: Cannot find module '@/lib/db'

### علائم
```
Error: Cannot find module '@/lib/db'
Module not found: Can't resolve '@/lib/db'
```

### علت
Prisma Client یا node_modules نصب نشده است.

### راه‌حل
```bash
# نصب وابستگی‌ها
bun install

# Generate Prisma Client
bun run prisma generate
```

---

## مشکل شماره 3: Database file not found

### علائم
```
Error: Database file not found
Unable to open database file
```

### علت
پوشه db وجود ندارد یا دیتابیس ایجاد نشده است.

### راه‌حل
```bash
# ایجاد پوشه db
mkdir -p db

# ایجاد دیتابیس
bun run db:push
```

---

## مشکل شماره 4: فرمت صفحه خراب شده (HTML به جای JSON)

### علائم
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### علت
API به صفحه error (HTML) برمی‌گردد به جای JSON.

### راه‌حل
1. **چک کنید Prisma generate شده است:**
   ```bash
   bun run prisma generate
   ```

2. **لاگ سرور را چک کنید:**
   ```bash
   tail -f dev.log
   ```

3. **سرور را ریستارت کنید:**
   ```bash
   pkill -f "bun run dev"
   bun run dev
   ```

---

## مشکل شماره 5: CORS یا Network Error

### علائم
```
Failed to fetch
TypeError: Failed to fetch
CORS policy error
```

### علت
مشکل در ارتباط بین client و server.

### راه‌حل
1. **چک کنید سرور در حال اجرا است:**
   ```bash
   ps aux | grep "bun run dev"
   ```

2. **با curl تست کنید:**
   ```bash
   curl -4 http://localhost:3000/api/auth/send-otp \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"phone":"09123456789"}'
   ```

3. **از IPv4 استفاده کنید** (در curl: `curl -4`)

---

## مشکل شماره 6: Token نامعتبر یا منقضی شده

### علائم
```
{"error": "توکن نامعتبر است"}
401 Unauthorized
```

### علت
Token منقضی شده یا فرمت آن اشتباه است.

### راه‌حل
1. **از localStorage پاک کنید:**
   ```javascript
   // در console مرورگر
   localStorage.clear()
   ```

2. **دوباره login کنید**
3. **چک کنید token در درست ذخیره شده است:**
   ```javascript
   localStorage.getItem('token')
   ```

---

## مشکل شماره 7: Middleware Error

### علائم
```
Error: Cannot find the middleware module
⚠ The "middleware" file convention is deprecated
```

### علت
فایل middleware با فرمت قدیمی Next.js وجود دارد.

### راه‌حل
```bash
# حذف فایل middleware (در این پروژه نیازی به آن نیست)
rm src/middleware.ts
```

---

## مشکل شماره 8: TypeScript Errors

### علائم
```
Type error: Cannot find name '...'
Property '...' does not exist
```

### علت
Typescript compilation error یا @types نصب نشده.

### راه‌حل
```bash
# نصب types
bun install

# Generate Prisma Client (برای types)
bun run prisma generate

# چک کردن کد
bun run lint
```

---

## مشکل شماره 9: Port 3000 در حال استفاده است

### علائم
```
Error: listen EADDRINUSE: address already in use :::3000
```

### علت
پورت 3000 توسط پروسه دیگری استفاده می‌شود.

### راه‌حل
```bash
# پیدا کردن پروسه
lsof -i :3000
# یا
netstat -tlnp | grep :3000

# کشتن پروسه
kill -9 <PID>

# یا با پورت دیگری شروع کنید
PORT=3001 bun run dev
```

---

## مشکل شماره 10: داده‌های تستی وجود ندارد

### علائم
``
گزارشی یافت نشد
No commitments found
```

### علت
داده‌های تستی در دیتابیس ایجاد نشده است.

### راه‌حل
```bash
# ایجاد داده‌های تستی
bun run scripts/seed-database.ts

# بررسی داده‌ها
bun run scripts/check-data.ts
```

---

## راهنمای دیباگ کردن

### 1. چک کردن لاگ سرور
```bash
tail -f dev.log
```

### 2. تست API با curl
```bash
# تست ارسال OTP
curl -4 -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789"}'

# تست تأیید OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","code":"1234"}'
```

### 3. اجرای تست کامل
```bash
bun run scripts/test-api.ts
```

### 4. مشاهده دیتابیس با Prisma Studio
```bash
bun run prisma studio
```

### 5. چک کردن Console مرورگر
- F12 یا Ctrl+Shift+I
- تب Console
- Network tab برای مشاهده requestها

---

## دستورات ضروری

```bash
# نصب وابستگی‌ها (با Prisma generate خودکار)
bun install

# تولید Prisma Client
bun run prisma generate

# ایجاد/به‌روزرسانی دیتابیس
bun run db:push

# ایجاد داده‌های تستی
bun run scripts/seed-database.ts

# بررسی داده‌ها
bun run scripts/check-data.ts

# تست APIها
bun run scripts/test-api.ts

# شروع سرور
bun run dev

# مشاهده دیتابیس
bun run prisma studio

# چک کردن کد
bun run lint
```

---

## نکات مهم

1. **بعد از هر تغییر در schema.prisma:**
   ```bash
   bun run prisma generate
   bun run db:push
   ```

2. **بعد از کلون کردن پروژه:**
   ```bash
   bun install          # این postinstall را اجرا می‌کند
   bun run db:push
   bun run scripts/seed-database.ts
   ```

3. **قبل از commit کردن:**
   ```bash
   bun run lint
   bun run scripts/test-api.ts
   ```

4. **همیشه از IPv4 در curl استفاده کنید:**
   ```bash
   curl -4 ...
   ```

5. **برای مشاهده لاگ‌های واقعی:**
   ```bash
   tail -f dev.log
   ```

---

## تماس با پشتیبانی

اگر هیچ‌کدام از راه‌حل‌ها کار نکرد:

1. لاگ کامل را ذخیره کنید:
   ```bash
   cat dev.log > error-log.txt
   ```

2. اطلاعات سیستم را جمع‌آوری کنید:
   ```bash
   bun --version
   node --version
   ```

3. اطلاعات خطا و مراحل تکرار آن را بنویسید.
