#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${VERSION:-0.0.0}"
APP_DISPLAY_NAME="AllReal Config"
APP_BUNDLE_NAME="allreal-config.app"
BINARY_NAME="allreal-config"
BUNDLE_ID="com.allreal.config"
BUILD_DIR="$ROOT_DIR/build/bin"
APP_DIR="$BUILD_DIR/$APP_BUNDLE_NAME"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

cd "$ROOT_DIR"

mkdir -p "$BUILD_DIR"
rm -rf "$APP_DIR"

mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

GOCACHE="${GOCACHE:-$ROOT_DIR/.tmp-go-cache}" \
CGO_ENABLED=1 \
CGO_CFLAGS="${CGO_CFLAGS:-} -mmacosx-version-min=10.13" \
CGO_CXXFLAGS="${CGO_CXXFLAGS:-} -mmacosx-version-min=10.13" \
CGO_LDFLAGS="${CGO_LDFLAGS:-} -framework UniformTypeIdentifiers -mmacosx-version-min=10.13" \
GOOS=darwin \
GOARCH=arm64 \
go build \
  -buildvcs=false \
  -tags desktop,wv2runtime.download,production \
  -ldflags "-w -s" \
  -o "$MACOS_DIR/$BINARY_NAME"

cat > "$CONTENTS_DIR/Info.plist" <<PLIST
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleName</key>
    <string>$APP_DISPLAY_NAME</string>
    <key>CFBundleDisplayName</key>
    <string>$APP_DISPLAY_NAME</string>
    <key>CFBundleExecutable</key>
    <string>$BINARY_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>$BUNDLE_ID</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundleIconFile</key>
    <string>iconfile</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
      <key>NSAllowsLocalNetworking</key>
      <true/>
    </dict>
  </dict>
</plist>
PLIST

go run scripts/make-icns.go assets/appicon.png "$RESOURCES_DIR/iconfile.icns"
plutil -lint "$CONTENTS_DIR/Info.plist"
file "$MACOS_DIR/$BINARY_NAME"
