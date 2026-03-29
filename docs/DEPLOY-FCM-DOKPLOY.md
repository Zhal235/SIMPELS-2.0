# 🚀 Deploy FCM Push Notification ke Dokploy

## 📋 Checklist Deployment

Fitur FCM Push Notification sudah siap deploy dengan perubahan:

### ✅ File yang Diupdate:
1. ✅ `mobile/web/index.html` - Firebase SDK & config
2. ✅ `mobile/web/firebase-messaging-sw.js` - Service Worker FCM (NEW)
3. ✅ `mobile/lib/services/fcm_service.dart` - FCM handler dengan VAPID key
4. ✅ `mobile/Dockerfile` - Copy firebase-messaging-sw.js ke build
5. ✅ `mobile/nginx.conf` - No-cache untuk service worker
6. ✅ `Backend/.env` - Perlu tambahkan FCM_SERVER_KEY
7. ✅ `Backend/database/migrations` - Migration fcm_tokens table
8. ✅ `Backend/app/Services/FCMService.php` - Service kirim notifikasi
9. ✅ `Backend/app/Http/Controllers/Api/V1/Wali/FCMController.php` - API endpoints
10. ✅ `Backend/routes/api_v1.php` - Routes FCM

---

## 🔄 Cara Deploy via Dokploy

### 1. Commit & Push ke Git

```bash
cd C:\Users\Rhezal Maulana\Documents\GitHub\SIMPELS-2.0

# Check status
git status

# Add semua file yang berubah
git add mobile/web/index.html
git add mobile/web/firebase-messaging-sw.js
git add mobile/lib/services/fcm_service.dart
git add mobile/Dockerfile
git add mobile/nginx.conf
git add Backend/app/Services/FCMService.php
git add Backend/app/Models/FCMToken.php
git add Backend/app/Http/Controllers/Api/V1/Wali/FCMController.php
git add Backend/app/Http/Controllers/Api/AdminBuktiTransferController.php
git add Backend/routes/api_v1.php
git add Backend/config/services.php
git add Backend/database/migrations/2026_03_29_000001_create_fcm_tokens_table.php
git add docs/FIREBASE-FCM-SETUP.md
git add docs/FCM-PWA-SETUP.md
git add docs/FCM-QUICK-START.md

# Commit
git commit -m "feat: implement FCM push notifications for PWA and native

- Add Firebase Cloud Messaging for push notifications
- Support both PWA (web) and native Android
- Add FCM service worker for background notifications
- Add backend FCM service and API endpoints
- Auto-trigger notifications on payment approve/reject
- Add fcm_tokens table migration
- Update Dockerfile to include firebase-messaging-sw.js
- Add comprehensive documentation"

# Push ke repository
git push origin main
```

### 2. Deploy Backend (Laravel)

#### A. Via Dokploy Dashboard:
1. Login ke Dokploy: https://dokploy.yourdomain.com
2. Pilih project **SIMPELS Backend**
3. Klik **Deploy** atau tunggu auto-deploy dari webhook

#### B. Set Environment Variable:
1. Di Dokploy → Backend project → **Environment**
2. Tambahkan variable baru:
   ```
   FCM_SERVER_KEY=AAAAxxx...your_server_key
   ```
3. Save & Redeploy

#### C. Jalankan Migration (via Dokploy terminal):
1. Di Dokploy → Backend → **Terminal**
2. Jalankan:
   ```bash
   php artisan migrate
   ```

### 3. Deploy Mobile PWA (Flutter)

#### Via Dokploy Dashboard:
1. Login ke Dokploy
2. Pilih project **SIMPELS Mobile**
3. Klik **Deploy**
4. Tunggu build selesai (~2-5 menit)
5. Docker akan:
   - Build Flutter web
   - Copy firebase-messaging-sw.js
   - Setup Nginx
   - Deploy ke production

#### Monitor Build Log:
Check log di Dokploy dashboard untuk memastikan:
```
✓ Building Flutter web
✓ Copying firebase-messaging-sw.js
✓ Setting up Nginx
✓ Deployment successful
```

---

## 🧪 Testing Setelah Deploy

### 1. Test PWA
```
https://mobilesimpels.saza.sch.id
```

### 2. Check Firebase di Console Browser
1. Buka PWA
2. F12 → Console
3. Harus muncul:
   ```
   Firebase initialized for PWA
   FCM Token: dxxxxxxxxxxxxx...
   ```

### 3. Check Service Worker
```javascript
// Di browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
  regs.forEach(r => console.log('Scope:', r.scope));
});

// Check Firebase Messaging SW
fetch('/firebase-messaging-sw.js').then(r => {
  console.log('Firebase SW Status:', r.status); // Harus 200
});
```

### 4. Test Notification Permission
1. Login ke PWA
2. Harus muncul popup notification permission
3. Klik **Allow**
4. Token akan ter-register ke backend

### 5. Check Database
```bash
# Connect ke database container via Dokploy terminal
# Atau via phpMyAdmin/Adminer

# Query:
SELECT * FROM fcm_tokens ORDER BY created_at DESC LIMIT 5;
```

### 6. Test Send Notification
```bash
# Via Dokploy → Backend → Terminal
php artisan tinker

# Di tinker:
$fcm = new App\Services\FCMService();
$fcm->sendPaymentApproved(1, 100000, 1);
# Ganti 1 dengan santri_id yang valid
```

### 7. Test dari Admin Panel
1. Login sebagai admin di frontend
2. Buka **Bukti Transfer** yang pending
3. Klik **Approve**
4. Wali yang buka PWA akan terima notifikasi

---

## 🔍 Troubleshooting

### ❌ Error: firebase-messaging-sw.js not found (404)
**Solusi:**
```bash
# Check di Dokploy build log:
# Pastikan ada line: "Copying firebase-messaging-sw.js"

# Manual check via terminal:
ls -la /usr/share/nginx/html/firebase-messaging-sw.js
```

### ❌ Service Worker tidak register
**Check:**
1. HTTPS must be enabled (Dokploy default sudah HTTPS)
2. File firebase-messaging-sw.js accessible
3. Browser support service workers

### ❌ FCM Token tidak tersimpan di database
**Check:**
1. Backend migration sudah jalan: `php artisan migrate:status`
2. API endpoint accessible: `curl https://api.yourdomain.com/api/v1/wali/fcm-token`
3. Auth token valid saat register

### ❌ Notification tidak muncul
**Checklist:**
1. ✅ FCM_SERVER_KEY di backend .env
2. ✅ Firebase config correct di index.html
3. ✅ VAPID key correct di fcm_service.dart
4. ✅ Notification permission granted
5. ✅ PWA/tab masih aktif

---

## 📊 Expected Deploy Time

| Component | Duration | Notes |
|-----------|----------|-------|
| Git Push | ~10s | Upload code |
| Backend Deploy | ~1-2 min | Composer install, cache |
| Backend Migration | ~5s | Create fcm_tokens table |
| Mobile Build | ~3-5 min | Flutter web build |
| Mobile Deploy | ~30s | Nginx setup |
| **Total** | **~5-8 min** | Full deployment |

---

## 🎯 Post-Deployment Checklist

- [ ] PWA accessible di https://mobilesimpels.saza.sch.id
- [ ] Firebase initialized (check console)
- [ ] Service worker registered
- [ ] Firebase Messaging SW loaded (no 404)
- [ ] Login successful
- [ ] Notification permission prompt shown
- [ ] FCM token saved to database
- [ ] Test notification received
- [ ] Backend FCM_SERVER_KEY configured
- [ ] Migration fcm_tokens executed
- [ ] API endpoints working

---

## 📱 Tell Users to Update PWA

Setelah deploy, user perlu refresh PWA:

### Android Chrome:
1. Close semua tab PWA
2. Buka fresh: https://mobilesimpels.saza.sch.id
3. Auto-update akan trigger

### iOS Safari:
1. Delete dari home screen
2. Re-add: Share → Add to Home Screen

### Desktop:
1. Close PWA window
2. Buka lagi dari bookmark/home screen

---

## 🔄 Rollback (Jika Ada Masalah)

```bash
# Rollback git
git revert HEAD
git push origin main

# Dokploy akan auto-deploy versi sebelumnya
# Atau manual trigger previous deployment di Dokploy dashboard
```

---

**Ready to deploy! 🚀**

Setelah push ke Git, Dokploy akan handle deployment otomatis.
Monitor di dashboard dan check logs untuk memastikan success.
