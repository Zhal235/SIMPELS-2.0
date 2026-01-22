#!/bin/bash
# Deploy SIMPELS-2.0 Backend di Linux - Fix Script

set -e

echo "=========================================="
echo "SIMPELS-2.0 Laravel 12 - Linux Deploy Fix"
echo "=========================================="

# 1. Remove composer lock & cache
echo ""
echo "[1/5] Clearing composer cache..."
rm -f composer.lock
composer clear-cache

# 2. Clean autoload
echo ""
echo "[2/5] Cleaning autoload files..."
rm -rf vendor/composer/autoload_*.php vendor/composer/autoload.php

# 3. Fresh install
echo ""
echo "[3/5] Running fresh composer install..."
composer install --no-interaction

# 4. Generate key
echo ""
echo "[4/5] Generating application key..."
php artisan key:generate

# 5. Optimize
echo ""
echo "[5/5] Optimizing..."
php artisan config:cache
php artisan route:cache

echo ""
echo "=========================================="
echo "✅ Deploy complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. php artisan migrate"
echo "2. php artisan db:seed"
echo "3. Start web server"
echo ""
