# 🔔 Push Notification dengan Firebase Cloud Messaging (FCM)

**⚠️ PENTING: SIMPELS Mobile adalah HYBRID App (PWA + Native)**

Ada 2 cara deploy:
1. **PWA (Web)** - Deployed di https://mobilesimpels.saza.sch.id
2. **Native APK/IPA** - Install langsung di device

Setup FCM berbeda untuk masing-masing platform:
- **PWA Setup**: Lihat [FCM-PWA-SETUP.md](./FCM-PWA-SETUP.md)
- **Native Android Setup**: Dokumentasi di bawah ini

---

## 📋 Daftar Isi
1. [Setup Firebase Project](#setup-firebase-project)
2. [Konfigurasi Mobile App (Flutter)](#konfigurasi-mobile-app)
3. [Konfigurasi Backend (Laravel)](#konfigurasi-backend)
4. [Testing Push Notification](#testing)
5. [Troubleshooting](#troubleshooting)

---

## 🔥 Setup Firebase Project

### 1. Buat Firebase Project
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **Add Project** / **Tambah Project**
3. Nama project: **SIMPELS** (atau sesuai keinginan)
4. Disable Google Analytics (opsional)
5. Klik **Create Project**

### 2. Tambahkan Android App
1. Di Firebase Console, klik ⚙️ **Project Settings**
2. Scroll ke bawah, klik **Add app** → pilih **Android**
3. Isi form:
   - **Android package name**: `com.simpels.simpels_mobile` 
     *(buka `mobile/android/app/build.gradle`, cari `applicationId`)*
   - **App nickname**: SIMPELS Mobile
   - **Debug signing certificate** (opsional untuk development)
4. Klik **Register app**

### 3. Download google-services.json
1. Download file **google-services.json**
2. Copy file ke: `mobile/android/app/google-services.json`
3. Pastikan lokasi file **EXACT** di folder `app/`, BUKAN di `android/`

### 4. Dapatkan FCM Server Key
1. Di Firebase Console → ⚙️ **Project Settings**
2. Tab **Cloud Messaging**
3. Scroll ke **Project credentials**
4. Copy **Server key** (format: `AAAAxxxxx...`)
5. Simpan untuk konfigurasi backend

---

## 📱 Konfigurasi Mobile App (Flutter)

### 1. Update build.gradle (Project Level)
File: `mobile/android/build.gradle`

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
        classpath 'com.google.gms:google-services:4.4.0'  // ← TAMBAHKAN INI
    }
}
```

### 2. Update build.gradle (App Level)
File: `mobile/android/app/build.gradle`

Tambahkan di **PALING BAWAH** file:
```gradle
apply plugin: 'com.google.gms.google-services'  // ← TAMBAHKAN INI
```

### 3. Verifikasi Konfigurasi
✅ Semua konfigurasi sudah dilakukan di:
- `mobile/lib/services/fcm_service.dart` - FCM service handler
- `mobile/lib/main.dart` - Firebase initialization
- `mobile/lib/screens/home/home_screen.dart` - FCM registration
- `mobile/android/app/src/main/AndroidManifest.xml` - Permissions
- `mobile/pubspec.yaml` - Dependencies sudah ada

### 4. Build App
```powershell
cd mobile
flutter clean
flutter pub get
flutter build apk --release
```

---

## 🖥️ Konfigurasi Backend (Laravel)

### 1. Jalankan Migration
```bash
cd Backend
php artisan migrate
```

Migration akan membuat table `fcm_tokens` untuk menyimpan device tokens.

### 2. Tambahkan FCM Server Key ke .env
File: `Backend/.env`

```env
FCM_SERVER_KEY=AAAAxxxxx_YOUR_SERVER_KEY_HERE
```

### 3. Gunakan FCMService

Sudah tersedia di `Backend/app/Services/FCMService.php`

**Contoh penggunaan:**

```php
use App\Services\FCMService;

$fcm = new FCMService();

// Kirim notif pembayaran approved
$fcm->sendPaymentApproved($santriId, $paymentAmount, $paymentId);

// Kirim notif pembayaran rejected
$fcm->sendPaymentRejected($santriId, $paymentAmount, $paymentId, $reason);

// Kirim notif topup approved
$fcm->sendTopupApproved($santriId, $topupAmount, $topupId);

// Kirim tagihan baru
$fcm->sendNewTagihan($santriId, $tagihanName, $tagihanAmount);

// Kirim reminder tagihan
$fcm->sendTagihanReminder($santriId, $tagihanName, $dueDate);

// Kirim pengumuman ke multiple santri
$fcm->sendAnnouncement([$santriId1, $santriId2], $title, $message);
```

### 4. Implementasi di Controller (Contoh)

**File: `Backend/app/Http/Controllers/Api/AdminBuktiTransferController.php`**

Tambahkan di method `approve()`:

```php
use App\Services\FCMService;

public function approve($id)
{
    $bukti = BuktiTransfer::findOrFail($id);
    $bukti->status = 'approved';
    $bukti->save();

    // Kirim push notification
    $fcm = new FCMService();
    $fcm->sendPaymentApproved(
        $bukti->santri_id,
        $bukti->nominal,
        $bukti->pembayaran_id
    );

    return response()->json(['success' => true]);
}
```

---

## 🧪 Testing Push Notification

### 1. Test via Postman

**Endpoint:** `POST http://localhost:8000/api/v1/wali/fcm-token`

**Headers:**
```
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json
```

**Body:**
```json
{
  "santri_id": "1",
  "fcm_token": "test_token_123"
}
```

### 2. Test Send Notification via Tinker

```bash
cd Backend
php artisan tinker
```

```php
$fcm = new App\Services\FCMService();
$fcm->sendPaymentApproved(1, 100000, 1);
```

### 3. Test dari Mobile App

1. Install app di device fisik (FCM tidak work di emulator kadang-kadang)
2. Login dengan akun wali
3. Biarkan app terbuka (foreground)
4. Dari backend, kirim notifikasi via tinker atau approve pembayaran
5. Notifikasi akan muncul sebagai dialog jika app foreground
6. Tutup app → kirim notif lagi → notifikasi muncul di system tray

---

## 🐛 Troubleshooting

### ❌ Error: "Default FirebaseApp is not initialized"
**Solusi:**
- Pastikan `google-services.json` ada di `mobile/android/app/`
- Pastikan `apply plugin: 'com.google.gms.google-services'` ada di `build.gradle`
- Jalankan `flutter clean && flutter pub get`

### ❌ Notifikasi tidak muncul
**Checklist:**
1. ✅ FCM Server Key sudah benar di `.env`
2. ✅ google-services.json sudah di lokasi yang benar
3. ✅ Permission POST_NOTIFICATIONS sudah granted (Android 13+)
4. ✅ App sudah build ulang setelah konfigurasi
5. ✅ Test di device fisik, bukan emulator
6. ✅ Check log backend untuk error FCM

### ❌ Token tidak ter-register ke backend
**Solusi:**
- Pastikan `FCMService().initialize(context)` dipanggil di `HomeScreen`
- Check network connection
- Check log di mobile: `flutter logs` atau Android Studio Logcat
- Pastikan endpoint `/api/v1/wali/fcm-token` accessible

### 📊 Check FCM Token di Database

```sql
SELECT * FROM fcm_tokens ORDER BY created_at DESC;
```

### 🔍 Debug FCM di Mobile

```dart
// Di fcm_service.dart, semua log sudah ada
// Lihat output di terminal:
flutter run
// atau
flutter logs
```

---

## 📌 Catatan Penting

1. **FCM Server Key vs Web API Key**
   - Gunakan **Server Key**, bukan Web API Key
   - Server Key digunakan di backend Laravel
   - Format: `AAAAxxxxx...`

2. **google-services.json Location**
   - **HARUS** di `mobile/android/app/google-services.json`
   - BUKAN di `mobile/android/google-services.json`

3. **iOS Support**
   - Untuk iOS, perlu tambahan konfigurasi `GoogleService-Info.plist`
   - Dokumentasi iOS terpisah (coming soon)

4. **Production vs Development**
   - Gunakan Firebase project berbeda untuk production
   - Jangan commit `google-services.json` ke git (tambahkan ke `.gitignore`)

---

## 🎯 Fitur Auto-Trigger Notification

Notifikasi otomatis ter-trigger saat:

✅ **Pembayaran Disetujui** → `sendPaymentApproved()`
✅ **Pembayaran Ditolak** → `sendPaymentRejected()`
✅ **Top-up Disetujui** → `sendTopupApproved()`
✅ **Tagihan Baru** → `sendNewTagihan()`
✅ **Reminder Tagihan** → `sendTagihanReminder()`
✅ **Pengumuman Baru** → `sendAnnouncement()`

Tinggal panggil method FCMService di controller yang sesuai.

---

## 📚 Resources

- [Firebase Console](https://console.firebase.google.com/)
- [FlutterFire Documentation](https://firebase.flutter.dev/)
- [FCM HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/http-server-ref)
- [Android Notification Best Practices](https://developer.android.com/develop/ui/views/notifications)

---

**Setup selesai! 🎉**

Jika ada issue, check troubleshooting atau hubungi developer.
