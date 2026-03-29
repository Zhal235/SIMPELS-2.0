# 🌐 FCM Push Notification untuk PWA (Web)

## 📋 Setup Firebase untuk PWA

### 1. Setup Firebase Project
Sama seperti native app, tapi tambahkan **Web App**:

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project SIMPELS (atau buat baru)
3. Klik ⚙️ **Project Settings** → **General**
4. Scroll ke **Your apps** → Klik **Web** icon `</>`
5. Isi:
   - **App nickname**: SIMPELS Mobile PWA
   - **Firebase Hosting**: tidak perlu dicentang
6. Klik **Register app**
7. Copy **Firebase configuration object** (akan digunakan di langkah berikutnya)

### 2. Dapatkan VAPID Key
1. Di Firebase Console → ⚙️ **Project Settings**
2. Tab **Cloud Messaging**
3. Scroll ke **Web configuration**
4. Di bagian **Web Push certificates**, klik **Generate key pair**
5. Copy **Key pair** (format: `Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 3. Konfigurasi File Web

#### A. Update `mobile/web/index.html`
Ganti placeholders dengan config Firebase Anda:

```html
<script>
  const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "simpels-xxxxx.firebaseapp.com",
    projectId: "simpels-xxxxx",
    storageBucket: "simpels-xxxxx.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxxxxxxxx"
  };
</script>
```

#### B. Update `mobile/web/firebase-messaging-sw.js`
Ganti config yang sama:

```javascript
firebase.initializeApp({
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "simpels-xxxxx.firebaseapp.com",
  projectId: "simpels-xxxxx",
  storageBucket: "simpels-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxxxxx"
});
```

#### C. Update `mobile/lib/services/fcm_service.dart`
Ganti VAPID key (baris ~70):

```dart
_fcmToken = await _firebaseMessaging.getToken(
  vapidKey: 'Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
);
```

---

## 🔧 Build PWA

```bash
cd mobile
flutter clean
flutter pub get
flutter build web --release
```

---

## 📦 Deploy ke Server

### 1. Upload ke Server
```bash
# Compress build folder
cd mobile/build
tar -czf web.tar.gz web/

# Upload ke server (via scp atau FTP)
scp web.tar.gz root@your-server:/tmp/

# Di server:
cd /var/www/html/mobilesimpels
tar -xzf /tmp/web.tar.gz --strip-components=1
```

### 2. Pastikan Service Worker Accessible
Pastikan file `firebase-messaging-sw.js` bisa diakses di root domain:

```bash
# Di server
cp firebase-messaging-sw.js /var/www/html/mobilesimpels/
```

---

## 🧪 Testing PWA Push Notification

### 1. Buka PWA di Browser
```
https://mobilesimpels.saza.sch.id
```

### 2. Check Console untuk Token
1. Buka Developer Tools (F12)
2. Tab **Console**
3. Cari log: `FCM Token: xxxxx...`
4. Token akan otomatis ter-register ke backend

### 3. Test Send Notification dari Backend
```bash
cd Backend
php artisan tinker
```

```php
$fcm = new App\Services\FCMService();
$fcm->sendPaymentApproved(1, 100000, 1);
```

### 4. Test dari Admin Panel
1. Login sebagai admin di frontend
2. Approve bukti transfer
3. Notifikasi push akan terkirim ke wali (jika PWA terbuka)

---

## 🔍 Troubleshooting PWA

### ❌ Error: "A bad HTTP response code (404) was received"
**Penyebab:** `firebase-messaging-sw.js` tidak ditemukan

**Solusi:**
```bash
# Pastikan file ada di root PWA
ls -la /var/www/html/mobilesimpels/firebase-messaging-sw.js

# Jika tidak ada, copy dari source
cp mobile/web/firebase-messaging-sw.js /var/www/html/mobilesimpels/
```

### ❌ Notifikasi tidak muncul di PWA
**Checklist:**
1. ✅ Firebase config sudah benar di `index.html`
2. ✅ VAPID key sudah benar di `fcm_service.dart`
3. ✅ Browser support notification (Chrome, Firefox, Edge)
4. ✅ Notification permission sudah granted
5. ✅ PWA dibuka dan aktif (atau di-install sebagai app)
6. ✅ Service worker registered

**Check Service Worker:**
```javascript
// Di browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});
```

### ❌ Token tidak ter-save di backend
**Debug:**
```javascript
// Di browser console
navigator.serviceWorker.ready.then(reg => {
  return reg.pushManager.getSubscription();
}).then(sub => {
  console.log('Push subscription:', sub);
});
```

---

## 📱 Install PWA di Device

### Android (Chrome):
1. Buka https://mobilesimpels.saza.sch.id
2. Menu **⋮** → **Install app** / **Add to Home screen**
3. PWA akan berjalan seperti native app

### iOS (Safari):
1. Buka https://mobilesimpels.saza.sch.id
2. Tap tombol **Share** (ikon kotak dengan panah)
3. Scroll → **Add to Home Screen**
4. Tap **Add**

### Desktop (Chrome/Edge):
1. Buka https://mobilesimpels.saza.sch.id
2. Alamat bar → klik icon **Install** (⊕)
3. Klik **Install**

---

## 🎯 Perbedaan Native vs PWA

| Fitur | Native APK | PWA (Web) |
|-------|-----------|-----------|
| Push Notification Background | ✅ Ya | ✅ Ya (jika browser aktif) |
| Push saat app tertutup | ✅ Ya | ⚠️ Tergantung browser |
| File size | ~20-50 MB | ~2-5 MB (cached) |
| Install dari | Play Store / APK | Browser / Add to Home |
| Update | Manual download | Otomatis saat buka app |
| Offline support | ✅ Ya | ✅ Ya (via service worker) |

---

## 🔐 Security Notes

1. **Jangan commit Firebase config ke git**
   ```bash
   # Tambahkan ke .gitignore
   echo "mobile/web/firebase-config.js" >> .gitignore
   ```

2. **Restrict API Key di Firebase Console**
   - Cloud Messaging API
   - Restrict ke domain: `mobilesimpels.saza.sch.id`

3. **HTTPS Required**
   - PWA push notification HANYA work di HTTPS
   - Sudah OK karena pakai Cloudflare

---

## 📚 Resources

- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [FCM Web](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/pwa/)

---

**PWA Push Notification siap digunakan! 🎉**

Setelah setup Firebase config dan deploy ulang, notifikasi akan work baik di native APK maupun PWA.
