# Getting Started (شروع)

راهنمای نصب و راه‌اندازی پروژه همسو.

## فایل‌ها

- **01-installation.md** - راهنمای کامل نصب از صفر تا اجرا
- **02-environment-setup.md** - تنظیم environment variables و محیط development/production

## برای کی این بخش است؟

- توسعه‌دهندگان جدید
- هر کسی که می‌خواهد پروژه را از صفر راه‌اندازی کند
- هر کسی که نیاز به تنظیم محیط development یا production دارد

---

## شروع سریع

```bash
# کلون کردن پروژه
git clone <repository-url>
cd hamsu

# نصب
bun install

# تنظیم environment
cp .env.example .env.local
# ویرایش .env.local

# راه‌اندازی
bun run prisma generate
bun run db:push
bun run dev
```

---

## مشکلات رایج؟

→ [راهنمای حل مشکلات](../05-troubleshooting/01-common-issues.md)
