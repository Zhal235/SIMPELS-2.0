# SIMPELS Production Deployment Script untuk WA Gateway Log Fix
# Jalankan script ini di server Windows production setelah git pull

Write-Host "🚀 Starting SIMPELS WA Gateway Log Fix Deployment..." -ForegroundColor Green

# Step 1: Clear all Laravel caches
Write-Host "📦 Clearing Laravel caches..." -ForegroundColor Yellow
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Step 2: Optimize for production
Write-Host "⚡ Optimizing for production..." -ForegroundColor Yellow
php artisan config:cache
php artisan route:cache

Write-Host "✅ WA Gateway Log Fix deployed successfully!" -ForegroundColor Green
Write-Host "⚠️  Jika nama santri masih belum muncul, restart web server/PHP-FPM" -ForegroundColor Yellow
