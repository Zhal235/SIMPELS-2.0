# 📱 Deploy Mobile PWA ke Server

Panduan lengkap deploy SIMPELS Mobile PWA ke `mobilesimpels.saza.sch.id`

## 🚀 Quick Deploy (Automated)

Jika sudah ada script:

```bash
cd /home/simpels/SIMPELS-2.0/mobile

# Option 1: Deploy to default server (saza.sch.id)
bash deploy-mobile.sh

# Option 2: Deploy dengan custom server & path
bash deploy-mobile.sh 192.168.1.100 /var/www
```

**Yang script lakukan:**
- ✅ Upload `build/web/` ke server
- ✅ Setup Nginx configuration
- ✅ Set file permissions
- ✅ Reload Nginx
- ✅ Verify SSL certificate

---

## 📋 Manual Deployment (Step-by-Step)

Jika ingin kontrol penuh atau script error:

### Step 1: Siapkan Build

```bash
cd /home/simpels/SIMPELS-2.0/mobile
flutter pub get
flutter build web --release
```

**Output:** `build/web/` folder dengan semua files

### Step 2: Upload ke Server

**Cara 1: Via SCP (secure copy)**

```bash
# Copy seluruh folder build ke server
scp -r build/web root@saza.sch.id:/var/www/html/mobilesimpels

# Atau versi cepat dengan tar
cd build/web
tar czf - . | ssh root@saza.sch.id "mkdir -p /var/www/html/mobilesimpels && cd /var/www/html/mobilesimpels && tar xzf -"
```

**Cara 2: Via Git (jika sudah di repo)**

```bash
# SSH ke server
ssh root@saza.sch.id

# Clone/pull dari git
cd /var/www/html
git clone <repo> mobile-app
cd mobile-app/mobile
flutter build web --release
```

### Step 3: Setup Nginx Configuration

Copy `nginx-mobilesimpels.conf` ke server:

```bash
scp nginx-mobilesimpels.conf root@saza.sch.id:/etc/nginx/sites-available/mobilesimpels.saza.sch.id
```

Atau manual di server:

```bash
# SSH ke server
ssh root@saza.sch.id

# Create file
sudo nano /etc/nginx/sites-available/mobilesimpels.saza.sch.id
# Paste content dari nginx-mobilesimpels.conf

# Enable site
sudo ln -sf /etc/nginx/sites-available/mobilesimpels.saza.sch.id /etc/nginx/sites-enabled/

# Test config
sudo nginx -t
```

### Step 4: Set File Permissions

```bash
ssh root@saza.sch.id << 'EOF'
sudo chmod -R 755 /var/www/html/mobilesimpels
sudo chown -R www-data:www-data /var/www/html/mobilesimpels
EOF
```

### Step 5: Reload Nginx

```bash
ssh root@saza.sch.id "sudo systemctl reload nginx"

# Verify
ssh root@saza.sch.id "sudo systemctl status nginx"
```

### Step 6: Update Cloudflare DNS

Di Cloudflare Dashboard:

1. Go to **DNS** tab
2. Click **+ Add record**
3. Fill:
   - **Type:** CNAME
   - **Name:** mobilesimpels
   - **Content:** saza.sch.id
   - **TTL:** Auto
   - **Proxy:** Automatic (orange cloud)
4. Click **Save**

Wait 1-5 minutes untuk DNS propagation.

### Step 7: Verify Deployment

```bash
# Wait DNS propagation
sleep 30

# Test connectivity
curl -I https://mobilesimpels.saza.sch.id

# Check logs
ssh root@saza.sch.id "tail -f /var/log/nginx/mobilesimpels-access.log"
```

---

## 🌐 API Configuration

Sebelum deploy, pastikan mobile app CONFIG sudah benar:

**File:** `lib/config/app_config.dart`

```dart
class AppConfig {
  // Production
  static const String apiBaseUrl = 'https://api.saza.sch.id/api';
  
  // Local development
  // static const String apiBaseUrl = 'http://localhost:8001/api';
}
```

Update jika API backend di domain berbeda.

---

## 📝 Nginx Configuration Details

File: `nginx-mobilesimpels.conf`

**Key features:**

- ✅ HTTP → HTTPS redirect
- ✅ SSL/TLS 1.2+
- ✅ Gzip compression
- ✅ Cache control untuk assets & service worker
- ✅ SPA routing (404 → index.html)
- ✅ Cache busting untuk assets

**Important:**

File berikut **TIDAK** di-cache:
- `flutter_service_worker.js` - Service worker update
- `index.html` - Biar always check latest version
- `manifest.json` - PWA manifest

File ini **DI-CACHE 1 tahun:**
- `*.js`, `*.css`, `*.png`, `*.jpg`, dll

---

## 🔍 Troubleshooting

### ❌ SSL Certificate Error

```
SSL_ERROR_RX_RECORD_TOO_LONG
```

**Solution:**
- Pastikan `mobilesimpels.saza.sch.id` di-cover oleh wildcard certificate
- Check: `ls -la /etc/letsencrypt/live/saza.sch.id/`

### ❌ 404 Not Found

```
404 Not Found
```

**Solution:**
- Nginxnya tidak find index.html
- Check: `ls -la /var/www/html/mobilesimpels/index.html`
- Check permissions: `stat /var/www/html/mobilesimpels/`

### ❌ CORS Error di Mobile App

```
Cross-Origin Request Blocked
```

**Solution:**
- API backend perlu kasih CORS header untuk `mobilesimpels.saza.sch.id`
- Update `Backend/config/cors.php`:

```php
'allowed_origins' => [
    'https://mobilesimpels.saza.sch.id',
    'https://simpels.saza.sch.id',
    // ...
],
```

- Then restart backend: `php artisan serve` atau `systemctl restart php8.x-fpm`

---

## ✅ Verification Checklist

```
☐ Build success: flutter build web --release
☐ Build files exist: ls build/web/
☐ Files uploaded to server
☐ Nginx config valid: nginx -t
☐ Nginx reloaded: systemctl reload nginx
☐ Cloudflare DNS updated (CNAME)
☐ DNS propagated: nslookup mobilesimpels.saza.sch.id
☐ HTTPS working: curl -I https://mobilesimpels.saza.sch.id
☐ App loads: Open https://mobilesimpels.saza.sch.id in browser
☐ API calls work: Try login in app
```

---

## 📊 Server Files Structure

```
/var/www/html/
├── mobilesimpels/              ← Mobile PWA (build/web)
│   ├── index.html
│   ├── main.dart.js
│   ├── flutter_service_worker.js
│   ├── manifest.json
│   └── assets/
│
├── simpels/                    ← Frontend (build/web)
│   ├── index.html
│   ├── index-*.js
│   └── assets/
│
└── Backend/                    ← Laravel API
    ├── public/
    ├── app/
    └── storage/
```

---

## 🔄 Rebuild & Redeploy

Setelah code changes:

```bash
# Local
cd mobile
flutter build web --release

# Deploy
bash deploy-mobile.sh

# Or manual
scp -r build/web/* root@saza.sch.id:/var/www/html/mobilesimpels/
ssh root@saza.sch.id "chown -R www-data:www-data /var/www/html/mobilesimpels"
```

---

## 📚 References

- [Flutter Web Deployment](https://docs.flutter.dev/deployment/web)
- [Nginx PWA Config](https://web.dev/precache-with-the-service-worker/)
- [Cloudflare DNS](https://support.cloudflare.com/hc/en-us/articles/360019093151)
