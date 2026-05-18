#!/bin/bash
cd /home/z/my-project

# Kill existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "start-server" 2>/dev/null
sleep 2

# Auto-restart loop
while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting server..." >> startup.log
  
  # Run next dev and capture exit code
  ./node_modules/.bin/next dev -p 3000 -H 0.0.0.0 >> dev.log 2>&1
  
  EXIT_CODE=$?
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Server exited with code: $EXIT_CODE" >> startup.log
  
  # Short pause before restart
  sleep 3
done &

# Disown the background process
disown $! 2>/dev/null
echo "Server auto-restart started. PID: $!"
