#!/bin/bash

# Script برای اجرای سرور توسعه

cd /home/z/my-project

echo "🚀 شروع سرور توسعه همسو..."
echo "PID: $$"
echo ""

# Execute the dev server
bun run dev 2>&1 | tee /home/z/my-project/server.log
