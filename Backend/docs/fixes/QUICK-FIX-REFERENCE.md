# ⚡ Quick Reference - Fix 405 Method Not Allowed

## ✅ Perubahan yang Dilakukan

### File: `bootstrap/app.php` (Baris 34-42)
```diff
- // Exclude storage routes from CSRF verification
- $middleware->validateCsrfTokens(except: [
-     '/storage/*',
-     '/public-storage/*',
- ]);

+ // Exclude storage routes and API routes from CSRF verification
+ // API routes use Bearer token authentication, not CSRF tokens
+ $middleware->validateCsrfTokens(except: [
+     '/api/*',              ← BARU
+     '/storage/*',
+     '/public-storage/*',
+ ]);
```

---

## 📊 Status Konfigurasi

| Komponen | File | Status | Port 8888 |
|----------|------|--------|-----------|
| Routes | `routes/api.php` | ✅ OK | - |
| CORS | `config/cors.php` | ✅ OK | ✅ Tercakup |
| Sanctum | `config/sanctum.php` | ✅ OK | ✅ Tercakup |
| CSRF | `bootstrap/app.php` | ✅ FIXED | ✅ API Excluded |

---

## 🔐 Keamanan

- ✅ API routes dilindungi `auth:sanctum`
- ✅ Bearer token validation tetap aktif
- ✅ CSRF tetap aktif untuk web routes
- ✅ Credentials enabled untuk cross-origin requests

---

## 🧪 Test Login

```bash
curl -X POST http://127.0.0.1:8888/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"Admin.simpels@saza.sch.id","password":"ChangeMeNow!2025"}'
```

Expected: `200 OK` (bukan 405)

---

## 📋 Files Modified
- ✅ `bootstrap/app.php`

## 📄 Documentation
- ✅ `NGINX-405-FIX-SUMMARY.md` (detail lengkap)

---

**Last Updated:** 15 January 2026  
**Ready for Production:** ✅ YES
