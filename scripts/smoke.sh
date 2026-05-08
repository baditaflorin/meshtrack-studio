#!/usr/bin/env bash
set -euo pipefail

npm run build:pages

PORT="${PORT:-$((4500 + RANDOM % 1000))}"
HOST="127.0.0.1"
BASE_URL="http://${HOST}:${PORT}/meshtrack-studio/"

npx vite preview --host "$HOST" --port "$PORT" --strictPort >/tmp/meshtrack-studio-smoke.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

ready=0
for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL" >/tmp/meshtrack-studio-index.html 2>/dev/null; then
    ready=1
    break
  fi
  sleep 0.25
done

if [[ "$ready" != "1" ]]; then
  cat /tmp/meshtrack-studio-smoke.log
  exit 1
fi

grep -q '<div id="root"></div>' /tmp/meshtrack-studio-index.html
PLAYWRIGHT_BASE_URL="http://${HOST}:${PORT}" npx playwright test --config playwright.smoke.config.ts
