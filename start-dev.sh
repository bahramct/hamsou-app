#!/bin/bash
# Script to start dev server and keep it running
# This script automatically restarts the server if it crashes

cd /home/z/my-project

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "start-dev" 2>/dev/null

# Wait a moment
sleep 2

# Start the dev server in a loop to auto-restart if it crashes
while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Next.js dev server..." >> /home/z/my-project/startup.log

  # Start dev server with proper configuration (redirect all output)
  ./node_modules/.bin/next dev -p 3000 -H 0.0.0.0 >> /home/z/my-project/dev.log 2>&1

  # If server exits, wait a bit and restart
  EXIT_CODE=$?
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Server exited with code: $EXIT_CODE" >> /home/z/my-project/startup.log
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting in 3 seconds..." >> /home/z/my-project/startup.log
  sleep 3
done
