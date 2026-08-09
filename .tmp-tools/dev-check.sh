#!/bin/bash
cd /home/midnightshri/Employee-Place/frontend
pkill -f "vite" 2>/dev/null
nohup npm run dev > /tmp/vite-dev.log 2>&1 &
echo "started pid $!"
sleep 8
echo "--- dev log ---"
cat /tmp/vite-dev.log
echo "--- HTTP check ---"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:5173/
echo "--- index head ---"
curl -s http://localhost:5173/ | head -c 400
echo ""