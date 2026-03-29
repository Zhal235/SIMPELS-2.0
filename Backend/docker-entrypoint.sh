#!/bin/sh
set -e

cd /var/www

# Generate firebase credentials dari environment variable
if [ -n "$FIREBASE_CREDENTIALS_JSON" ]; then
    echo "$FIREBASE_CREDENTIALS_JSON" > storage/app/firebase-credentials.json
    chmod 600 storage/app/firebase-credentials.json
    echo "Firebase credentials created from env var"
fi

# Run artisan startup commands
php artisan optimize:clear
php artisan config:cache
php artisan migrate --force --no-interaction

# Start all services via supervisor
exec /usr/bin/supervisord -c /etc/supervisord.conf
