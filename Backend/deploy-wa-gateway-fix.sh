#!/bin/bash

# SIMPELS Production Deployment Script untuk WA Gateway Log Fix
# Jalankan script ini di server production setelah git pull

echo "🚀 Starting SIMPELS WA Gateway Log Fix Deployment..."

# Step 1: Clear all Laravel caches
echo "📦 Clearing Laravel caches..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Step 2: Optimize for production
echo "⚡ Optimizing for production..."
php artisan config:cache
php artisan route:cache

# Step 3: Restart PHP-FPM (optional, uncomment jika ada masalah)
# echo "🔄 Restarting PHP-FPM..."
# sudo systemctl restart php8.2-fpm

echo "✅ WA Gateway Log Fix deployed successfully!"
echo "⚠️  Jika nama santri masih belum muncul, restart PHP-FPM dengan:"
echo "    sudo systemctl restart php8.2-fpm"
