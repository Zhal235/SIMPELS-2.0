# Production Deployment Script for SIMPELS 2.0 (Windows PowerShell)
# Run this script before deploying to production

Write-Host "🚀 Preparing SIMPELS 2.0 for Production Deployment..." -ForegroundColor Cyan
Write-Host ""

# Backend Optimization
Write-Host "📦 Optimizing Backend..." -ForegroundColor Yellow
Set-Location Backend

# Install production dependencies only
Write-Host "Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction

# Cache configurations
Write-Host "Caching configurations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Optimize application
php artisan optimize

Write-Host "✅ Backend optimized!" -ForegroundColor Green
Write-Host ""

# Mobile App Build
Write-Host "📱 Building Mobile App..." -ForegroundColor Yellow
Set-Location ..\mobile

# Get dependencies
Write-Host "Getting Flutter dependencies..."
flutter pub get

# Build for Android (Release)
Write-Host "Building Android APK..." -ForegroundColor Cyan
flutter build apk --release --split-per-abi

# Build for Web (Release)
Write-Host "Building Web..." -ForegroundColor Cyan
flutter build web --release

Write-Host "✅ Mobile app built!" -ForegroundColor Green
Write-Host ""

# Security Reminders
Write-Host "🔒 Security Checklist:" -ForegroundColor Red
Write-Host "  ✓ Ensure APP_DEBUG=false in .env" -ForegroundColor White
Write-Host "  ✓ Ensure APP_ENV=production in .env" -ForegroundColor White
Write-Host "  ✓ Generate new APP_KEY for production" -ForegroundColor White
Write-Host "  ✓ Use strong database passwords" -ForegroundColor White
Write-Host "  ✓ Configure HTTPS" -ForegroundColor White
Write-Host "  ✓ Set proper CORS_ALLOWED_ORIGINS" -ForegroundColor White
Write-Host "  ✓ Enable rate limiting" -ForegroundColor White
Write-Host "  ✓ Review logs are set to 'error' level only" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Production build completed!" -ForegroundColor Green
Write-Host "📂 Android APK: mobile\build\app\outputs\flutter-apk\" -ForegroundColor Cyan
Write-Host "📂 Web build: mobile\build\web\" -ForegroundColor Cyan

# Return to root directory
Set-Location ..
