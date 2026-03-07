#!/bin/sh
find /app/.wwebjs_auth -name "SingletonLock" -o -name "SingletonSocket" -o -name "SingletonCookie" 2>/dev/null | xargs rm -f
exec node src/index.js
