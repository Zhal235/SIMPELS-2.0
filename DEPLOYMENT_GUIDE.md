# SIMPELS 2.0 - Quick Deployment Guide

## Quick Reference: Server Requirements

### Development Environment
```yaml
CPU: 2 cores
RAM: 4 GB
Storage: 20 GB SSD
OS: Ubuntu 22.04 LTS / Windows 10+ / macOS 12+
PHP: 8.2+
Node.js: 18+
Database: SQLite (default) / MySQL 8.0+ / PostgreSQL 14+
```

### Production Environment

#### Small Scale (1-500 Students)
```yaml
CPU: 2 vCPU
RAM: 4-8 GB
Storage: 50 GB SSD
Bandwidth: 100 Mbps
PHP: 8.2 with FPM
Database: MySQL 8.0+ / PostgreSQL 15+
Web Server: Nginx 1.24+ / Apache 2.4+
Cache: Redis 7.x (optional)
```

#### Medium Scale (500-2000 Students)
```yaml
CPU: 4 vCPU
RAM: 16 GB
Storage: 100 GB SSD
Bandwidth: 500 Mbps
PHP: 8.2 with FPM
Database: MySQL 8.0+ / PostgreSQL 15+
Web Server: Nginx 1.24+
Cache: Redis 7.x (required)
CDN: Cloudflare (recommended)
```

#### Large Scale (2000+ Students)
```yaml
Multi-Server Setup:
- App Servers: 2+ servers (8 vCPU, 32 GB RAM each)
- Database Server: 1 dedicated (8 vCPU, 64 GB RAM, RAID 10)
- Cache Server: 1 dedicated Redis (4 vCPU, 16 GB RAM)
- Load Balancer: Nginx
- CDN: Required
```

---

## Installation Steps (Ubuntu 22.04 LTS)

### 1. System Update & Basic Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip software-properties-common
```

### 2. Install PHP 8.2
```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common \
  php8.2-curl php8.2-mbstring php8.2-xml php8.2-zip \
  php8.2-mysql php8.2-sqlite3 php8.2-gd php8.2-intl \
  php8.2-bcmath php8.2-fileinfo php8.2-redis
```

### 3. Install Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer
```

### 4. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 5. Install MySQL 8.0
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

Create database and user:
```sql
CREATE DATABASE simpels CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'simpels_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON simpels.* TO 'simpels_user'@'localhost';
FLUSH PRIVILEGES;
```

### 6. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 7. Install Redis (Optional but Recommended)
```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### 8. Install Supervisor (for Queue Workers)
```bash
sudo apt install -y supervisor
sudo systemctl enable supervisor
sudo systemctl start supervisor
```

---

## Application Deployment

### 1. Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/Zhal235/SIMPELS-2.0.git simpels
sudo chown -R www-data:www-data simpels
cd simpels
```

### 2. Backend Setup
```bash
cd Backend

# Install dependencies
composer install --no-dev --optimize-autoloader

# Setup environment
cp .env.example .env
nano .env  # Edit database credentials and other settings

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Optional: Seed initial data
php artisan db:seed

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Set permissions
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Build for production
npm run build

# Frontend build will be in frontend/dist/
```

### 4. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/simpels
```

Paste the Nginx configuration from SERVER_SPECIFICATIONS.md, then:
```bash
sudo ln -s /etc/nginx/sites-available/simpels /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 6. Setup Supervisor for Queue Workers
```bash
sudo nano /etc/supervisor/conf.d/simpels-worker.conf
```

Paste the Supervisor configuration from SERVER_SPECIFICATIONS.md, then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start simpels-worker:*
```

---

## Environment Configuration (.env)

### Production Settings
```env
APP_NAME="SIMPELS 2.0"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=simpels
DB_USERNAME=simpels_user
DB_PASSWORD=your_secure_password

# Cache & Session (with Redis)
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail Configuration (configure as needed)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com

# Security
SESSION_SECURE_COOKIE=true
SESSION_LIFETIME=120
```

---

## Backup Strategy

### Automated Daily Backup Script
Create `/usr/local/bin/backup-simpels.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/simpels"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u simpels_user -p'your_password' simpels | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup storage files
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz \
  /var/www/simpels/Backend/storage/app

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "storage_*.tar.gz" -mtime +30 -delete
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/backup-simpels.sh
sudo crontab -e
```

Add line:
```
0 2 * * * /usr/local/bin/backup-simpels.sh
```

---

## Maintenance Commands

### Update Application
```bash
cd /var/www/simpels

# Pull latest changes
sudo -u www-data git pull origin main

# Backend updates
cd Backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Frontend updates
cd ../frontend
npm install
npm run build

# Restart services
sudo supervisorctl restart simpels-worker:*
sudo systemctl restart php8.2-fpm
```

### Clear Application Cache
```bash
cd /var/www/simpels/Backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
redis-cli FLUSHALL  # If using Redis
```

### Monitor Logs
```bash
# Laravel logs
tail -f /var/www/simpels/Backend/storage/logs/laravel.log

# Nginx logs
tail -f /var/log/nginx/simpels-error.log

# PHP-FPM logs
tail -f /var/log/php8.2-fpm.log

# Queue worker logs
tail -f /var/www/simpels/Backend/storage/logs/worker.log
```

---

## Security Hardening

### 1. Firewall Configuration
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Secure SSH
Edit `/etc/ssh/sshd_config`:
```conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Change default port (optional)
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 3. Install Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Regular Updates
```bash
# Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Performance Optimization

### 1. Enable OPcache
Edit `/etc/php/8.2/fpm/php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
opcache.validate_timestamps=0  # In production
```

### 2. PHP-FPM Optimization
Edit `/etc/php/8.2/fpm/pool.d/www.conf`:
```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
```

Restart PHP-FPM:
```bash
sudo systemctl restart php8.2-fpm
```

### 3. MySQL Optimization
Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 4G  # Adjust based on RAM
innodb_log_file_size = 512M
tmp_table_size = 64M
max_heap_table_size = 64M
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

---

## Monitoring Setup

### 1. Install Netdata (System Monitoring)
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Access at: http://your-server-ip:19999

### 2. Laravel Telescope (Application Monitoring)
```bash
cd /var/www/simpels/Backend
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

Access at: https://your-domain.com/telescope

### 3. Setup Log Rotation
Create `/etc/logrotate.d/simpels`:
```
/var/www/simpels/Backend/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

## Troubleshooting

### Problem: 502 Bad Gateway
**Solution:**
```bash
sudo systemctl status php8.2-fpm
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

### Problem: Database Connection Error
**Solution:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u simpels_user -p simpels

# Check .env file credentials
nano /var/www/simpels/Backend/.env
```

### Problem: Queue Not Processing
**Solution:**
```bash
# Check supervisor status
sudo supervisorctl status

# Restart workers
sudo supervisorctl restart simpels-worker:*

# Check worker logs
tail -f /var/www/simpels/Backend/storage/logs/worker.log
```

### Problem: Permission Denied Errors
**Solution:**
```bash
cd /var/www/simpels/Backend
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod -R 775 storage bootstrap/cache
```

---

## Health Check Commands

```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status mysql
sudo systemctl status redis-server
sudo systemctl status supervisor

# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check network connections
netstat -tuln | grep LISTEN

# Check Laravel application status
cd /var/www/simpels/Backend
php artisan about
```

---

## Support & Resources

- **Documentation**: See SERVER_SPECIFICATIONS.md for detailed specifications
- **Repository**: https://github.com/Zhal235/SIMPELS-2.0
- **Laravel Documentation**: https://laravel.com/docs/12.x
- **React Documentation**: https://react.dev

---

Last Updated: November 2025
Version: 1.0
