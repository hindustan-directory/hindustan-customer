#!/bin/bash
# One-command signed release APK (mirrors milkroute build-apk.sh)
exec "$(dirname "$0")/scripts/android-release-build.sh" apk
