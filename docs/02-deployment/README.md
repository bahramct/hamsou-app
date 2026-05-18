# Deployment Guide (راهنمای استقرار)

راهنمای استقرار پروژه همسو در محیط production.

## فایل‌ها

- **01-deployment-guide.md** - راهنمای کامل استقرار از نصب تا مانیتورینگ
- **02-pm2-guide.md** - راهنمای مدیریت سرور با PM2

## برای کی این بخش است؟

- DevOps engineers
- هر کسی که می‌خواهد پروژه را روی سرور واقعی استقرار کند
- هر کسی که نیاز به production setup دارد

---

## پیش‌نیازها

- سرور Linux (Ubuntu 20.04+ پیشنهادی)
- Node.js 18+ و Bun
- Git
- دامنه و SSL (اختیاری اما پیشنهادی)

---

## شروع سریع

```bash
# روی سرور
git clone <repository-url>
cd hamsu

# نصب
bun install

# تنظیم production env
cat > .env.production << EOF
DATABASE_URL="file:db/hamsou-prod.db?connection_limit=1"
JWT_SECRET="$(openssl rand -base64 32)"
NODE_ENV="production"
AI_PROVIDER="zai"
EOF

# Build
bun run build

# راه‌اندازی دیتابیس
bun run prisma generate
bun run db:push

# اجرا
NODE_ENV=production bun run start
# یا با PM2
pm2 start ecosystem.config.js
```

---

## مشکلات رایج؟

→ [Common Issues](../05-troubleshooting/01-common-issues.md)
