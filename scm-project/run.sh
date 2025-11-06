#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="server.log"

echo "Installing SCM project dependencies..."
npm install

echo "Starting SCM server in the background..."
node server.js > "$LOG_FILE" 2>&1 &
PID=$!
echo "Server started with PID: $PID"

sleep 5

echo "Checking server health..."
ROOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")
echo "Login page HTTP status: $ROOT_STATUS"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/products || echo "000")
echo "Products API HTTP status: $API_STATUS"

echo "Server is running. Access at http://localhost:3000. To stop, run: kill $PID"
