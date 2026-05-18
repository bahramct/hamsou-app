#!/bin/bash
# Script to start dev server and keep it running

cd /home/z/my-project

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start the dev server
while true; do
  echo "Starting dev server..."
  ./node_modules/.bin/next dev -p 3000 > dev.log 2>&1

  # If server exits, wait a bit and restart
  echo "Server stopped, restarting in 3 seconds..."
  sleep 3
done
