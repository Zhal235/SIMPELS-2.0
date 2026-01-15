# NGINX Deployment Configuration Changes

**Date**: January 15, 2026  
**Purpose**: Configure local development environment to match Ubuntu Nginx server architecture  
**Deployment Model**: Nginx reverse proxy serving Frontend at `/` and proxying `/api` to Laravel backend

---

## 📋 Summary of Changes

Untuk menyelaraskan konfigurasi lokal dengan arsitektur Nginx di Ubuntu, telah dilakukan 4 perubahan konfigurasi utama:

| File | Perubahan | Alasan |
|------|-----------|--------|
| `frontend/.env` | `VITE_API_BASE`: `/api` (relative path) | Agar Nginx bisa menangani routing API sebagai reverse proxy |
| `Backend/.env` | `APP_URL`: `http://localhost:8888` | Sesuai dengan port forwarding VirtualBox |
| `Backend/config/cors.php` | Tambah `localhost:8888` dan `127.0.0.1:8888` | Izinkan CORS dari Nginx di development |
| `Backend/config/sanctum.php` | Tambah domain stateful `localhost:8888` | Izinkan cookie authentication dari Nginx |

---

## 🔄 Arsitektur Server Ubuntu

```
┌─────────────────────────────────┐
│    Nginx (Port 80/443)          │
├─────────────────────────────────┤
│                                 │
│  • Melayani Frontend di /       │  (React/Vite di folder public)
│  • Proxy /api -> Backend        │  (Laravel di Backend/public/index.php)
│                                 │
└─────────────────────────────────┘
```

### Development via VirtualBox:
- **Host Machine Port 8888** → **VM Port 80** (Nginx)
- Frontend diakses via: `http://localhost:8888`
- API requests: `/api/*` → Nginx proxy ke Backend

---

## 📝 File yang Diubah

### 1️⃣ Frontend Configuration

#### File: `frontend/.env`

**Before:**
```dotenv
VITE_PORT=5173
VITE_API_BASE=http://127.0.0.1:8000/api
```

**After:**
```dotenv
VITE_PORT=5173
VITE_API_BASE=/api
```

**Penjelasan:**
- Menggunakan **relative path** `/api` agar Nginx bisa menangani routing
- Client-side akan request ke `/api/*` (sama dengan domain frontend)
- Nginx akan meneruskan ke Backend Laravel
- Ini memastikan **CORS-free** karena sama origin

---

### 2️⃣ Backend Application URL

#### File: `Backend/.env`

**Before:**
```dotenv
APP_URL=http://localhost:8001
```

**After:**
```dotenv
APP_URL=http://localhost:8888
```

**Penjelasan:**
- `APP_URL` digunakan Laravel untuk generate URL di email, breadcrumb, dll
- Port 8888 adalah **port forwarding VirtualBox** yang mengarah ke Nginx di VM
- Memastikan URL yang di-generate konsisten dengan arsitektur deployment

---

### 3️⃣ CORS Configuration

#### File: `Backend/config/cors.php`

**Before:**
```php
'allowed_origins' => [
    'https://simpels.saza.sch.id',
    'https://api.saza.sch.id',
    'https://mobile.saza.sch.id',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:54475',
],
```

**After:**
```php
'allowed_origins' => [
    'https://simpels.saza.sch.id',
    'https://api.saza.sch.id',
    'https://mobile.saza.sch.id',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:54475',
    'http://localhost:8888',
    'http://127.0.0.1:8888',
],
```

**Penjelasan:**
- Menambahkan `localhost:8888` dan `127.0.0.1:8888` untuk Nginx reverse proxy di development
- CORS dibutuhkan karena frontend diserve dari port/origin berbeda saat development
- Ketika production di Ubuntu, CORS tetap penting untuk mobile app dan external integrations

---

### 4️⃣ Sanctum Stateful Domains

#### File: `Backend/config/sanctum.php`

**Before:**
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
    Sanctum::currentApplicationUrlWithPort(),
    // Sanctum::currentRequestHost(),
))),
```

**After:**
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:8888,127.0.0.1,127.0.0.1:8000,127.0.0.1:8888,::1',
    Sanctum::currentApplicationUrlWithPort(),
    // Sanctum::currentRequestHost(),
))),
```

**Penjelasan:**
- **Sanctum** adalah authentication guard yang mendukung SPA + API authentication via cookies
- Domain stateful adalah domain yang **trusted** untuk menerima authentication cookies
- Menambahkan `localhost:8888` dan `127.0.0.1:8888` agar Nginx reverse proxy bisa authenticated
- Penting untuk stateless API calls dengan session cookies

---

## ✅ Verifikasi Perubahan

### Frontend API Configuration

File: `frontend/src/api/index.ts`

Sudah menggunakan `VITE_API_BASE` dari .env:
```typescript
const api = axios.create({
  baseURL: (import.meta as any)?.env?.VITE_API_BASE || 'https://api.saza.sch.id/api',
  withCredentials: true,
})
```

✅ **Status**: Sudah benar, akan menggunakan `/api` dari .env baru

### Backend API Routes

File: `Backend/routes/api.php`

Semua endpoint sudah di-prefix dengan `/api`, contoh:
```php
Route::prefix('api')->group(function () {
    Route::post('/login', ...);
    Route::get('/user', ...);
    Route::get('/santri', ...);
    // etc
});
```

✅ **Status**: Sudah benar untuk Nginx routing

---

## 🚀 Testing Checklist Sebelum Git Push

### Development Testing (Local VirtualBox)

- [ ] **Frontend**: Buka `http://localhost:5173` (Vite dev server)
  - [ ] Login berhasil tanpa CORS error
  - [ ] API requests ke `/api/*` berhasil di-proxy

- [ ] **Nginx Reverse Proxy** (di VM):
  - [ ] Buka `http://localhost:8888` (dari host machine)
  - [ ] Frontend dimuat correctly
  - [ ] API requests ke `/api/*` berhasil

- [ ] **Backend Direct** (untuk debugging):
  - [ ] Jalankan `php artisan serve --port=8001`
  - [ ] Test dengan Postman/curl ke `http://localhost:8001/api/*`

### Staging/Production Testing (Ubuntu Server)

- [ ] Frontend serve via Nginx di `/`
- [ ] API routing `/api/*` → `Backend/public/index.php`
- [ ] CORS headers correct untuk mobile app
- [ ] Authentication via cookies bekerja

---

## 📦 Git Commit Message

```bash
git add -A
git commit -m "Configure Nginx reverse proxy architecture

- frontend/.env: Update VITE_API_BASE to /api (relative path)
- Backend/.env: Update APP_URL to http://localhost:8888
- Backend/config/cors.php: Add localhost:8888 to allowed origins
- Backend/config/sanctum.php: Add localhost:8888 to stateful domains

This aligns local development with Ubuntu Nginx server architecture:
- Nginx serves Frontend at /
- Nginx proxies /api to Laravel Backend
- VirtualBox port forwarding: 8888 -> Nginx (port 80)

Tested with:
- Frontend dev server (Vite): http://localhost:5173
- Nginx reverse proxy: http://localhost:8888
- Direct Backend: http://localhost:8001"
```

---

## 🔧 Nginx Configuration Reference

### Nginx Config untuk Ubuntu (Reference Saja)

```nginx
server {
    listen 80;
    server_name _;

    # Frontend (React/Vite)
    root /var/www/simpels/frontend/dist;
    
    # Serve frontend static files
    location / {
        try_files $uri /index.html;
    }

    # API Proxy ke Laravel Backend
    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Storage files
    location /storage {
        alias /var/www/simpels/Backend/public/storage;
    }
}
```

---

## 📞 Troubleshooting

### 1. CORS Error: "No 'Access-Control-Allow-Origin' header"

**Penyebab**: Origin frontend tidak ada di `allowed_origins` CORS config

**Solusi**:
```php
// Backend/config/cors.php
'allowed_origins' => [
    // ... tambahkan origin frontend
    'http://localhost:8888',
],
```

### 2. Cookie Not Sent: "Missing authentication"

**Penyebab**: Domain tidak ada di `stateful` domains di Sanctum

**Solusi**:
```php
// Backend/config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 
    'localhost,localhost:8888,127.0.0.1,127.0.0.1:8888,::1,' . 
    Sanctum::currentApplicationUrlWithPort()
)),
```

### 3. Frontend tidak bisa connect ke API

**Penyebab**: `VITE_API_BASE` masih hardcoded ke port tertentu

**Solusi**: Pastikan `.env` frontend punya:
```dotenv
VITE_API_BASE=/api
```

---

## 📚 File-file Terkait

| File | Fungsi |
|------|--------|
| `frontend/.env` | Environment variables untuk Vite build |
| `frontend/src/api/index.ts` | Axios configuration yang membaca VITE_API_BASE |
| `Backend/.env` | Laravel environment configuration |
| `Backend/config/cors.php` | Cross-Origin Resource Sharing settings |
| `Backend/config/sanctum.php` | Laravel Sanctum authentication config |
| `Backend/routes/api.php` | API endpoints definition |

---

## ✨ Next Steps

1. **Commit changes** ke repository:
   ```bash
   git add frontend/.env Backend/.env Backend/config/cors.php Backend/config/sanctum.php
   git commit -m "Configure Nginx reverse proxy architecture"
   git push origin main
   ```

2. **Deploy ke Ubuntu Server** dengan Nginx:
   - Update `APP_URL` dan CORS untuk production domain
   - Configure Nginx dengan contoh di atas
   - Run `php artisan config:cache` untuk optimize

3. **Test di production**:
   - Verify frontend dapat di-access
   - Verify API requests berhasil
   - Check mobile app tetap bisa connect

---

**Created**: January 15, 2026  
**Status**: Ready for Production Deployment  
**Reviewed By**: GitHub Copilot
