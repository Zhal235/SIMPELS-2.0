# Spesifikasi Server untuk SIMPELS 2.0

## Ringkasan Aplikasi

SIMPELS 2.0 adalah sistem manajemen pesantren berbasis web yang terdiri dari:
- **Backend**: Laravel 12 (PHP 8.2)
- **Frontend**: React 19 + TypeScript + Vite
- **Database**: SQLite (development) / MySQL/PostgreSQL (production)
- **Fitur Utama**: Manajemen santri, keuangan, kelas, asrama, dan tahun ajaran

---

## 1. Spesifikasi Server untuk Lingkungan Development

### Minimum Requirements
```
Processor: 2 vCPU / 2 Core
RAM: 4 GB
Storage: 20 GB SSD
OS: Ubuntu 22.04 LTS / Windows 10+ / macOS 12+
```

### Software Requirements
- **PHP**: 8.2 atau lebih tinggi
- **Node.js**: 18.x atau lebih tinggi
- **Composer**: 2.x
- **npm/pnpm**: versi terbaru
- **Database**: SQLite (default) atau MySQL 8.0+ / PostgreSQL 14+
- **Web Server**: PHP Built-in Server (development)
- **Git**: versi terbaru

### PHP Extensions yang Dibutuhkan
```
- php8.2-cli
- php8.2-common
- php8.2-curl
- php8.2-mbstring
- php8.2-xml
- php8.2-zip
- php8.2-sqlite3 (untuk SQLite)
- php8.2-mysql (jika menggunakan MySQL)
- php8.2-pgsql (jika menggunakan PostgreSQL)
- php8.2-gd (untuk image processing via Intervention/Image)
- php8.2-intl
- php8.2-bcmath
- php8.2-fileinfo
```

---

## 2. Spesifikasi Server untuk Lingkungan Production

### A. Small Scale (1-500 Santri)

#### Spesifikasi Hardware
```
Processor: 2 vCPU (Intel Xeon atau AMD EPYC)
RAM: 4-8 GB
Storage: 50 GB SSD
Bandwidth: 100 Mbps
```

#### Spesifikasi Software
- **OS**: Ubuntu 22.04 LTS Server (recommended)
- **Web Server**: Nginx 1.24+ atau Apache 2.4+
- **PHP**: 8.2 dengan PHP-FPM
- **Database**: MySQL 8.0+ atau PostgreSQL 15+
- **Cache**: Redis 7.x (optional tapi disarankan)
- **Process Manager**: Supervisor (untuk queue workers)
- **SSL/TLS**: Certbot (Let's Encrypt) untuk HTTPS

#### Konfigurasi PHP-FPM
```ini
pm = dynamic
pm.max_children = 20
pm.start_servers = 4
pm.min_spare_servers = 2
pm.max_spare_servers = 8
pm.max_requests = 500
```

---

### B. Medium Scale (500-2000 Santri)

#### Spesifikasi Hardware
```
Processor: 4 vCPU (Intel Xeon atau AMD EPYC)
RAM: 16 GB
Storage: 100 GB SSD
Bandwidth: 500 Mbps
```

#### Spesifikasi Software
Sama dengan Small Scale, dengan tambahan:
- **Load Balancer**: Nginx (sebagai reverse proxy)
- **Cache**: Redis 7.x (wajib)
- **Queue**: Redis atau Database dengan dedicated worker
- **Session Storage**: Redis (untuk session management)
- **CDN**: Cloudflare atau sejenisnya (recommended)

#### Konfigurasi PHP-FPM
```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
```

#### Konfigurasi Database
```ini
# MySQL Configuration
max_connections = 200
innodb_buffer_pool_size = 8G
innodb_log_file_size = 512M
query_cache_size = 128M
```

---

### C. Large Scale (2000+ Santri)

#### Spesifikasi Hardware (Multi-Server Setup)

**Application Server (2 server dengan load balancer)**
```
Processor: 8 vCPU per server
RAM: 32 GB per server
Storage: 200 GB SSD per server
Bandwidth: 1 Gbps
```

**Database Server (Dedicated)**
```
Processor: 8 vCPU
RAM: 64 GB
Storage: 500 GB SSD (dengan RAID 10)
Bandwidth: 1 Gbps
```

**Cache Server (Dedicated Redis)**
```
Processor: 4 vCPU
RAM: 16 GB
Storage: 50 GB SSD
Bandwidth: 1 Gbps
```

#### Arsitektur Deployment
```
                   ┌─────────────┐
                   │Load Balancer│
                   │  (Nginx)    │
                   └──────┬──────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
    │  App    │      │  App    │     │  App    │
    │Server 1 │      │Server 2 │     │Server N │
    └────┬────┘      └────┬────┘     └────┬────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
    │Database │      │  Redis  │     │  File   │
    │ Server  │      │  Cache  │     │ Storage │
    └─────────┘      └─────────┘     └─────────┘
```

---

## 3. Konfigurasi Web Server

### A. Nginx Configuration (Recommended)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name simpels.example.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name simpels.example.com;
    root /var/www/simpels/Backend/public;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/simpels.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/simpels.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    index index.php;
    charset utf-8;

    # Laravel Frontend Routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Serve static frontend assets
    location /frontend {
        alias /var/www/simpels/frontend/dist;
        try_files $uri $uri/ /frontend/index.html;
    }

    # PHP Processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to hidden files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Logging
    access_log /var/log/nginx/simpels-access.log;
    error_log /var/log/nginx/simpels-error.log;

    # Client upload size
    client_max_body_size 20M;
}
```

### B. Apache Configuration (Alternative)

```apache
<VirtualHost *:80>
    ServerName simpels.example.com
    Redirect permanent / https://simpels.example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName simpels.example.com
    DocumentRoot /var/www/simpels/Backend/public

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/simpels.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/simpels.example.com/privkey.pem

    <Directory /var/www/simpels/Backend/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Security Headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"

    ErrorLog ${APACHE_LOG_DIR}/simpels-error.log
    CustomLog ${APACHE_LOG_DIR}/simpels-access.log combined
</VirtualHost>
```

---

## 4. Database Requirements

### MySQL Configuration (Recommended for Production)

#### Minimum Database Specs
```
MySQL: 8.0+
Storage Engine: InnoDB
Character Set: utf8mb4
Collation: utf8mb4_unicode_ci
```

#### Estimated Storage Requirements
```
- Small Scale (1-500 santri): 1-5 GB
- Medium Scale (500-2000 santri): 5-20 GB
- Large Scale (2000+ santri): 20-100 GB
```

#### MySQL my.cnf Optimization
```ini
[mysqld]
# General
max_connections = 200
max_allowed_packet = 64M

# InnoDB Settings
innodb_buffer_pool_size = 8G  # 50-70% dari total RAM
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Query Cache (untuk MySQL 5.7)
# Note: Dihapus di MySQL 8.0+
# query_cache_type = 1
# query_cache_size = 128M

# Temp Tables
tmp_table_size = 64M
max_heap_table_size = 64M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2
```

### PostgreSQL (Alternative)

```ini
# postgresql.conf
max_connections = 200
shared_buffers = 8GB
effective_cache_size = 24GB
maintenance_work_mem = 2GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 20971kB
min_wal_size = 1GB
max_wal_size = 4GB
```

---

## 5. Queue & Background Job Configuration

### Supervisor Configuration

Buat file `/etc/supervisor/conf.d/simpels-worker.conf`:

```ini
[program:simpels-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/simpels/Backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/simpels/Backend/storage/logs/worker.log
stopwaitsecs=3600
```

Jalankan:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start simpels-worker:*
```

---

## 6. Caching & Session Management

### Redis Configuration

#### Install Redis
```bash
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### Redis Configuration `/etc/redis/redis.conf`
```conf
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

#### Laravel .env Configuration
```env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

---

## 7. Backup & Recovery Strategy

### Database Backup

#### Automated MySQL Backup Script
```bash
#!/bin/bash
# /usr/local/bin/backup-simpels-db.sh

BACKUP_DIR="/var/backups/simpels"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="simpels"
DB_USER="simpels_user"
DB_PASS="your_password"

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/simpels_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "simpels_*.sql.gz" -mtime +30 -delete

echo "Backup completed: simpels_$DATE.sql.gz"
```

#### Cron Job untuk Backup Otomatis
```bash
# Edit crontab
sudo crontab -e

# Backup setiap hari jam 2 pagi
0 2 * * * /usr/local/bin/backup-simpels-db.sh
```

### File Storage Backup
```bash
# Backup storage directory
tar -czf /var/backups/simpels/storage_$(date +%Y%m%d).tar.gz \
  /var/www/simpels/Backend/storage/app
```

---

## 8. Security Recommendations

### Firewall Configuration (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### PHP Security Settings (php.ini)
```ini
expose_php = Off
display_errors = Off
log_errors = On
error_log = /var/log/php/error.log
upload_max_filesize = 20M
post_max_size = 20M
max_execution_time = 30
memory_limit = 256M
disable_functions = exec,passthru,shell_exec,system,proc_open,popen
```

### Laravel Security Checklist
- ✅ Set `APP_ENV=production` di .env
- ✅ Set `APP_DEBUG=false` di .env
- ✅ Generate strong `APP_KEY`
- ✅ Set `SESSION_SECURE_COOKIE=true` untuk HTTPS
- ✅ Aktifkan HTTPS di seluruh aplikasi
- ✅ Update dependencies secara berkala
- ✅ Implementasi rate limiting untuk API
- ✅ Validasi semua input pengguna
- ✅ Gunakan prepared statements untuk query
- ✅ Set proper file permissions (755 untuk direktori, 644 untuk file)

### File Permissions
```bash
cd /var/www/simpels/Backend
sudo chown -R www-data:www-data .
sudo find . -type f -exec chmod 644 {} \;
sudo find . -type d -exec chmod 755 {} \;
sudo chmod -R 775 storage bootstrap/cache
```

---

## 9. Monitoring & Performance

### Recommended Monitoring Tools
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Application Performance**: New Relic, Datadog, Laravel Telescope
- **Server Monitoring**: Netdata, Prometheus + Grafana
- **Log Management**: ELK Stack, Papertrail, LogDNA
- **Error Tracking**: Sentry, Bugsnag, Rollbar

### Performance Optimization
```bash
# Laravel Optimization Commands
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Enable OPcache in php.ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### Database Indexing
Pastikan tabel-tabel penting memiliki index yang tepat:
```sql
-- Index untuk performa query
CREATE INDEX idx_santri_status ON santri(status);
CREATE INDEX idx_pembayaran_santri ON pembayaran(santri_id);
CREATE INDEX idx_tagihan_santri ON tagihan_santri(santri_id);
CREATE INDEX idx_kelas_santri ON santri(kelas_id);
```

---

## 10. Rekomendasi Hosting Provider

### A. Cloud VPS (Recommended)
- **DigitalOcean**: Droplets mulai dari $6/bulan (1GB RAM)
- **Vultr**: VPS mulai dari $6/bulan
- **Linode**: VPS mulai dari $5/bulan
- **AWS Lightsail**: VPS mulai dari $5/bulan
- **Google Cloud Platform**: Free tier tersedia

### B. Shared Hosting Indonesia (Budget Friendly)
- **Niagahoster**: Support PHP 8.2, MySQL, SSL gratis
- **IDCloudHost**: Support Laravel, MySQL, SSD
- **Dewaweb**: Support Laravel, PHP 8.2, gratis SSL
- **Rumahweb**: Support PHP 8.2, MySQL 8.0

### C. Dedicated Server (Large Scale)
- **BiznetGio**: Bare Metal Server Indonesia
- **AWS EC2**: Flexible, scalable
- **Google Compute Engine**: High performance
- **Azure Virtual Machines**: Enterprise grade

---

## 11. Estimasi Biaya Operasional Bulanan

### Small Scale (1-500 Santri)
```
VPS Server: $10-20/bulan
Domain + SSL: $15/tahun ($1.25/bulan)
Backup Storage: $5/bulan (optional)
CDN: Gratis (Cloudflare free tier)
Total: ~$16-26/bulan
```

### Medium Scale (500-2000 Santri)
```
VPS Server: $40-80/bulan
Domain + SSL: $15/tahun ($1.25/bulan)
Backup Storage: $10/bulan
CDN: $10/bulan
Monitoring: $10/bulan
Total: ~$71-111/bulan
```

### Large Scale (2000+ Santri)
```
App Servers (2x): $150/bulan
Database Server: $100/bulan
Cache Server: $50/bulan
Load Balancer: $20/bulan
Domain + SSL: $15/tahun ($1.25/bulan)
Backup Storage: $30/bulan
CDN: $30/bulan
Monitoring: $50/bulan
Total: ~$431/bulan
```

---

## 12. Deployment Checklist

### Pre-Deployment
- [ ] Backup database dan files
- [ ] Test aplikasi di staging environment
- [ ] Update dependencies (`composer update`, `npm update`)
- [ ] Run security audit (`composer audit`)
- [ ] Test migrations dan seeders
- [ ] Verify .env configuration

### Deployment Steps
- [ ] Pull latest code dari repository
- [ ] Install dependencies: `composer install --no-dev --optimize-autoloader`
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Run migrations: `php artisan migrate --force`
- [ ] Clear dan cache config: `php artisan config:cache`
- [ ] Cache routes: `php artisan route:cache`
- [ ] Cache views: `php artisan view:cache`
- [ ] Optimize autoloader: `php artisan optimize`
- [ ] Restart queue workers: `sudo supervisorctl restart simpels-worker:*`
- [ ] Restart PHP-FPM: `sudo systemctl restart php8.2-fpm`
- [ ] Clear application cache: `php artisan cache:clear`

### Post-Deployment
- [ ] Test critical features
- [ ] Monitor error logs
- [ ] Check application performance
- [ ] Verify backup completion
- [ ] Update documentation

---

## 13. Troubleshooting Common Issues

### Issue: 500 Internal Server Error
```bash
# Check Laravel logs
tail -f /var/www/simpels/Backend/storage/logs/laravel.log

# Check PHP-FPM logs
tail -f /var/log/php8.2-fpm.log

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

### Issue: Storage Permission Denied
```bash
cd /var/www/simpels/Backend
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache
```

### Issue: Queue Not Processing
```bash
# Check supervisor status
sudo supervisorctl status simpels-worker:*

# Restart workers
sudo supervisorctl restart simpels-worker:*

# Check queue jobs
php artisan queue:work --once
```

### Issue: Slow Performance
```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Then rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 14. Kontak & Support

Untuk pertanyaan teknis atau support, hubungi:
- **Repository**: https://github.com/Zhal235/SIMPELS-2.0
- **Issues**: https://github.com/Zhal235/SIMPELS-2.0/issues

---

## Revisi Terakhir
Dokumen ini terakhir diperbarui: November 2025
Versi Aplikasi: SIMPELS 2.0
Versi Dokumen: 1.0
