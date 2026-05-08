#!/usr/bin/env bash
set -euo pipefail

mkdir -p docs
rm -rf docs/assets
rm -f docs/index.html docs/404.html docs/favicon.svg docs/icons.svg docs/manifest.webmanifest docs/sw.js

npx vite build
cp docs/index.html docs/404.html
