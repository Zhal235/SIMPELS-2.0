#!/bin/sh
set -e

cd /var/www

# Run artisan startup commands
php artisan optimize:clear
php artisan config:cache
php artisan migrate --force --no-interaction

# Start all services via supervisor
exec /usr/bin/supervisord -c /etc/supervisord.conf
