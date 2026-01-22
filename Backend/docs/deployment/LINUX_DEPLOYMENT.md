# SIMPELS-2.0 Linux Deployment Guide

## 🔴 Problem Diagnosis

Saat `composer install` di Linux, error:
```
Class App\Http\Controllers\Api\AdminBuktiTransferController 
located in ./app/Http/Controllers/API/AdminBuktiTransferController.php 
does not comply with psr-4 autoloading standard
```

## 🔍 Root Cause

**Linux filesystem case-SENSITIVE** vs Windows case-INSENSITIVE

- Windows: `API/` dan `Api/` dianggap sama folder
- Linux: `API/` dan `Api/` adalah BERBEDA

**Git Issue:**
- Folder dulunya bernama `API/` (uppercase)
- Sekarang bernama `Api/` (mixed case)
- Git di Windows tidak track perubahan casing
- Di Linux, folder `API/` masih ada di git history
- Checkout di Linux mengacau

## ✅ Solusi

### Step 1: Clean Git Tracking

```bash
cd Backend

# Remove API folder dari git tracking (jangan delete file)
git rm --cached app/Http/Controllers/API/ -r

# Pastikan hanya Api/ (correct case) yang di-track
git add app/Http/Controllers/Api/

# Commit
git commit -m "Fix PSR-4: Rename API to Api (case-sensitive)"
```

### Step 2: Fresh Deploy di Linux

```bash
# 1. Navigate
cd Backend

# 2. Clean composer
rm -f composer.lock
composer clear-cache

# 3. Fresh install
composer install --no-interaction --optimize-autoloader

# 4. Generate key
php artisan key:generate

# 5. Optimize
php artisan config:cache
php artisan route:cache
```

### Step 3: Database Setup

```bash
# 1. Create database (via MySQL/MariaDB)
mysql -u root -p
mysql> CREATE DATABASE simpels;
mysql> GRANT ALL PRIVILEGES ON simpels.* TO 'simpels_user'@'localhost' IDENTIFIED BY 'password';
mysql> FLUSH PRIVILEGES;
exit

# 2. Update .env.production
CACHE_STORE=redis
SESSION_DRIVER=database
QUEUE_CONNECTION=redis
```

### Step 4: Run Migrations

```bash
php artisan migrate --force
php artisan db:seed --force
```

---

## 📋 Linux Server Checklist

### Pre-deployment
- [x] Git history clean (API → Api fixed)
- [x] `.env.production` configured
- [x] Database created and credentials set
- [x] Redis running (if using cache/queue/session)

### Deployment Commands
```bash
#!/bin/bash
set -e

cd /var/www/simpels/backend

# Clean
rm -f composer.lock
composer clear-cache

# Install
composer install --no-interaction --optimize-autoloader --no-dev

# Generate key
php artisan key:generate

# Cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Database
php artisan migrate --force

# Permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

echo "✅ Deployment complete"
```

### Post-deployment
```bash
# Check status
php artisan tinker
> exit

# Check web
curl http://localhost:8000

# Check logs
tail -f storage/logs/laravel.log
```

---

## 🔧 Troubleshooting Linux Deployment

### Error 1: "Class not found in PSR-4"
**Solution:**
```bash
composer dump-autoload --optimize
php artisan cache:clear
```

### Error 2: "Permission denied" in storage/
**Solution:**
```bash
chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage
```

### Error 3: "Call to member function on null"
**Solution:**
```bash
# Ensure .env is correctly loaded
php artisan config:show app

# Regenerate key
php artisan key:generate

# Clear cache
php artisan config:clear
```

### Error 4: Database connection failed
**Solution:**
```bash
# Check .env production settings
cat .env

# Test connection
php artisan db:ping

# If using socket
DB_UNIX_SOCKET=/var/run/mysqld/mysqld.sock
```

---

## 📊 .env.production Template

```dotenv
APP_NAME=SIMPELS
APP_ENV=production
APP_DEBUG=false
APP_URL=https://simpels.saza.sch.id
APP_KEY=base64:[YOUR_KEY_HERE]

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=simpels
DB_USERNAME=simpels_user
DB_PASSWORD=your_secure_password

SESSION_DRIVER=database
CACHE_STORE=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

FILESYSTEM_DISK=local
LOG_LEVEL=error

MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
```

---

## 🚀 Full Deployment Script

```bash
#!/bin/bash
# deploy.sh - Complete deployment script for SIMPELS-2.0

set -e
DEPLOY_PATH="/var/www/simpels"
BACKEND_PATH="$DEPLOY_PATH/backend"

echo "========================================"
echo "SIMPELS-2.0 Linux Deployment"
echo "========================================"

# Pull latest code
echo "[1/10] Pulling latest code..."
cd $BACKEND_PATH
git pull origin main

# Clean composer
echo "[2/10] Cleaning composer..."
rm -f composer.lock
composer clear-cache

# Install dependencies
echo "[3/10] Installing dependencies..."
composer install --no-interaction --optimize-autoloader --no-dev

# Generate key (if needed)
echo "[4/10] Ensuring application key..."
if ! grep -q "APP_KEY=base64:" .env; then
    php artisan key:generate --force
fi

# Run migrations
echo "[5/10] Running migrations..."
php artisan migrate --force

# Seed database (optional)
echo "[6/10] Seeding database..."
php artisan db:seed --force

# Cache optimization
echo "[7/10] Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
echo "[8/10] Setting permissions..."
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache public

# Clear old caches
echo "[9/10] Clearing caches..."
php artisan cache:clear
php artisan event:clear

# Final verification
echo "[10/10] Running verification..."
php artisan tinker <<< "exit" > /dev/null 2>&1

echo ""
echo "========================================"
echo "✅ Deployment successful!"
echo "========================================"
echo ""
echo "Application URL: https://simpels.saza.sch.id"
echo "Logs: tail -f $BACKEND_PATH/storage/logs/laravel.log"
```

---

## 📝 Git Fix for Case Sensitivity

Jika masalah casing masih ada di git:

```bash
# 1. Remove API folder dari git (jangan delete files)
git rm --cached app/Http/Controllers/API/ -r --force

# 2. Add Api folder (correct case)
git add app/Http/Controllers/Api/

# 3. Commit
git commit -m "fix: Rename API → Api for case-sensitive Linux"

# 4. Push
git push origin main

# 5. Update remote tracking
git fetch --prune origin
```

---

## ✅ Verification Checklist

Before declaring deployment successful:

- [ ] `composer install` runs without errors
- [ ] `php artisan --version` works
- [ ] `php artisan migrate:status` shows all migrations
- [ ] Database is populated with seeders
- [ ] Web server can serve static files
- [ ] API endpoints responding
- [ ] Logs are being written correctly
- [ ] Cron jobs running (if configured)

---

## 🔗 Quick Links

- **Linux Setup Guide:** See `README.md`
- **Docker Deployment:** See `docker-compose.yml`
- **Production Security:** See `PRODUCTION-SECURITY-CHECKLIST.md`

---

**Last Updated:** January 15, 2026  
**Status:** Ready for Linux Production Deployment
