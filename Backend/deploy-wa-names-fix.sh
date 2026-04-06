#!/bin/bash

# SIMPELS Production Deployment - WA Gateway Names Fix
# Script ini harus dijalankan di server production setelah git pull

echo "🚀 Deploying WA Gateway santri names feature..."

# Step 1: Check if we're in the right directory
if [ ! -f "artisan" ]; then
    echo "❌ Error: artisan file not found. Make sure you're in Backend directory"
    exit 1
fi

# Step 2: Clear all caches
echo "📦 Clearing all Laravel caches..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Step 3: Run migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Step 4: Check if migration was successful
echo "🔍 Verifying wa_message_logs table..."
php artisan db:show wa_message_logs

# Step 5: Optimize for production
echo "⚡ Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Step 6: Test accessor in tinker
echo "🧪 Testing santri_names accessor..."
php artisan tinker --execute="
\$log = \App\Models\WaMessageLog::whereNotNull('phone')->first();
if (\$log) {
    echo 'Phone: ' . \$log->phone . PHP_EOL;
    echo 'Santri Names: ' . (\$log->santri_names ?? 'null') . PHP_EOL;
} else {
    echo 'No logs found in database' . PHP_EOL;
}
"

echo ""
echo "✅ Deployment completed!"
echo ""
echo "⚠️  IMPORTANT: If santri names still don't appear:"
echo "   1. Restart PHP-FPM: sudo systemctl restart php8.2-fpm"
echo "   2. Check Dokploy logs for any errors"
echo "   3. Verify API response: curl https://api-simpels.saza.sch.id/api/v1/admin/wa/logs"
echo ""
