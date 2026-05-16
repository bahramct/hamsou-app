#!/bin/bash
cd /home/z/my-project
pm2 restart hamsou-dev || pm2 start "bun run dev" --name hamsou-dev
echo "✅ Hamsou dev server started!"
echo "View logs: pm2 logs hamsou-dev"
echo "View status: pm2 status"
