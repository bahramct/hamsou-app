# راهنمای مدیریت سرور Hamsou با PM2

## 🚀 وضعیت فعلی
سرور توسعه Hamsou با **PM2** در حال اجراست و همیشه زنده می‌مونه.

## 📋 دستورات مفید PM2

### مشاهده وضعیت سرور
```bash
pm2 status
# یا
pm2 list
```

### مشاهده لاگ‌ها
```bash
# مشاهده 20 خط آخر لاگ
pm2 logs hamsou-dev --lines 20

# مشاهده لاگ به صورت زنده (real-time)
pm2 logs hamsou-dev

# فقط لاگ‌های خطا
pm2 logs hamsou-dev --err
```

### ری‌استارت سرور
```bash
pm2 restart hamsou-dev
# یا از اسکریپت آماده:
./start.sh
```

### توقف و شروع سرور
```bash
# توقف
pm2 stop hamsou-dev

# شروع مجدد
pm2 start hamsou-dev
```

### ریستارت تمام سرورها
```bash
pm2 restart all
```

### حذف سرور از PM2
```bash
pm2 delete hamsou-dev
```

### مشاهده منابع مصرفی (CPU/Memory)
```bash
pm2 monit
```

## 🛠️ عیب‌یابی

### اگر سرور خاموش شد
```bash
# چک کنید سرور استارت شده
pm2 status

# اگر offline بود، ری‌استارت کنید
pm2 restart hamsou-dev

# اگر وجود نداشت، دوباره استارت کنید
pm2 start "bun run dev" --name hamsou-dev
pm2 save
```

### اگر پورت 3000 مشکل دارد
```bash
# کیل کردن همه پروسه‌های روی پورت 3000
fuser -k 3000/tcp

# ری‌استارت سرور
pm2 restart hamsou-dev
```

### مشاهده لاگ‌های خطا
```bash
pm2 logs hamsou-dev --err --lines 50
```

## 💡 نکات مهم

1. **PM2 سرور رو نگه می‌داره**: اگر سرور کرش کرد، PM2 خودکار دوباره start می‌کنه
2. **ذخیره تنظیمات**: بعد از هر تغییری، `pm2 save` رو اجرا کنید
3. **اسکریپت آماده**: از `./start.sh` برای start سریع استفاده کنید
4. **لاگ‌ها**: تمام لاگ‌ها در `~/.pm2/logs/` ذخیره می‌شن

## 🔄 پس از ربوت سیستم

برای اینکه سرور بعد از ربوت سیستم خودکار start بشه، اجرا کنید:
```bash
pm2 resurrect
```

## 📊 مانیتورینگ

برای مانیتورینگ واقعی:
```bash
pm2 monit
```

این دستور یک dashboard زیبا نشون می‌ده با:
- وضعیت هر پروسه
- مصرف CPU
- مصرف RAM
- زمان uptime
- و...

---

**آخرین بروزرسانی:** با PM2، سرور Hamsou همیشه زنده می‌مونه! 🚀
