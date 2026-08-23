#!/bin/bash
# Shareable debug APK for colleagues — no release keystore, HTTP API allowed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_LABEL="HindustanCustomer"

if [[ -f .env.local ]]; then
  echo "✓ Loading environment from .env.local..."
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
elif [[ -f .env ]]; then
  echo "✓ Loading environment from .env..."
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -n "${EXPO_PUBLIC_API_BASE_URL:-}" ]]; then
  echo "🌐 API URL: $EXPO_PUBLIC_API_BASE_URL"
  if [[ "$EXPO_PUBLIC_API_BASE_URL" == http://* && "${EXPO_PUBLIC_ALLOW_CLEARTEXT:-}" != "true" ]]; then
    echo "⚠️  HTTP API detected — add EXPO_PUBLIC_ALLOW_CLEARTEXT=true to .env for Android"
  fi
else
  echo "🌐 API URL: default (https://13.204.231.151/api/v1)"
fi

echo ""
echo "📋 Debug APK (assembleDebug — share with colleagues, not for Play Store)"
echo ""

echo "🔧 Running Expo prebuild (android)..."
rm -rf android
npx expo prebuild --platform android

ANDROID_SDK_PATH="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
echo "sdk.dir=$ANDROID_SDK_PATH" > android/local.properties

cd android
echo "🧹 Cleaning..."
rm -rf app/.cxx
./gradlew clean

echo ""
echo "🔨 Building debug APK..."
./gradlew assembleDebug --no-daemon

OUT_DIR="app/build/outputs/apk/debug"
VERSION="$(node -p "require('../package.json').version" 2>/dev/null || echo unknown)"
DESKTOP_FILE="$HOME/Desktop/${APP_LABEL}-v${VERSION}-Debug.apk"

ARTIFACT="$(ls -1 "$OUT_DIR"/app-debug.apk 2>/dev/null | head -n 1 || true)"
if [[ -z "$ARTIFACT" || ! -f "$ARTIFACT" ]]; then
  ARTIFACT="$(ls -1 "$OUT_DIR"/*.apk 2>/dev/null | head -n 1 || true)"
fi

if [[ -z "$ARTIFACT" || ! -f "$ARTIFACT" ]]; then
  echo "❌ No debug APK found in $OUT_DIR"
  exit 1
fi

mkdir -p "$HOME/Desktop"
cp "$ARTIFACT" "$DESKTOP_FILE"
SIZE="$(du -h "$DESKTOP_FILE" | awk '{print $1}')"

echo ""
echo "✅ Debug APK ready: $DESKTOP_FILE ($SIZE)"
echo "   Send this file to your colleague — they may need to allow installs from unknown sources."
