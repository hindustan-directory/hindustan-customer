#!/usr/bin/env bash
# Thin wrapper — real script lives in scripts/build-apk.sh (vendor parity)
exec "$(dirname "$0")/scripts/build-apk.sh" "$@"
