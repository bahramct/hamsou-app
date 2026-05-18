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
JWT_SECRET="hamsou-dev-secret-key"
AI_PROVIDER="zai"
DATABASE_URL="file:db/hamsou.db?connection_limit=1"
```

**⚠️ نکته مهم در مورد JWT_SECRET:**
- مقدار `JWT_SECRET` در `.env` حتماً باید با مقدار default در `src/lib/auth.ts` یکسان باشد
- در حال حاضر مقدار درست: `hamsou-dev-secret-key`
- اگر `JWT_SECRET` رو عوض کنی، همه توکن‌های قبلی invalid میشن و کاربر باید دوباره login کنه
- تغییر JWT_SECRET بدون توجه به این موضوع می‌تونه باعث بشه همه APIها خطای "invalid signature" بدن

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

**هشدار مهم:**
سرور به دلیل یک bug در Next.js 16.1.3 + React 19.2.3 (`TypeError: t.unmask is not a function`) گاهی crash می‌کند. باید از اسکریپت auto-restart استفاده کنید.

**روش پیشنهادی (با auto-restart):**
```bash
cd /home/z/my-project
bash start-dev.sh
```

این اسکریپت:
- سرور را با تنظیمات زیر اجرا می‌کند: Port `3000`, Host `0.0.0.0`
- اگر سرور crash کرد، خودکار ریسارتار می‌کند
- خروجی را در `dev.log` ذخیره می‌کند

**برای اجرا در background:**
```bash
# روش 1: با screen (پیشنهادی)
screen -S hamsou-dev
cd /home/z/my-project
bash start-dev.sh
# خروج از screen بدون توقف: Ctrl+A, D
# برگشت به screen: screen -r hamsou-dev

# روش 2: با tmux
tmux new -s hamsou-dev
cd /home/z/my-project
bash start-dev.sh
# خروج: Ctrl+B, D
# برگشت: tmux attach -t hamsou-dev

# روش 3: با nohup
nohup bash start-dev.sh > /dev/null 2>&1 &
# برای توقف: pkill -f "start-dev"
```

**خروجی نمونه:**
```
▲ Next.js 16.1.3 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://0.0.0.0:3000
- Environments: .env.local, .env

✓ Starting...
✓ Ready in ~1000ms
```

**برای بررسی وضعیت:**
```bash
# چک کردن آیا سرور در حال اجراست
ps aux | grep "next-server" | grep -v grep

# مشاهده لاگ‌ها
tail -f dev.log

# تست سرور
curl -s http://localhost:3000/ > /dev/null && echo "✅ Server OK"
```

**برای توقف سرور:**
```bash
pkill -f "next dev"
pkill -f "start-dev"
# یا
lsof -ti:3000 | xargs kill -9
```

**روش‌های غلط:**
```bash
# ❌ این روش‌ها مشکلاتی در ایجاد می‌کنن
nohup bun run dev &
bun run dev 2>&1 &
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

### ۵. احراز هویت و Token Handling

**ساختار Authentication:**

1. **verifyToken function در src/lib/auth.ts:**
   - ورودی: `NextRequest` (برای API routes)
   - خروجی: `{ userId, phone }` (توجه: `userId` نه `id`!)
   ```typescript
   export async function verifyToken(request: NextRequest): Promise<{ userId: string; phone: string } | null>
   ```

2. **verifyTokenString function:**
   - ورودی: `string` (برای verify کردن توکن مستقیم)
   - خروجی: `{ userId, phone }` یا `null`
   ```typescript
   export function verifyTokenString(token: string): { userId: string; phone: string } | null
   ```

3. **کاربرد در API routes:**
   ```typescript
   // ✅ درست
   const user = await verifyToken(request);
   if (!user) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }

   // استفاده در database queries
   const data = await db.model.findMany({
     where: { userId: user.userId }  // ✅ درست
   });

   // ❌ غلط
   const data = await db.model.findMany({
     where: { userId: user.id }  // ❌ اشتباه - user.id وجود نداره
   });
   ```

**قانون طلایی:**
> همیشه از `user.userId` استفاده کن، نه `user.id`. تابع `verifyToken` `{ userId, phone }` برمی‌گردونه.

**نکات مهم:**
- اگر `JWT_SECRET` رو عوض کردی، کاربر باید دوباره login کنه
- توکن‌ها با انقضای 30 روز ساخته میشن
- توکن در localStorage با کلید `'token'` ذخیره میشه

---

## چک‌لیست قبل از commit

قبل از اینکه فیچر جدیدی رو commit کنی، این چک‌لیست رو اجرا کن:

### 1. چک کردن Environment Variables
- [ ] `DATABASE_URL` path درست هست (`db/hamsou.db` نه `../db/hamsou.db`)
- [ ] `NODE_ENV` روی `development` در dev و `production` در production
- [ ] `JWT_SECRET` در development با `src/lib/auth.ts` هماهنگ است (حالا: `hamsou-dev-secret-key`)
- [ ] `JWT_SECRET` در development فرق می‌کنه با production

### 2. چک کردن Authentication
- [ ] API routes از `user.userId` استفاده می‌کنن (نه `user.id`)
- [ ] تابع درست از `@/lib/auth` import شده (`verifyToken` یا `verifyTokenString`)
- [ ] اگر JWT_SECRET تغییر کرده، کاربر مطلع شده باید دوباره login کنه

### 3. چک کردن Prisma
- [ ] schema از `env("DATABASE_URL")` استفاده می‌کنه
- [ ] بعد از تغییر schema: `bun run db:generate` و `bun run db:push` اجرا شده

### 4. چک کردن کامپوننت‌های Dev-Only
- [ ] همه چیزهایی که فقط برای development هستن با `process.env.NODE_ENV` کنترل میشن
- [ ] DevToolsPanel دو لایه حفاظتی داره (داخل کامپوننت و در صفحه)

### 5. تست سرور
- [ ] سرور با `bun run dev` اجرا شده
- [ ] سرور پایدار می‌مونه و خاموش نمیشه
- [ ] API routes درست کار می‌کنن
- [ ] DevToolsPanel در development هست و در production نیست

### 6. تست فیچر
- [ ] فیچر جدید کار می‌کنه
- [ ] فیچرهای قبلی هنوز کار می‌کنن
- [ ] هیچ خطایی در console نیست
- [ ] API routes احراز هویت درست دارن و خطای 401 نمی‌دن

### 7. دیتابیس
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
استفاده از روش‌های غلط مثل `nohup bun run dev &` بدون درست pipe کردن خروجی.

**راه حل:**
```bash
# ✅ استفاده از دستور صحیح
bun run dev
```

این دستور:
- سرور را با `0.0.0.0:3000` اجرا می‌کند
- خروجی را هم در terminal و هم در `dev.log` ذخیره می‌کند
- سرور را پایدار نگه می‌دارد

**برای بررسی وضعیت سرور:**
```bash
# چک کردن آیا سرور در حال اجراست
ps aux | grep "next-server" | grep -v grep

# مشاهده لاگ‌ها
tail -f dev.log

# توقف سرور
pkill -f "next dev"
```

### مشکل: فیچر قبلی خراب شده

**چک‌ها:**
1. آیا `.env` تغییر کرده؟
2. آیا `prisma/schema.prisma` تغییر کرده؟
3. آیا دیتابیس sync شده؟
4. آیا `JWT_SECRET` تغییر کرده؟
5. آیا API routes از `user.userId` استفاده می‌کنن (نه `user.id`)؟

**راه حل:**
```bash
# 1. ریستارت سرور
killall node
bash .zscripts/dev.sh

# 2. Sync دیتابیس
bun run db:push

# 3. اگر JWT_SECRET تغییر کرده، کاربر باید دوباره login کنه
# در console مرورگر: localStorage.clear() و سپس login دوباره

# 4. تست کردن DevToolsPanel
# (اگر این کار کنه، مشکل از دیتابیس حل شده)
```

### مشکل: همه APIها خطای "invalid signature" یا 401 می‌دن

**دلایل احتمالی:**
1. `JWT_SECRET` توی `.env` با `src/lib/auth.ts` هماهنگ نیست
2. توکن قدیمی با `JWT_SECRET` قبلی ساخته شده
3. توکن منقضی شده (30 روز)

**راه حل:**
```bash
# 1. چک کردن JWT_SECRET
cat .env | grep JWT_SECRET
# باید: JWT_SECRET="hamsou-dev-secret-key" باشه

# 2. چک کردن src/lib/auth.ts
grep JWT_SECRET src/lib/auth.ts
# باید: const JWT_SECRET = process.env.JWT_SECRET || 'hamsou-dev-secret-key'; باشه

# 3. اگر فرق داشتن، .env رو اصلاح کن و سرور رو ریستارت کن
killall node
bash .zscripts/dev.sh

# 4. کاربر باید localStorage رو پاک کنه و دوباره login کنه
# در console مرورگر:
localStorage.clear()
# سپس صفحه رو رفرش کن و login دوباره
```

### مشکل: API routes خطای Cannot read properties of undefined (reading 'userId') می‌دن

**دلیل:**
استفاده از `user.id` به جای `user.userId` در API routes.

**راه حل:**
```typescript
// ❌ غلط
const user = await verifyToken(request);
const data = await db.model.findMany({
  where: { userId: user.id }  // user.id undefined هست
});

// ✅ درست
const user = await verifyToken(request);
const data = await db.model.findMany({
  where: { userId: user.userId }  // user.userId درسته
});
```

**قانون:**
> تابع `verifyToken` از `@/lib/auth` همیشه `{ userId, phone }` برمی‌گردونه، نه `{ id, phone }`.

---

## خلاصه

### نکات کلیدی برای جلوگیری از خراب شدن فیچرها:

1. **Environment Variables:**
   - همیشه path دیتابیس رو چک کن (`db/` نه `../db/`)
   - NODE_ENV رو درست تنظیم کن
   - JWT_SECRET در development باید با `src/lib/auth.ts` هماهنگ باشه

2. **Authentication:**
   - همیشه از `user.userId` استفاده کن (نه `user.id`)
   - تابع درست رو import کن: `verifyToken` برای API routes، `verifyTokenString` برای مستقیم
   - اگر JWT_SECRET تغییر کرد، کاربر باید دوباره login کنه

3. **Prisma:**
   - همیشه از `env("DATABASE_URL")` استفاده کن
   - بعد از تغییر schema، دیتابیس رو sync کن

4. **Dev-Only Components:**
   - با `process.env.NODE_ENV` کنترل کن
   - دو لایه حفاظتی داشته باش (داخل کامپوننت و در صفحه)

5. **سرور:**
   - از `bun run dev` استفاده کن
   - از `nohup bun run dev &` استفاده نکن
   - خروجی سرور در `dev.log` ذخیره می‌شود

6. **تست:**
   - بعد از هر فیچر جدید، فیچرهای قبلی رو هم تست کن
   - DevToolsPanel رو تست کن (اگر این کار کنه، دیتابیس درسته)
   - API routes رو برای احراز هویت تست کن

---

## آخرین بروزرسانی

- **تاریخ:** ۲۰۲۵-۰۱-۱۸
- **نسخه:** 1.1.0
- **تغییرات:**
  - اصلاح JWT_SECRET در .env و .env.local به `hamsou-dev-secret-key`
  - اصلاح prisma/schema.prisma برای استفاده از env
  - مستندسازی راهنمای توسعه
  - **آپدیت جدید:** اصلاح API routes برای استفاده از `user.userId` به جای `user.id`
  - **آپدیت جدید:** اصلاح `/api/auth/verify` برای استفاده از `verifyTokenString`
  - **آپدیت جدید:** افزودن بخش احراز هویت و token handling
  - **آپدیت جدید:** مستندسازی مشکلات احراز هویت و راه‌حل‌ها
