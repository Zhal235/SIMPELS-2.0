#!/bin/bash

# SIMPELS Production Deployment Script untuk Fix Excel Import Feature
# Jalankan script ini di server production setelah git pull

echo "🚀 Starting SIMPELS Excel Import Feature Deployment..."

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
php artisan view:cache

# Step 3: Run any pending migrations
echo "🗄️ Running migrations..."
php artisan migrate --force

# Step 4: Verify route registration
echo "🔍 Verifying route registration..."
echo "Download template route:"
php artisan route:list | grep download-template
echo "Import excel route:"
php artisan route:list | grep import-excel

# Step 5: Create required directories
echo "📁 Creating storage directories..."
mkdir -p storage/app/imports/wallets
mkdir -p storage/app/temp
chmod -R 775 storage/app/imports
chmod -R 775 storage/app/temp

# Step 6: Test endpoint (if possible)
echo "🧪 Testing endpoints..."
echo "Download template: GET /api/v1/wallets/download-template"
echo "Import excel: POST /api/v1/wallets/import-excel"

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Test download template: https://api-simpels.saza.sch.id/api/v1/wallets/download-template"
echo "2. Test import excel functionality in frontend"
echo "3. Clear browser cache if needed"