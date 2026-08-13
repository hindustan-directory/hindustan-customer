#!/bin/bash
# Shared Android release build: ./scripts/android-release-build.sh apk|aab
set -euo pipefail

MODE="${1:-}"
if [[ "$MODE" != "apk" && "$MODE" != "aab" ]]; then
  echo "Usage: $0 apk|aab"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_LABEL="HindustanCustomer"

load_env() {
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
  else
    echo "⚠️  No .env or .env.local — using shell env vars only."
  fi
}

load_env

if [[ -n "${EXPO_PUBLIC_API_BASE_URL_PROD:-}" ]]; then
  export EXPO_PUBLIC_API_BASE_URL="$EXPO_PUBLIC_API_BASE_URL_PROD"
  echo "🌐 API URL set to production: $EXPO_PUBLIC_API_BASE_URL"
elif [[ -n "${EXPO_PUBLIC_API_BASE_URL:-}" ]]; then
  echo "🌐 API URL: $EXPO_PUBLIC_API_BASE_URL"
else
  echo "❌ Release build requires EXPO_PUBLIC_API_BASE_URL_PROD or EXPO_PUBLIC_API_BASE_URL"
  exit 1
fi

if [[ "$EXPO_PUBLIC_API_BASE_URL" != https://* ]]; then
  echo "❌ Release API URL must use HTTPS: $EXPO_PUBLIC_API_BASE_URL"
  exit 1
fi

echo ""
echo "📋 Build configuration:"
echo "   - R8 minification: ENABLED"
echo "   - Resource shrinking: ENABLED"
echo "   - Target: $(echo "$MODE" | tr '[:lower:]' '[:upper:]')"
echo ""

echo "🔧 Running Expo prebuild (android)..."
rm -rf android
npx expo prebuild --platform android

ANDROID_SDK_PATH="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
echo "📱 Writing android/local.properties..."
echo "sdk.dir=$ANDROID_SDK_PATH" > android/local.properties

KEYSTORE_SRC="${RELEASE_KEYSTORE_FILE:-hindustan-customer-release-key.keystore}"
KEYSTORE_DEST="android/app/$(basename "$KEYSTORE_SRC")"
export RELEASE_KEYSTORE_FILE="$(basename "$KEYSTORE_SRC")"

echo "🔑 Restoring signing keystore..."
if [[ -f "$KEYSTORE_SRC" ]]; then
  cp "$KEYSTORE_SRC" "$KEYSTORE_DEST"
  echo "   ✓ Keystore copied to android/app/"
else
  echo "   ❌ Keystore not found: $KEYSTORE_SRC"
  echo "   Place your release keystore in the project root (gitignored)."
  exit 1
fi

echo "🔐 Injecting release signing config..."
node scripts/inject-android-signing.mjs

cd android

echo ""
echo "🧹 Cleaning previous builds..."
rm -rf app/.cxx
./gradlew clean

echo ""
if [[ "$MODE" == "apk" ]]; then
  echo "🔨 Building release APK..."
  ./gradlew assembleRelease --no-daemon
  OUT_DIR="app/build/outputs/apk/release"
  OUT_GLOB="*.apk"
  DESKTOP_NAME="${APP_LABEL}-vVERSION-Release.apk"
else
  echo "🔨 Building release AAB (Play Store)..."
  ./gradlew bundleRelease --no-daemon
  OUT_DIR="app/build/outputs/bundle/release"
  OUT_GLOB="*.aab"
  DESKTOP_NAME="${APP_LABEL}-vVERSION-PlayStore.aab"
fi

VERSION="$(node -p "require('../package.json').version" 2>/dev/null || echo unknown)"
DESKTOP_FILE="$HOME/Desktop/${DESKTOP_NAME/VERSION/$VERSION}"

echo ""
echo "✅ Build complete!"
echo ""

if [[ ! -d "$OUT_DIR" ]]; then
  echo "❌ Output directory not found: $OUT_DIR"
  exit 1
fi

ARTIFACT="$(ls -1 "$OUT_DIR"/$OUT_GLOB 2>/dev/null | head -n 1 || true)"
if [[ -z "$ARTIFACT" || ! -f "$ARTIFACT" ]]; then
  echo "❌ No release artifact found in $OUT_DIR"
  ls -la "$OUT_DIR" 2>/dev/null || true
  exit 1
fi

mkdir -p "$HOME/Desktop"
cp "$ARTIFACT" "$DESKTOP_FILE"
SIZE="$(du -h "$DESKTOP_FILE" | awk '{print $1}')"

echo "📦 Artifact: $ARTIFACT"
echo "📲 Copied to: $DESKTOP_FILE ($SIZE)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ "$MODE" == "apk" ]]; then
  echo "✨ Production APK ready!"
else
  echo "✨ Production AAB ready for Google Play!"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
