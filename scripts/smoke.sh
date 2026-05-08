#!/usr/bin/env bash
set -euo pipefail

npm run build:pages

PORT="${PORT:-4173}"
HOST="127.0.0.1"
BASE_URL="http://${HOST}:${PORT}/meshtrack-studio/"

npx vite preview --host "$HOST" --port "$PORT" >/tmp/meshtrack-studio-smoke.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 40); do
  if curl -fsS "$BASE_URL" >/tmp/meshtrack-studio-index.html; then
    break
  fi
  sleep 0.25
done

grep -q "root" /tmp/meshtrack-studio-index.html
echo "Smoke OK: ${BASE_URL}"
