#!/bin/bash

# اسکریپت راه‌اندازی پروژه همسو

echo "🚀 راه‌اندازی پروژه همسو..."

# 1. نصب وابستگی‌ها
echo "📦 نصب وابستگی‌ها..."
bun install

# 2. Generate Prisma Client
echo "🗄️  تولید Prisma Client..."
bun run prisma generate

# 3. Push schema به دیتابیس
echo "💾 ایجاد دیتابیس..."
bun run db:push

# 4. ایجاد داده‌های تستی
echo "🌱 ایجاد داده‌های تستی..."
bun run scripts/seed-database.ts

# 5. چک کردن داده‌ها
echo "📊 بررسی داده‌ها..."
bun run scripts/check-data.ts

echo ""
echo "✅ راه‌اندازی تکمیل شد!"
echo ""
echo "برای شروع سرور:"
echo "  bun run dev"
echo ""
echo "برای تست API:"
echo "  bun run scripts/test-api.ts"
echo ""
echo "اطلاعات ورود تست:"
echo "  شماره: 09123456789"
echo "  کد: 1234"
