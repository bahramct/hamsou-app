#!/bin/bash
cd /home/z/my-project

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "simple-start" 2>/dev/null

sleep 2

# Start in loop
while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting server..." >> startup.log
  bun run dev >> dev.log 2>&1
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Server exited, restarting..." >> startup.log
  sleep 3
done
