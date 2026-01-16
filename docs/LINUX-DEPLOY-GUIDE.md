# 🚀 Deploy SIMPELS-2.0 ke Linux Server Anda

Saya tidak bisa connect langsung ke server eksternal (security boundary), tapi saya buatkan **script otomatis** yang tinggal Anda jalankan di Linux. Semua process sudah automated!

---

## 📋 **Option 1: Quickest Way (Copy-Paste 1 Command)**

Di terminal Linux Anda, jalankan ini:

```bash
# Navigate to project directory
cd /path/to/simpels

# Run deploy script
bash Backend/DEPLOY-TO-LINUX.sh

# Or specify custom path
bash Backend/DEPLOY-TO-LINUX.sh /var/www/simpels
```

**That's it!** Script akan:
- ✅ Pull latest code dari git
- ✅ Install dependencies dengan composer
- ✅ Generate application key
- ✅ Cache config & routes
- ✅ Run migrations
- ✅ Seed database
- ✅ Set permissions
- ✅ Verify installation

---

## 📋 **Option 2: Manual Step-by-Step**

Jika ingin kontrol lebih, jalankan satu per satu:

```bash
# 1. SSH ke Linux server
ssh user@your-server.com

# 2. Navigate
cd /path/to/simpels/Backend

# 3. Pull code
git pull origin main

# 4. Clean composer
rm -f composer.lock
composer clear-cache

# 5. Install (ini yang fix PSR-4 issue!)
composer install --optimize-autoloader

# 6. Verify no PSR-4 errors
php artisan --version

# 7. Generate key
php artisan key:generate --force

# 8. Cache
php artisan config:cache
php artisan route:cache

# 9. Migrations
php artisan migrate --force

# 10. Seeding (optional)
php artisan db:seed --force

# 11. Permissions
chmod -R 755 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap

# 12. Verify
php artisan tinker
# exit
```

---

## ⚠️ **PRE-DEPLOYMENT CHECKLIST**

Sebelum deploy, pastikan sudah ada di Linux server:

### 1. **PHP 8.2+**
```bash
php -v
# Harus: PHP 8.2 atau lebih tinggi
```

### 2. **Composer**
```bash
composer --version
# Harus: Composer 2.x
```

### 3. **Git**
```bash
git --version
```

### 4. **MySQL/MariaDB**
```bash
mysql -u root -p
mysql> CREATE DATABASE simpels;
mysql> GRANT ALL PRIVILEGES ON simpels.* TO 'simpels_user'@'localhost' IDENTIFIED BY 'secure_password';
mysql> FLUSH PRIVILEGES;
mysql> exit
```

### 5. **Environment File**
```bash
cd /path/to/simpels/Backend

# Copy template
cp .env.example .env

# Edit untuk production
nano .env
```

---

## 📝 **.env.production Template**

Edit file `.env` di server dengan:

```dotenv
APP_NAME=SIMPELS
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:xxx           # Auto-generated oleh script
APP_URL=https://simpels.saza.sch.id

# Database - PENTING!
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=simpels
DB_USERNAME=simpels_user
DB_PASSWORD=secure_password_here

# Cache & Session - untuk production
CACHE_STORE=redis            # atau file
SESSION_DRIVER=database      # atau redis
QUEUE_CONNECTION=sync        # atau redis

# Redis (jika menggunakan)
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Filesystem
FILESYSTEM_DISK=local

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error

# Email (jika perlu)
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=app_password
MAIL_ENCRYPTION=tls
```

---

## 🔍 **Troubleshooting**

### Error: "Class not found in PSR-4"
```bash
# Solution:
composer dump-autoload --optimize
php artisan cache:clear
```

### Error: "Permission denied" in storage/
```bash
# Solution:
chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage
```

### Error: "Call to member function on null"
```bash
# Solution:
php artisan key:generate --force
php artisan config:clear
php artisan cache:clear
```

### Error: "Cannot connect to database"
```bash
# Solution:
# 1. Check database running
sudo systemctl status mysql

# 2. Test connection
mysql -u simpels_user -p -h localhost simpels

# 3. Check .env credentials
cat .env | grep DB_
```

### Error: "Cannot write to storage/"
```bash
# Solution:
chmod -R 755 storage
sudo chown -R www-data:www-data storage
```

---

## ✅ **Verification After Deploy**

Setelah script selesai, verifikasi:

```bash
cd Backend

# 1. Check artisan
php artisan --version
# Expected: Laravel Framework 12.37.0

# 2. Check env
php artisan config:show app
# Expected: env=production, debug=false

# 3. Check migrations
php artisan migrate:status
# Expected: All migrations showing [Ran]

# 4. Check tinker
php artisan tinker
> User::count()
> exit

# 5. Check logs
tail -f storage/logs/laravel.log
```

---

## 🌐 **Web Server Configuration**

### **Nginx**
```nginx
server {
    listen 443 ssl http2;
    server_name simpels.saza.sch.id;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/simpels/Backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### **Apache**
```apache
<VirtualHost *:443>
    ServerName simpels.saza.sch.id
    DocumentRoot /var/www/simpels/Backend/public

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    <Directory /var/www/simpels/Backend/public>
        AllowOverride All
        Require all granted
        
        <IfModule mod_rewrite.c>
            RewriteEngine On
            RewriteBase /
            RewriteRule ^index\.php$ - [L]
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule . /index.php [L]
        </IfModule>
    </Directory>
</VirtualHost>
```

---

## 📊 **Script Location**

Script deployment tersedia di:
- `Backend/DEPLOY-TO-LINUX.sh` - Main deployment script
- `Backend/deploy-linux.sh` - Alternative simple script
- `Backend/LINUX_DEPLOYMENT.md` - Detailed guide

---

## 🎯 **Expected Result**

Setelah deployment selesai:

```
✅ No PSR-4 warnings from composer
✅ All artisan commands working
✅ Database migrations completed
✅ Application key generated
✅ Caches working
✅ Permissions set correctly
✅ Application running on https://simpels.saza.sch.id
```

---

## 📞 **Need Help?**

Jika ada error:

1. **Copy full error message**
2. **Run dengan verbose:**
   ```bash
   php artisan migrate --force -vvv
   composer install -vvv
   ```
3. **Check logs:**
   ```bash
   tail -100 storage/logs/laravel.log
   ```

---

**Happy Deployment! 🚀**
