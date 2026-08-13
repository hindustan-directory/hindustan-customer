#!/bin/bash
# One-command signed release AAB for Google Play (mirrors milkroute build-production.sh)
exec "$(dirname "$0")/scripts/android-release-build.sh" aab
