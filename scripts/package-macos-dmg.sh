#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${VERSION:?VERSION is required, for example v0.1.0}"
APP_NAME="AllReal Config"
BINARY_NAME="allreal-config"
APP_PATH="$ROOT_DIR/build/bin/$BINARY_NAME.app"
DIST_DIR="$ROOT_DIR/dist"
STAGE_DIR="$ROOT_DIR/build/dmg"
BACKGROUND_DIR="$STAGE_DIR/.background"
BACKGROUND_PATH="$BACKGROUND_DIR/background.png"
DMG_NAME="$BINARY_NAME-$VERSION-mac-arm64.dmg"
RW_DMG="$DIST_DIR/$BINARY_NAME-$VERSION-mac-arm64-rw.dmg"
FINAL_DMG="$DIST_DIR/$DMG_NAME"
VOLUME_PATH=""

test -d "$APP_PATH"
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR" "$DIST_DIR"

cp -R "$APP_PATH" "$STAGE_DIR/$APP_NAME.app"
ln -s /Applications "$STAGE_DIR/Applications"
mkdir -p "$BACKGROUND_DIR"
go run scripts/make-dmg-background.go "$BACKGROUND_PATH"

rm -f "$RW_DMG" "$FINAL_DMG"
hdiutil create \
  -volname "$APP_NAME" \
  -srcfolder "$STAGE_DIR" \
  -fs HFS+ \
  -format UDRW \
  -ov \
  "$RW_DMG"

ATTACH_OUTPUT="$(hdiutil attach "$RW_DMG" -readwrite -noverify -noautoopen)"
echo "$ATTACH_OUTPUT"
VOLUME_PATH="$(printf '%s\n' "$ATTACH_OUTPUT" | awk '/Apple_HFS/ {for (i=3; i<=NF; i++) printf "%s%s", (i==3 ? "" : " "), $i; print ""}' | tail -n 1)"
VOLUME_NAME="$(basename "$VOLUME_PATH")"

cleanup() {
  if [[ -n "${VOLUME_PATH:-}" && -d "$VOLUME_PATH" ]]; then
    hdiutil detach "$VOLUME_PATH" >/dev/null || true
  fi
}
trap cleanup EXIT

osascript <<APPLESCRIPT
tell application "Finder"
  tell disk "$VOLUME_NAME"
    open
    set current view of container window to icon view
    set toolbar visible of container window to false
    set statusbar visible of container window to false
    set bounds of container window to {100, 100, 860, 520}
    set viewOptions to the icon view options of container window
    set arrangement of viewOptions to not arranged
    set icon size of viewOptions to 112
    set background picture of viewOptions to (POSIX file "$VOLUME_PATH/.background/background.png" as alias)
    set position of item "$APP_NAME.app" of container window to {190, 215}
    set position of item "Applications" of container window to {570, 215}
    close
    open
    update without registering applications
    delay 1
  end tell
end tell
APPLESCRIPT

sync
hdiutil detach "$VOLUME_PATH"
trap - EXIT
hdiutil convert "$RW_DMG" -format UDZO -imagekey zlib-level=9 -o "$FINAL_DMG"
rm -f "$RW_DMG"

echo "$FINAL_DMG"
