#!/bin/bash
# Auto-restart script for Next.js dev server
# This script keeps the dev server running even if it crashes

cd /home/z/my-project

# Kill any existing processes
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "final-runner" 2>/dev/null
sleep 2

# Create and run the daemon
cat > /tmp/hamsu-daemon.sh << 'EOF'
#!/bin/bash
cd /home/z/my-project
exec >> /tmp/hamsu-daemon.log 2>&1
exec 0</dev/null

(
  while true; do
    echo "[$(date)] Starting server..." >> startup.log
    ./node_modules/.bin/next dev -p 3000 -H 0.0.0.0 >> dev.log 2>&1
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> startup.log
    sleep 3
  done
) &
disown $!
echo "Daemon started with PID: $!"
EOF

chmod +x /tmp/hamsu-daemon.sh
/tmp/hamsu-daemon.sh

sleep 5

# Check if server is running
if ps aux | grep "next dev" | grep -v grep > /dev/null; then
  echo "✅ Dev server started successfully!"
  echo "📝 Logs: tail -f dev.log"
  echo "🔍 Check status: ps aux | grep 'next dev'"
else
  echo "❌ Failed to start server. Check logs:"
  tail -20 /tmp/hamsu-daemon.log
  exit 1
fi
