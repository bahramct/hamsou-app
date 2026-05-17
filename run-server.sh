#!/bin/bash

# کیل کردن سرورهای قبلی
pkill -f "next dev" 2>/dev/null
pkill -f "bun.*dev" 2>/dev/null
pkill -f "node.*3000" 2>/dev/null

# صبر کردن
sleep 2

# رفتن به دایرکتوری پروژه
cd /home/z/my-project

# اجرای سرور
exec bun run dev
