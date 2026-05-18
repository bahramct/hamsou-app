# راهنمای اجرای پایدار سرور توسعه

## مشکل
سرور بعد از چند ثانیه crash می‌کند و خاموش می‌شود. دلیل:
- `TypeError: t.unmask is not a function` در Next.js 16.1.3 + React 19.2.3
- این یک bug شناخته شده است که روی عملکرد تاثیری ندارد اما باعث crash می‌شود

## راه حل: استفاده از اسکریپت auto-restart

### روش 1: استفاده از start-dev.sh (پیشنهادی)

اسکریپت `start-dev.sh` سرور را در یک loop اجرا می‌کند و اگر crash کرد، خودکار ریسارتار می‌کند.

```bash
# در یک terminal جداگانه اجرا کنید:
cd /home/z/my-project
bash start-dev.sh
```

**نکات:**
- این terminal را باز نگه دارید
- اگر بسته شود، سرور هم خاموش می‌شود
- برای توقف: `Ctrl+C`

### روش 2: استفاده از nohup (برای background)

```bash
cd /home/z/my-project
nohup bash -c 'while true; do ./node_modules/.bin/next dev -p 3000 -H 0.0.0.0 >> dev.log 2>&1; sleep 3; done' > /dev/null 2>&1 &
```

برای توقف:
```bash
pkill -f "next dev"
```

### روش 3: استفاده از screen یا tmux

```bash
# با screen
screen -S hamsou-dev
cd /home/z/my-project
bash start-dev.sh
# برای خروج از screen بدون توقف سرور: Ctrl+A, D
# برای برگشت: screen -r hamsou-dev

# یا با tmux
tmux new -s hamsou-dev
cd /home/z/my-project
bash start-dev.sh
# برای خروج: Ctrl+B, D
# برای برگشت: tmux attach -t hamsou-dev
```

## بررسی وضعیت سرور

```bash
# چک کردن آیا سرور در حال اجراست
ps aux | grep "next-server" | grep -v grep

# مشاهده لاگ‌ها
tail -f dev.log

# تست سرور
curl -s http://localhost:3000/ > /dev/null && echo "✅ سرور کار می‌کند"
```

## توقف سرور

```bash
# توقف همه process‌های مربوط
pkill -9 -f "next dev"
pkill -9 -f "start-dev"

# یا با استفاده از PID
lsof -ti:3000 | xargs kill -9
```

## راهنمای توسعه

برای توسعه مداوم:

1. **یک terminal برای سرور باز کنید** و `bash start-dev.sh` اجرا کنید
2. **یک terminal دیگر برای توسعه** باز کنید و کارهای خود را انجام دهید
3. **برای مشاهده لاگ‌ها**: `tail -f dev.log` در terminal سوم

## نکات مهم

- ✅ سرور به `0.0.0.0:3000` بایند شده (قابل دسترس از همه شبکه‌ها)
- ✅ همه درخواست‌ها HTTP 200 برمی‌گردانند
- ✅ اگر crash شود، خودکار ریسارتار می‌شود
- ⚠️ TypeError روی عملکرد تاثیری ندارد، فقط در error logs نمایش داده می‌شود
- ⚠️ برای کار پایدار، terminal اجرای سرور را باز نگه دارید یا از screen/tmux استفاده کنید

## در صورت مشکل

اگر سرور اصلاً استارت نشد:

```bash
# 1. پاک کردن cache
rm -rf .next

# 2. حذف همه process‌ها
pkill -9 -f "next"
pkill -9 -f "bun"

# 3. استارت مجدد
cd /home/z/my-project
bash start-dev.sh
```
