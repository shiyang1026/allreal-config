#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${VERSION:?VERSION is required}"
BINARY_NAME="allreal-config"
EXE_PATH="$ROOT_DIR/build/bin/${BINARY_NAME}.exe"

if [ ! -f "$EXE_PATH" ]; then
  echo "ERROR: $EXE_PATH not found. Run build-windows-amd64.sh first." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/dist"

echo "Creating ZIP..."
cd "$ROOT_DIR/build/bin"
if command -v 7z &>/dev/null; then
  7z a -tzip "../../dist/${BINARY_NAME}-v${VERSION}-windows-amd64.zip" "${BINARY_NAME}.exe"
else
  powershell -NoProfile -Command "Compress-Archive -Force -Path '${BINARY_NAME}.exe' -DestinationPath '../../dist/${BINARY_NAME}-v${VERSION}-windows-amd64.zip'"
fi
echo "  -> dist/${BINARY_NAME}-v${VERSION}-windows-amd64.zip"

echo "Creating NSIS installer..."
cd "$ROOT_DIR/scripts"
MAKENSIS="makensis"
if ! command -v "$MAKENSIS" &>/dev/null; then
  for d in "/c/Program Files (x86)/NSIS" "/c/Program Files/NSIS"; do
    if [ -f "$d/makensis.exe" ]; then
      MAKENSIS="$d/makensis.exe"
      break
    fi
  done
fi
"$MAKENSIS" -DVERSION="$VERSION" installer.nsi
echo "  -> dist/${BINARY_NAME}-v${VERSION}-windows-amd64-setup.exe"

echo "Packaging complete."
ls -lh "$ROOT_DIR/dist/"
