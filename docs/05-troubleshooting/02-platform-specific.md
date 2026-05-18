# مشکلات مخصوص پلتفرم (Platform-Specific Issues)

این راهنما مشکلاتی که فقط در پلتفرم‌های خاص رخ می‌دهند را پوشش می‌دهد.

---

## Windows

### مشکل: Prisma Client Error

**علائم:**
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
Module not found: Can't resolve '@/lib/db'
```

**راه‌حل:**

#### روش 1: Full Clean Install
```powershell
# 1. توقف سرور
Ctrl+C

# 2. حذف node_modules
rmdir /s /q node_modules

# 3. حذف .next
rmdir /s /q .next

# 4. حذف Prisma generated files
rmdir /s /q node_modules/@prisma

# 5. نصب مجدد
bun install

# 6. Generate Prisma Client
bun run prisma generate

# 7. Sync دیتابیس
bun run db:push

# 8. شروع سرور
bun run dev
```

#### روش 2: استفاده از اسکریپت
```powershell
# اجرای اسکریپت setup
setup.bat
```

---

### مشکل: Database Permission Error

**علائم:**
```
Error: attempt to write a readonly database
Error: Database is locked
```

**راه‌حل:**
```powershell
# 1. توقف سرور
Ctrl+C

# 2. حذف فایل قفل دیتابیس
del db\hamsou.db-shm
del db\hamsou.db-wal

# 3. شروع سرور
bun run dev
```

---

### مشکل: Path Resolution

**علائم:**
```
Error: Cannot find module '@/lib/db'
Module not found: @/lib/db
```

**چک‌های لازم:**

1. **چک کردن tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. **چک کردن next.config.js:**
```javascript
const nextConfig = {
  // ...
}

module.exports = nextConfig
```

3. **ریستارت TypeScript Server:**
```powershell
# در VSCode: Ctrl+Shift+P -> TypeScript: Restart TS Server
```

---

### مشکل: Bun Execution

**علائم:**
```
'bun' is not recognized as an internal or external command
```

**راه‌حل:**

1. **نصب Bun:**
```powershell
# با PowerShell (Run as Administrator)
irm bun.sh/install.ps1 | iex
```

2. **چک کردن PATH:**
```powershell
# چک کردن
echo $env:PATH

# اگر bun در PATH نبود، اضافه کنید:
$env:PATH += ";C:\Users\<YourUser>\.bun\bin"

# برای دائمی کردن، در Environment Variables اضافه کنید
```

---

### مشکل: Port Already in Use

**علائم:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**راه‌حل:**
```powershell
# 1. پیدا کردن پروسه
netstat -ano | findstr :3000

# 2. کشتن پروسه
taskkill /PID <PID> /F

# 3. یا با پورت دیگری شروع کنید
$env:PORT=3001; bun run dev
```

---

## Linux

### مشکل: Permission Denied

**علائم:**
```
Error: EACCES: permission denied
Error: Database is readonly
```

**راه‌حل:**
```bash
# 1. چک کردن permissions
ls -la db/

# 2. دادن permission
chmod 666 db/*.db
chmod 755 db/

# 3. اگر مشکل ادامه داشت، owner رو تغییر بده
sudo chown -R $USER:$USER db/
```

---

### مشکل: Bun Command Not Found

**علائم:**
```
bash: bun: command not found
```

**راه‌حل:**
```bash
# 1. نصب Bun
curl -fsSL https://bun.sh/install | bash

# 2. Reload shell
source ~/.bashrc
# یا
source ~/.zshrc

# 3. چک کردن
which bun
bun --version
```

---

### مشکل: Database Lock

**علائم:**
```
Error: Database is locked
Error: attempt to write a readonly database
```

**راه‌حل:**
```bash
# 1. توقف سرور
pkill -f "bun run dev"

# 2. حذف فایل‌های قفل
rm -f db/*.db-shm db/*.db-wal

# 3. شروع مجدد
bun run dev
```

---

## macOS

### مشکل: Bun Installation

**علائم:**
```
bun: command not found
```

**راه‌حل:**
```bash
# با Homebrew
brew install oven-sh/bun/bun

# یا با curl
curl -fsSL https://bun.sh/install | bash

# Reload shell
source ~/.zshrc
```

---

### مشکل: Database Location

**علائم:**
```
Error: Database file not found
```

**راه‌حل:**
```bash
# چک کردن مسیر
ls -la db/

# اگر پوشه وجود نداشت
mkdir -p db

# Sync دیتابیس
bun run db:push
```

---

## Cross-Platform Solutions

### 1. استفاده از اسکریپت‌های Setup

**Windows:**
```powershell
setup.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

### 2. چک‌لیست Cross-Platform

قبل از شروع توسعه:

- [ ] Bun نصب شده (`bun --version`)
- [ ] Node.js نصب شده (`node --version`)
- [ ] Dependencies نصب شده (`bun install`)
- [ ] Prisma generate شده (`bun run prisma generate`)
- [ ] دیتابیس sync شده (`bun run db:push`)
- [ ] پوشه `db/` قابل نوشتن است
- [ ] `.env` و `.env.local` وجود دارند
- [ ] سرور بدون error اجرا می‌شود

---

### 3. دستورات مشابه در همه پلتفرم‌ها

| عمل | Windows | Linux/Mac |
|-----|---------|-----------|
| نصب deps | `bun install` | `bun install` |
| Generate Prisma | `bun run prisma generate` | `bun run prisma generate` |
| Sync DB | `bun run db:push` | `bun run db:push` |
| شروع سرور | `bun run dev` | `bun run dev` |
| کشتن پروسه | `taskkill /F /PID <PID>` | `kill -9 <PID>` |
| لاگ‌ها | `type dev.log` | `tail -f dev.log` |

---

## Troubleshooting Flow

### اگر چیزی کار نمی‌کند:

1. **Step 1:** چک کردن Prisma
   ```bash
   bun run prisma generate
   ```

2. **Step 2:** ریستارت سرور
   ```bash
   # Windows
   taskkill /F /IM node.exe
   bun run dev

   # Linux/Mac
   pkill -9 node
   bun run dev
   ```

3. **Step 3:** پاک کردن و نصب مجدد
   ```bash
   # Windows
   rmdir /s /q node_modules .next
   bun install
   bun run dev

   # Linux/Mac
   rm -rf node_modules .next
   bun install
   bun run dev
   ```

4. **Step 4:** اگر باز هم نشد:
   - لاگ کامل را ذخیره کنید
   - نسخه OS و Tools را چک کنید
   - از راهنمای [Common Issues](./01-common-issues.md) استفاده کنید

---

## منابع بیشتر

- [Common Issues](./01-common-issues.md)
- [راهنمای نصب](../00-getting-started/01-installation.md)
