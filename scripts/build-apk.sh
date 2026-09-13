#!/usr/bin/env bash
# Local release APK — same flow as Hindustan vendor scripts/build-apk.sh.
# Sideload only (Expo debug signing). Play Store AAB: ./build-production.sh

set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env.local ]; then
  echo "Loading environment from .env.local"
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
elif [ -f .env ]; then
  echo "Loading environment from .env"
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  echo "No .env or .env.local — using EXPO_PUBLIC_API_BASE_URL from the environment or the app default"
fi

if [ -n "${EXPO_PUBLIC_API_BASE_URL:-}" ]; then
  echo "API base: $EXPO_PUBLIC_API_BASE_URL"
fi

echo "Running Expo prebuild (android)..."
npx expo prebuild --platform android --clean

ANDROID_SDK_PATH="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
if [ ! -d "$ANDROID_SDK_PATH" ]; then
  echo "Android SDK not found at $ANDROID_SDK_PATH"
  echo "Set ANDROID_HOME, or use: npm run build:aab"
  exit 1
fi
echo "sdk.dir=$ANDROID_SDK_PATH" > android/local.properties

cd android
rm -rf app/.cxx
./gradlew clean
./gradlew assembleRelease --no-daemon

APK_DIR="app/build/outputs/apk/release"
VERSION=$(node -p "require('../package.json').version" 2>/dev/null || echo "unknown")

if [ ! -d "$APK_DIR" ]; then
  echo "APK directory not found: $APK_DIR"
  exit 1
fi

APK_FILE=""
for candidate in "$APK_DIR"/*-universal-release.apk "$APK_DIR"/*.apk; do
  if [ -f "$candidate" ]; then
    APK_FILE="$candidate"
    break
  fi
done

if [ -z "$APK_FILE" ]; then
  echo "No release APK found in $APK_DIR"
  ls -1 "$APK_DIR" 2>/dev/null || true
  exit 1
fi

mkdir -p "$HOME/Desktop"
DEST="$HOME/Desktop/HindustanCustomer-v${VERSION}-Release.apk"
cp "$APK_FILE" "$DEST"
echo "APK: $DEST"
