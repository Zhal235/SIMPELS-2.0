# FCM Push Notification - Quick Setup Guide

**⚠️ PILIH PLATFORM:**

- **PWA (Web/Browser)**: Lihat [FCM-PWA-SETUP.md](./FCM-PWA-SETUP.md)
- **Native Android APK**: Dokumentasi di bawah

---

## 🚀 Quick Start (Native Android)

### 1. Setup Firebase (5 menit)
1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Tambahkan Android app dengan package name: `com.simpels.simpels_mobile`
3. Download `google-services.json` → taruh di `mobile/android/app/`
4. Copy **Server Key** dari Firebase Console → Cloud Messaging

### 2. Konfigurasi Mobile
File `mobile/android/app/build.gradle` - tambahkan di PALING BAWAH:
```gradle
apply plugin: 'com.google.gms.google-services'
```

File `mobile/android/build.gradle` - tambahkan di dependencies:
```gradle
classpath 'com.google.gms:google-services:4.4.0'
```

### 3. Konfigurasi Backend
File `Backend/.env`:
```env
FCM_SERVER_KEY=AAAAxxxxx_YOUR_SERVER_KEY_HERE
```

Jalankan migration:
```bash
cd Backend
php artisan migrate
```

### 4. Build & Test
```bash
cd mobile
flutter clean
flutter pub get
flutter build apk --release
```

---

## 📁 File Structure

### Mobile:
```
mobile/
├── lib/
│   ├── services/
│   │   └── fcm_service.dart          ← FCM handler utama
│   ├── main.dart                      ← Firebase initialization
│   └── screens/home/home_screen.dart  ← FCM registration
└── android/
    ├── app/
    │   ├── google-services.json       ← ⚠️ WAJIB (dari Firebase)
    │   └── build.gradle               ← Tambahkan google-services plugin
    └── build.gradle                   ← Tambahkan dependency google-services
```

### Backend:
```
Backend/
├── app/
│   ├── Services/
│   │   └── FCMService.php             ← Service untuk kirim notif
│   ├── Models/
│   │   └── FCMToken.php               ← Model FCM token
│   └── Http/Controllers/Api/V1/Wali/
│       └── FCMController.php          ← API register/unregister token
├── database/migrations/
│   └── 2026_03_29_000001_create_fcm_tokens_table.php
└── config/
    └── services.php                   ← Config FCM_SERVER_KEY
```

---

## 🔔 Cara Kirim Notifikasi

### Auto-trigger (sudah implemented):
✅ Pembayaran approved → Notif otomatis terkirim
✅ Pembayaran rejected → Notif otomatis terkirim

### Manual trigger dari controller lain:
```php
use App\Services\FCMService;

$fcm = new FCMService();

// Pembayaran approved
$fcm->sendPaymentApproved($santriId, $nominal, $paymentId);

// Pembayaran rejected
$fcm->sendPaymentRejected($santriId, $nominal, $paymentId, $reason);

// Topup approved
$fcm->sendTopupApproved($santriId, $nominal, $topupId);

// Tagihan baru
$fcm->sendNewTagihan($santriId, $tagihanName, $nominal);

// Reminder tagihan
$fcm->sendTagihanReminder($santriId, $tagihanName, $dueDate);

// Pengumuman
$fcm->sendAnnouncement([$santriId1, $santriId2], $title, $message);
```

---

## 🐛 Troubleshooting

| Error | Solusi |
|-------|--------|
| "FirebaseApp not initialized" | Pastikan `google-services.json` ada di `mobile/android/app/` |
| Notif tidak muncul | Check FCM_SERVER_KEY di `.env`, test di device fisik |
| Token tidak ter-save | Check endpoint `/api/v1/wali/fcm-token` accessible |

**Check FCM tokens di database:**
```sql
SELECT * FROM fcm_tokens ORDER BY created_at DESC;
```

---

## 📚 Full Documentation

Lihat [FIREBASE-FCM-SETUP.md](./FIREBASE-FCM-SETUP.md) untuk dokumentasi lengkap.

---

**Setup selesai! 🎉** Push notification siap digunakan.
