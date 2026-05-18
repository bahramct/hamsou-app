#!/bin/bash
cd /home/z/my-project
nohup bash start-dev.sh > /tmp/start-dev-bg.log 2>&1 &
echo "Dev server started in background with PID: $!"
disown $! 2>/dev/null
