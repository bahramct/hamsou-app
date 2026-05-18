# Troubleshooting (حل مشکلات)

راهنمای حل مشکلات رایج پروژه همسو.

## فایل‌ها

- **01-common-issues.md** - مشکلات رایج و راه‌حل‌های آن‌ها
- **02-platform-specific.md** - مشکلات مخصوص پلتفرم (Windows, Linux, macOS)

## برای کی این بخش است؟

- همه توسعه‌دهندگان
- هر کسی که با خطا مواجه می‌شود
- هر کسی که می‌خواهد مشکل را دیباگ کند

---

## Flow حل مشکل

### 1. چک کردن Prisma
```bash
bun run prisma generate
```

### 2. ریستارت سرور
```bash
# Linux/Mac
pkill -9 node
bun run dev

# Windows
taskkill /F /IM node.exe
bun run dev
```

### 3. پاک کردن و نصب مجدد
```bash
# Linux/Mac
rm -rf node_modules .next
bun install
bun run dev

# Windows
rmdir /s /q node_modules .next
bun install
bun run dev
```

### 4. بررسی لاگ‌ها
```bash
tail -f dev.log
```

---

## مشکلات پرتکرار

| مشکل | راه‌حل |
|-------|--------|
| Prisma Client not initialized | `bun run prisma generate` |
| Token invalid | `localStorage.clear()` و login دوباره |
| API 500 error | ریستارت سرور |
| Port in use | `kill -9 <PID>` یا استفاده از پورت دیگر |

---

## اگر راه‌حلی پیدا نکردید

1. لاگ کامل را ذخیره کنید: `cat dev.log > error-log.txt`
2. اطلاعات سیستم را جمع‌آوری کنید: `bun --version`, `node --version`
3. از [Development Guide](../01-development/01-development-guide.md) استفاده کنید

---

## مرور سریع

→ [Common Issues](./01-common-issues.md) ← شروع از اینجا!
