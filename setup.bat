@echo off
echo 🔧 شروع راه‌اندازی پروژه همسو...
echo.

REM 1. نصب dependencies
echo 📦 نصب dependencies...
call bun install

REM 2. تولید Prisma Client
echo 🗄️ تولید Prisma Client...
call bun run prisma generate

REM 3. راه‌اندازی دیتابیس
echo 💾 راه‌اندازی دیتابیس...
call bun run db:push

REM 4. ایجاد داده‌های تستی
echo 🌱 ایجاد داده‌های تستی...
call bun run scripts/seed-database.ts

echo.
echo ✅ راه‌اندازی تکمیل شد!
echo.
echo 🚀 برای اجرای پروژه:
echo    bun run dev
echo.
pause
