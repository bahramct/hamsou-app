# راهنمای استقرار (Deployment Guide)

این راهنما نحوه استقرار پروژه همسو در محیط production را توضیح می‌دهد.

---

## پیش‌نیازها

- سرور Linux (Ubuntu 20.04+ پیشنهادی)
- Node.js 18+ و Bun
- Git
- دامنه و SSL (اختیاری اما پیشنهادی)

---

## 1. آماده‌سازی کد

### کلون کردن پروژه

```bash
git clone <repository-url>
cd hamsu
```

### نصب Dependencies

```bash
bun install
```

### تنظیم Environment Variables

ایجاد `.env.production`:

```env
# Database - Production
DATABASE_URL="file:db/hamsou-prod.db?connection_limit=1"

# JWT Secret - حتماً تغییر دهید!
JWT_SECRET="<generate-secure-random-string>"

# Environment
NODE_ENV="production"

# AI Provider
AI_PROVIDER="zai"
```

**تولید JWT Secret امن:**

```bash
openssl rand -base64 32
```

---

## 2. ساخت پروژه

```bash
bun run build
```

این دستور پروژه را برای production بهینه می‌کند و در `.next/standalone` قرار می‌دهد.

---

## 3. راه‌اندازی دیتابیس

```bash
bun run prisma generate
bun run db:push
```

---

## 4. اجرای سرور

### روش 1: مستقیم (تست)

```bash
NODE_ENV=production bun run start
```

### روش 2: با PM2 (پیشنهادی)

**نصب PM2:**

```bash
npm install -g pm2
```

**ایجاد فایل ecosystem.config.js:**

```javascript
module.exports = {
  apps: [{
    name: 'hamsu',
    script: '.next/standalone/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**اجرای PM2:**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 5. پیکربندی Nginx (اختیاری)

### ساخت فایل nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**فعال‌سازی:**

```bash
sudo ln -s /etc/nginx/sites-available/hamsu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. تنظیم SSL با Certbot (اختیاری)

```bash
sudo certbot --nginx -d your-domain.com
```

---

## 7. مانیتورینگ

### بررسی لاگ‌ها

```bash
# با PM2
pm2 logs hamsu

# یا فایل مستقیم
tail -f server.log
```

### بررسی وضعیت

```bash
pm2 status
pm2 monit
```

### ریستارت

```bash
pm2 restart hamsu
```

---

## 8. آپدیت

### آپدیت کد

```bash
git pull origin main
bun install
bun run build
pm2 restart hamsu
```

### آپدیت دیتابیس

```bash
bun run prisma generate
bun run db:push
pm2 restart hamsu
```

---

## چک‌لیست Deployment

- [ ] کد از latest branch کلون شده
- [ ] Dependencies نصب شده
- [ ] `.env.production` با تنظیمات صحیح ایجاد شده
- [ ] JWT_SECRET امن تولید شده
- [ ] دیتابیس sync شده
- [ ] پروژه build شده
- [ ] سرور اجرا شده
- [ ] تست API در production انجام شده
- [ ] SSL (در صورت نیاز) تنظیم شده

---

## منابع بیشتر

- [راهنمای PM2](./02-pm2-guide.md)
- [راهنمای حل مشکلات](../05-troubleshooting/01-common-issues.md)
