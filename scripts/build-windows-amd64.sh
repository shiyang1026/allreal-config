#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0

wails build \
  -platform windows/amd64 \
  -s \
  -clean \
  -ldflags "-w -s" \
  -tags "desktop,production" \
  -o allreal-config.exe

echo "Build complete: build/bin/allreal-config.exe"
file build/bin/allreal-config.exe 2>/dev/null || true
