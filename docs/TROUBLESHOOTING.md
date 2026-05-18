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
{"error": "Invalid token"}
```

### علت
1. Token منقضی شده (30 روز)
2. فرمت token اشتباه است
3. **JWT_SECRET تغییر کرده و token با secret قبلی ساخته شده**
4. token در localStorage به درستی ذخیره نشده است

### راه‌حل

**روش 1: پاک کردن و login دوباره (پیشنهادی)**
```javascript
// در console مرورگر
localStorage.clear()
// سپس صفحه رو رفرش کن و دوباره login کن
```

**روش 2: چک کردن JWT_SECRET**
```bash
# چک کردن .env
cat .env | grep JWT_SECRET
# باید: JWT_SECRET="hamsou-dev-secret-key" باشه

# چک کردن src/lib/auth.ts
grep JWT_SECRET src/lib/auth.ts
# باید: const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key'; باشه

# اگر فرق داشتن:
# 1. .env رو اصلاح کن
# 2. سرور رو ریستارت کن
killall node
bash .zscripts/dev.sh
# 3. کاربر باید localStorage.clear() کنه و دوباره login کنه
```

**روش 3: چک کردن token در localStorage**
```javascript
// در console مرورگر
localStorage.getItem('token')
// اگر null بود یا فرمتش اشتباه بود، باید دوباره login کنی
```

### پیشگیری
- هر وقت JWT_SECRET رو عوض کردی، سرور رو ریستارت کن
- بعد از عوض کردن JWT_SECRET، کاربر باید دوباره login کنه
- JWT_SECRET در development باید با default در `src/lib/auth.ts` هماهنگ باشه

---

## مشکل شماره 6.1: همه APIها خطای "invalid signature" می‌دن

### علائم
```
Token verification error: Error [JsonWebTokenError]: invalid signature
401 Unauthorized on ALL API calls
```

### علت
**JWT_SECRET mismatch** - مقدار JWT_SECRET در `.env` با مقدار default در `src/lib/auth.ts` فرق داره.

### تشخیص
```bash
# چک کردن .env
cat .env | grep JWT_SECRET
# خروجی مثال: JWT_SECRET="hamsou-dev-secret-key-change-in-production"

# چک کردن src/lib/auth.ts
grep JWT_SECRET src/lib/auth.ts
# خروجی: const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key';

# اگر فرق داشتن، این مشکل هست!
```

### راه‌حل
```bash
# 1. اصلاح .env و .env.local
# این خط رو تغییر بده:
JWT_SECRET="hamsou-dev-secret-key-change-in-production"
# به این:
JWT_SECRET="hamsou-dev-secret-key"

# 2. هر دو فایل رو اصلاح کن
nano .env
nano .env.local

# 3. ریستارت سرور
pkill -9 -f "next dev"
bash .zscripts/dev.sh

# 4. کاربر باید localStorage رو پاک کنه و دوباره login کنه
# در console مرورگر:
localStorage.clear()
# سپس رفرش کن و login دوباره
```

### پیشگیری
- هر وقت JWT_SECRET رو در `.env` تغییر میدی، باید با `src/lib/auth.ts` چک کنی
- مقدار development: `hamsou-dev-secret-key`
- مقدار production: باید متفاوت باشه و امن

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
```
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

## مشکل شماره 11: API routes خطای undefined property می‌دن

### علائم
```
TypeError: Cannot read properties of undefined (reading 'id')
TypeError: Cannot read properties of undefined (reading 'userId')
Cannot read property 'userId' of undefined
```

### علت
استفاده از `user.id` به جای `user.userId` در API routes. تابع `verifyToken` از `@/lib/auth` `{ userId, phone }` برمی‌گردونه، نه `{ id, phone }`.

### تشخیص
```bash
# جستجو در فایل‌های API route
grep -r "user\.id" src/app/api --include="*.ts"
# اگر نتیجه‌ای پیدا شد، احتمالا مشکل همینجاست
```

### راه‌حل
```typescript
// ❌ غلط
import { verifyToken } from '@/lib/auth';

const user = await verifyToken(request);
const data = await db.model.findMany({
  where: { userId: user.id }  // user.id undefined هست!
});

// ✅ درست
import { verifyToken } from '@/lib/auth';

const user = await verifyToken(request);
const data = await db.model.findMany({
  where: { userId: user.userId }  // user.userId درست است
});
```

### فایل‌هایی که باید چک بشن
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/notifications/mark-read/route.ts`
- `src/app/api/plans/route.ts`
- `src/app/api/plans/[id]/route.ts`
- `src/app/api/plans/[id]/progress/route.ts`
- `src/app/api/ai/service-test/route.ts`
- و هر فایل دیگه‌ای که از `verifyToken` استفاده می‌کنه

### قانون طلایی
> تابع `verifyToken` از `@/lib/auth` همیشه `{ userId, phone }` برمی‌گردونه. همیشه از `user.userId` استفاده کن، نه `user.id`.

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

6. **بعد از تغییر JWT_SECRET:**
   ```bash
   # 1. سرور رو ریستارت کن
   pkill -9 -f "next dev"
   bash .zscripts/dev.sh

   # 2. کاربر باید localStorage رو پاک کنه
   # در console مرورگر:
   localStorage.clear()
   # سپس دوباره login کنه
   ```

7. **چک کردن هماهنگی JWT_SECRET:**
   ```bash
   # چک کردن .env
   cat .env | grep JWT_SECRET

   # چک کردن src/lib/auth.ts
   grep JWT_SECRET src/lib/auth.ts

   # باید هر دو یکسان باشن (در development)
   ```

8. **برای ایجاد API route جدید با احراز هویت:**
   ```typescript
   import { verifyToken } from '@/lib/auth';

   export async function GET(request: NextRequest) {
     const user = await verifyToken(request);
     if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     // استفاده درست: user.userId نه user.id
     const data = await db.model.findMany({
       where: { userId: user.userId }
     });

     return NextResponse.json(data);
   }
   ```

9. **قانون طلایی برای API routes با احراز هویت:**
   > همیشه از `user.userId` استفاده کن، نه `user.id`. تابع `verifyToken` از `@/lib/auth` همیشه `{ userId, phone }` برمی‌گردونه.

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
