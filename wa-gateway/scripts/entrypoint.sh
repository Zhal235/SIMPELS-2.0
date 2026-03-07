#!/bin/sh
set -e

AUTH_DIR="/app/.wwebjs_auth"

# Hapus lock file stale agar Chromium bisa start
find "$AUTH_DIR" \( -name "SingletonLock" -o -name "SingletonSocket" -o -name "SingletonCookie" \) 2>/dev/null | xargs rm -f

# Hapus DevToolsActivePort agar tidak ada konflik port debugging lama
find "$AUTH_DIR" -name "DevToolsActivePort" 2>/dev/null | xargs rm -f

# Hapus Chromium crash recovery files yang bisa menyebabkan bailout loop
find "$AUTH_DIR" -name "Last*" -o -name "Current*Session" 2>/dev/null | xargs rm -f 2>/dev/null || true

echo "[Entrypoint] Auth dir cleaned, starting wa-gateway..."
exec node src/index.js
