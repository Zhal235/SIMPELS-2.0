#!/bin/bash

# Production Deployment Script for SIMPELS 2.0
# Run this script before deploying to production

echo "🚀 Preparing SIMPELS 2.0 for Production Deployment..."
echo ""

# Backend Optimization
echo "📦 Optimizing Backend..."
cd Backend

# Install production dependencies only
composer install --optimize-autoloader --no-dev --no-interaction

# Cache configurations
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Optimize application
php artisan optimize

# Run migrations (optional, uncomment if needed)
# php artisan migrate --force

echo "✅ Backend optimized!"
echo ""

# Mobile App Build
echo "📱 Building Mobile App..."
cd ../mobile

# Get dependencies
flutter pub get

# Build for Android (Release)
echo "Building Android APK..."
flutter build apk --release --split-per-abi

# Build for Web (Release)
echo "Building Web..."
flutter build web --release

echo "✅ Mobile app built!"
echo ""

# Security Reminders
echo "🔒 Security Checklist:"
echo "  ✓ Ensure APP_DEBUG=false in .env"
echo "  ✓ Ensure APP_ENV=production in .env"
echo "  ✓ Generate new APP_KEY for production"
echo "  ✓ Use strong database passwords"
echo "  ✓ Configure HTTPS"
echo "  ✓ Set proper CORS_ALLOWED_ORIGINS"
echo "  ✓ Enable rate limiting"
echo "  ✓ Review logs are set to 'error' level only"
echo ""

echo "🎉 Production build completed!"
echo "📂 Android APK: mobile/build/app/outputs/flutter-apk/"
echo "📂 Web build: mobile/build/web/"
