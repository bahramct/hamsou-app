# 🚨 راه‌حل مشکل Prisma Client در Windows

## مشکل شما
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

## راه‌حل ساده (3 مرحله)

### مرحله 1: در VSCode Terminal اجرا کنید
```bash
bun install
```

### مرحله 2: تولید Prisma Client (خیلی مهم!)
```bash
bun run prisma generate
```

### مرحله 3: راه‌اندازی دیتابیس
```bash
bun run db:push
```

### مرحله 4: اجرای پروژه
```bash
bun run dev
```

---

## راه‌حل سریع‌تر (یک خط)
```bash
bun install && bun run prisma generate && bun run db:push && bun run dev
```

---

## یا از فایل setup.bat استفاده کنید
فایل `setup.bat` را در VSCode باز کنید و اجرا کنید (فقط در Windows).

---

## چرا این مشکل پیش می‌آید؟

وقتی شما پروژه را در VSCode باز می‌کنید:

1. **node_modules هنوز کامل نیست** - dependencies در حال دانلود هستند
2. **Prisma Client تولید نشده** - باید دستی تولید شود
3. **تایم‌اوت وجود دارد** - Next.js سعی می‌کند Prisma را import کند قبل از اینکه آماده شود

---

## اگر بعد از انجام این مراحل باز هم مشکل داشت

### روش 1: پاک کردن و نصب مجدد
```bash
# در PowerShell یا CMD
rmdir /s /q node_modules
rmdir /s /q .next

# نصب مجدد
bun install

# تولید Prisma Client
bun run prisma generate

# راه‌اندازی دیتابیس
bun run db:push

# اجرا
bun run dev
```

### روش 2: استفاده از script setup
```bash
bun run setup
bun run dev
```

---

## نکات مهم

### ✅ قبل از هر بار اجرای پروژه
```bash
bun run prisma generate
```

### ✅ بعد از هر تغییری در prisma/schema.prisma
```bash
bun run prisma generate
bun run db:push
```

### ✅ بعد از pull کردن تغییرات از git
```bash
bun install
bun run prisma generate
```

---

## چک کردن صحت نصب

در VSCode Terminal اجرا کنید:
```bash
# چک وجود Prisma Client
ls node_modules/@prisma/client

# اگر خطا داد، نصب ناقص است
# مجدداً اجرا کنید:
bun run prisma generate
```

---

## تست نهایی

بعد از انجام مراحل بالا:

1. به `http://localhost:3000/login` بروید
2. شماره: `09123456789`
3. کد: `1234`
4. باید وارد شوید!

---

## اگر باز هم مشکل داشت

### 1. بررسی نسخه Bun
```bash
bun --version
```

نسخه باید 1.x باشد.

### 2. بررسی Node.js (اگر استفاده می‌کنید)
```bash
node --version
npm --version
```

### 3. پاک کردن کش Bun
```bash
bun pm cache rm
bun install
bun run prisma generate
```

### 4. استفاده از PowerShell به جای CMD
بعضی اوقات CMD مشکلاتی دارد. از PowerShell استفاده کنید:
1. VSCode را باز کنید
2. `Ctrl + ~` برای باز کردن Terminal
3. از منوی بالا PowerShell را انتخاب کنید
4. دستورات را اجرا کنید

---

## خلاصه

**مشکل:** Prisma Client تولید نشده
**راه‌حل:** `bun run prisma generate`
**زمان اجرا:**
- بعد از `bun install`
- بعد از تغییر `prisma/schema.prisma`
- قبل از هر بار اجرای `bun run dev`

---

## Checklist

- [ ] `bun install` انجام شده
- [ ] `bun run prisma generate` انجام شده ✅ **بسیار مهم**
- [ ] `bun run db:push` انجام شده
- [ ] `bun run dev` در حال اجرا است
- [ ] به `http://localhost:3000/login` می‌روم
- [ ] شماره `09123456789` و کد `1234` وارد می‌کنم
- [ ] وارد می‌شوم ✅

---

اگر همه این‌ها را انجام دهید، مشکل باید حل شود! 🎉

اگر باز هم مشکل داشت، بفرمایید تا راه‌حل دیگری پیدا کنیم.
