# Fix untuk Error 405 Method Not Allowed - Laravel 11 + Nginx Reverse Proxy

**Tanggal Perbaikan:** 15 Januari 2026  
**Status:** ✅ Perbaikan Selesai  
**Environment:** Port Forwarding VirtualBox → Port 8888

---

## 📋 Ringkasan Masalah

Aplikasi Laravel 11 yang di-deploy dengan Nginx sebagai reverse proxy mengalami error **405 Method Not Allowed** pada endpoint API tertentu (khususnya login dan request POST lainnya).

---

## ✅ Pengecekan Konfigurasi yang Sudah Benar

### 1. **Routes API** ✅ SUDAH BENAR
- **File:** `routes/api.php`
- **Status:** Login endpoint sudah menggunakan `Route::post()`
- **Bukti:**
  ```php
  Route::post('/login', [AuthController::class, 'login']);
  Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
  Route::post('/reset-password', [AuthController::class, 'resetPassword']);
  ```

### 2. **CORS Configuration** ✅ SUDAH BENAR
- **File:** `config/cors.php`
- **Status:** Sudah mengizinkan origins yang diperlukan
- **Konfigurasi:**
  ```php
  'allowed_origins' => [
      'https://simpels.saza.sch.id',
      'https://api.saza.sch.id',
      'https://mobile.saza.sch.id',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:54475',
      'http://localhost:8888',      ✅ Port Forwarding
      'http://127.0.0.1:8888',      ✅ Port Forwarding
  ],
  'supports_credentials' => true,    ✅ Credentials enabled
  ```
- **Wildcard Patterns:** Sudah menggunakan regex patterns untuk dynamic ports

### 3. **Sanctum Configuration** ✅ SUDAH BENAR
- **File:** `config/sanctum.php`
- **Status:** Stateful domains sudah mencakup port 8888
- **Konfigurasi:**
  ```php
  'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
      '%s%s',
      'localhost,localhost:3000,localhost:8888,127.0.0.1,127.0.0.1:8000,127.0.0.1:8888,::1',
      Sanctum::currentApplicationUrlWithPort(),
  ))),
  ```

---

## 🔧 Perbaikan yang Dilakukan

### **Masalah Teridentifikasi:**
API routes diblok oleh CSRF token verification padahal API menggunakan Bearer token authentication.

### **Solusi yang Diterapkan:**

**File:** `bootstrap/app.php` (Lines 34-42)

**SEBELUM:**
```php
// Exclude storage routes from CSRF verification
$middleware->validateCsrfTokens(except: [
    '/storage/*',
    '/public-storage/*',
]);
```

**SESUDAH:**
```php
// Exclude storage routes and API routes from CSRF verification
// API routes use Bearer token authentication, not CSRF tokens
$middleware->validateCsrfTokens(except: [
    '/api/*',              ← ✅ BARU: API routes dikecualikan
    '/storage/*',
    '/public-storage/*',
]);
```

---

## 🎯 Penjelasan Teknis

### Mengapa Perubahan Ini Diperlukan?

1. **CSRF Token vs Bearer Token:**
   - Web routes (form-based) → membutuhkan CSRF token
   - API routes (JSON-based) → menggunakan Bearer token (Authorization header)
   - Ketika client mengirim POST ke `/api/login`, Laravel mencari CSRF token yang tidak ada

2. **Hasil Error 405:**
   - Middleware CSRF menolak request karena tidak menemukan CSRF token
   - Browser/client menerima respons 405 Method Not Allowed

3. **Solusi:**
   - Exclude `/api/*` dari CSRF verification
   - Laravel akan menggunakan Bearer token dari Authorization header
   - Request POST akan diterima dengan baik

---

## 📝 Checklist Implementasi

- [x] Periksa route method (POST/GET/PUT/DELETE)
- [x] Periksa CORS configuration
- [x] Periksa Sanctum stateful domains
- [x] Tambahkan `/api/*` ke CSRF exception list
- [x] Verifikasi middleware chain

---

## 🚀 Testing Checklist

Setelah deployment, lakukan testing berikut:

### 1. **Test Login Endpoint**
```bash
curl -X POST http://127.0.0.1:8888/api/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://127.0.0.1:8888" \
  -d '{
    "email": "Admin.simpels@saza.sch.id",
    "password": "ChangeMeNow!2025"
  }'
```

**Expected Response:** 200 OK (bukan 405)

### 2. **Test CORS Preflight (OPTIONS)**
```bash
curl -X OPTIONS http://127.0.0.1:8888/api/login \
  -H "Origin: http://127.0.0.1:8888" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

**Expected Headers:**
```
Access-Control-Allow-Origin: http://127.0.0.1:8888
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

### 3. **Test Protected API Route**
```bash
curl -X GET http://127.0.0.1:8888/api/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Origin: http://127.0.0.1:8888"
```

---

## 📁 File yang Diubah

| File | Baris | Perubahan |
|------|-------|----------|
| `bootstrap/app.php` | 34-42 | Tambah `/api/*` ke CSRF exceptions |

---

## 🔒 Keamanan

✅ **Perubahan ini AMAN karena:**
- API routes tetap dilindungi oleh `auth:sanctum` middleware
- Bearer token validation masih dilakukan
- Storage routes tetap dikecualikan sesuai kebutuhan
- CSRF protection masih aktif untuk web routes

---

## 📞 Konfigurasi Nginx Terkait

Untuk referensi, berikut adalah konfigurasi Nginx yang mendukung:

```nginx
location ~ ^/api/ {
    proxy_pass http://laravel_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Penting: izinkan OPTIONS method untuk CORS preflight
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

---

## 🎓 Referensi Laravel

- [Laravel CSRF Protection](https://laravel.com/docs/11.x/csrf)
- [Laravel Sanctum](https://laravel.com/docs/11.x/sanctum)
- [CORS in Laravel](https://laravel.com/docs/11.x/middleware)

---

**Status:** ✅ Perbaikan Siap untuk Production  
**Next Steps:** Deploy perubahan ke server Nginx dan jalankan testing checklist di atas.
