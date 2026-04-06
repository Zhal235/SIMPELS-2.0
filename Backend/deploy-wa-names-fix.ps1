# SIMPELS Production Deployment - WA Gateway Names Fix (Windows/PowerShell)
# Script ini untuk testing di local Windows sebelum deploy production

Write-Host "🚀 Deploying WA Gateway santri names feature..." -ForegroundColor Green

# Step 1: Check if we're in the right directory
if (-not (Test-Path "artisan")) {
    Write-Host "❌ Error: artisan file not found. Make sure you're in Backend directory" -ForegroundColor Red
    exit 1
}

# Step 2: Clear all caches
Write-Host "📦 Clearing all Laravel caches..." -ForegroundColor Yellow
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Step 3: Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
php artisan migrate --force

# Step 4: Optimize for production
Write-Host "⚡ Optimizing Laravel..." -ForegroundColor Yellow
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 5: Test accessor
Write-Host "🧪 Testing santri_names accessor..." -ForegroundColor Yellow
php artisan tinker --execute="`$log = \App\Models\WaMessageLog::whereNotNull('phone')->first(); if (`$log) { echo 'Phone: ' . `$log->phone . PHP_EOL; echo 'Santri Names: ' . (`$log->santri_names ?? 'null') . PHP_EOL; } else { echo 'No logs found' . PHP_EOL; }"

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Test the API:" -ForegroundColor Yellow
Write-Host "   curl http://localhost:8000/api/v1/admin/wa/logs" -ForegroundColor Cyan
Write-Host ""
