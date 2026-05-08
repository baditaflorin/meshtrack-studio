#!/usr/bin/env bash
set -euo pipefail

npm run build:pages

npx playwright test --config playwright.smoke.config.ts
