# SIMPELS Production Deployment Script untuk Fix Excel Import Feature
# Jalankan script ini di server production setelah git pull

Write-Host "🚀 Starting SIMPELS Excel Import Feature Deployment..." -ForegroundColor Green

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
php artisan view:cache

# Step 3: Run any pending migrations
Write-Host "🗄️ Running migrations..." -ForegroundColor Yellow
php artisan migrate --force

# Step 4: Verify route registration
Write-Host "🔍 Verifying route registration..." -ForegroundColor Yellow
Write-Host "Download template route:" -ForegroundColor Cyan
php artisan route:list | Select-String "download-template"
Write-Host "Import excel route:" -ForegroundColor Cyan
php artisan route:list | Select-String "import-excel"

# Step 5: Create required directories
Write-Host "📁 Creating storage directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "storage\app\imports\wallets"
New-Item -ItemType Directory -Force -Path "storage\app\temp"

# Step 6: Test permissions
Write-Host "🔐 Checking directory permissions..." -ForegroundColor Yellow
Get-ChildItem -Path "storage\app\imports" -Recurse

Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Test download template: https://api-simpels.saza.sch.id/api/v1/wallets/download-template" -ForegroundColor White
Write-Host "2. Test import excel functionality in frontend" -ForegroundColor White
Write-Host "3. Clear browser cache if needed" -ForegroundColor White
Write-Host "4. Restart web server if needed (nginx/apache)" -ForegroundColor White