# Deploy SIMPELS to Synology DSM
# Run dari Windows, upload via SSH/SFTP

$DSM_IP = "192.168.1.100"  # Ganti dengan IP DSM
$DSM_USER = "admin"         # Ganti dengan user DSM
$DSM_PATH = "/volume1/web/simpels"

Write-Host "🚀 Deploying SIMPELS to DSM ($DSM_IP)..." -ForegroundColor Green

# 1. Build frontend
Write-Host "`n📦 Building frontend..." -ForegroundColor Yellow
cd frontend
npm install
npm run build
cd ..

# 2. Optimize backend
Write-Host "`n⚙️  Optimizing backend..." -ForegroundColor Yellow
cd Backend
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
php artisan view:cache
cd ..

# 3. Create deployment package
Write-Host "`n📦 Creating deployment package..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$packageName = "simpels-$timestamp.zip"

Compress-Archive -Path @(
    "Backend\*",
    "frontend\dist"
) -DestinationPath $packageName -Force

Write-Host "`n✅ Package created: $packageName" -ForegroundColor Green

# 4. Upload to DSM (requires pscp/scp)
Write-Host "`n📤 Upload package to DSM..." -ForegroundColor Yellow
Write-Host "Run this command to upload:" -ForegroundColor Cyan
Write-Host "scp $packageName ${DSM_USER}@${DSM_IP}:/volume1/web/" -ForegroundColor White

Write-Host "`n🔧 After upload, SSH to DSM and run:" -ForegroundColor Cyan
Write-Host "cd /volume1/web/" -ForegroundColor White
Write-Host "unzip $packageName -d simpels" -ForegroundColor White
Write-Host "cd simpels/Backend" -ForegroundColor White
Write-Host "php artisan migrate --force" -ForegroundColor White
Write-Host "chmod -R 775 storage bootstrap/cache" -ForegroundColor White

Write-Host "`n✨ Deployment package ready!" -ForegroundColor Green
