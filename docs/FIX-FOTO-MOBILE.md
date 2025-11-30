# Fix Foto Tidak Tampil di Mobile App

## Masalah
Foto santri tidak ditampilkan di aplikasi mobile (Flutter), meskipun foto sudah tersimpan di backend.

## Penyebab
1. **URL Backend salah**: `APP_URL` di `.env` diset ke `http://localhost` tanpa port, seharusnya `http://localhost:8001`
2. **FILESYSTEM_DISK salah**: Setting di `.env` menggunakan `local` seharusnya `public`
3. **URL generation tidak lengkap**: Backend mengembalikan relative path `/storage/foto-santri/xxx.jpg` yang tidak bisa diakses dari mobile
4. **Config cache**: Laravel masih menggunakan config lama yang ter-cache

## Solusi yang Diterapkan

### 1. Update Backend Configuration (`.env`)
```dotenv
# Sebelum
APP_URL=http://localhost
FILESYSTEM_DISK=local

# Sesudah
APP_URL=http://localhost:8001
FILESYSTEM_DISK=public
```

### 2. Update WaliController untuk Generate Full URL
File: `Backend/app/Http/Controllers/Api/WaliController.php`

**Perubahan di method `login()`**:
```php
// Generate full foto URL
$fotoUrl = null;
if ($s->foto) {
    // If foto is already a full URL, use it directly
    if (str_starts_with($s->foto, 'http://') || str_starts_with($s->foto, 'https://')) {
        $fotoUrl = $s->foto;
    } else {
        // Generate full URL from storage path
        $fotoUrl = url('storage/' . $s->foto);
    }
}

return [
    // ... other fields
    'foto_url' => $fotoUrl,  // Full URL: http://localhost:8001/storage/foto-santri/xxx.jpg
    // ...
];
```

### 3. Update Mobile App Config - Auto Platform Detection

API service sekarang otomatis mendeteksi platform dan menggunakan base URL yang sesuai:

File: `mobile/lib/services/api_service.dart`

```dart
/// Get base URL based on platform
static String getBaseUrl() {
  // For web, always use localhost
  if (kIsWeb) {
    return 'http://localhost:8001';
  }
  
  // For Android emulator
  if (Platform.isAndroid) {
    return 'http://10.0.2.2:8001';
  }
  
  // For iOS simulator or other platforms
  return 'http://localhost:8001';
}
```

**Deteksi Otomatis**:
- **Flutter Web**: `http://localhost:8001/api` ✅
- **Android Emulator**: `http://10.0.2.2:8001/api` ✅
- **iOS Simulator**: `http://localhost:8001/api` ✅
- **Physical Device**: Perlu ganti manual ke IP komputer (misal `192.168.1.100:8001`)

### 4. Improve Mobile Image Handling
File: `mobile/lib/models/santri_model.dart`

Ditambahkan handling untuk URL yang sudah lengkap dan logging untuk debugging:
```dart
if (relativeFotoUrl != null && relativeFotoUrl.toString().isNotEmpty) {
  final fotoStr = relativeFotoUrl.toString();
  // If already a full URL, use it directly
  if (fotoStr.startsWith('http://') || fotoStr.startsWith('https://')) {
    fullFotoUrl = fotoStr;
  } else {
    // Convert relative path to full URL
    fullFotoUrl = ApiService.getFullImageUrl(fotoStr);
  }
  print('[SantriModel] Original foto_url: $relativeFotoUrl');
  print('[SantriModel] Full foto URL: $fullFotoUrl');
}
```

### 5. Enhanced Error Logging
File: `mobile/lib/screens/home_screen.dart`

Ditambahkan logging yang lebih detail untuk debugging:
```dart
onBackgroundImageError: hasFoto
    ? (exception, stackTrace) {
        debugPrint('[HomeScreen] Error loading foto from ${currentSantri.fotoUrl}');
        debugPrint('[HomeScreen] Error: $exception');
        debugPrint('[HomeScreen] StackTrace: $stackTrace');
      }
    : null,
```

## Langkah Testing

1. **Clear config cache Laravel**:
   ```bash
   cd Backend
   php artisan config:clear
   ```

2. **Restart Laravel server**:
   ```bash
   php artisan serve --port=8001
   ```

3. **Rebuild Flutter app**:
   ```bash
   cd mobile
   flutter clean
   flutter pub get
   flutter run
   ```

4. **Verifikasi di console**:
   - Cek log di Flutter console untuk melihat URL foto yang di-load
   - Cek log untuk error jika foto gagal load

## Struktur Storage
```
Backend/
  storage/
    app/
      public/
        foto-santri/          ← Folder foto santri
          VnnfwFOmNmJ3ckpwEzeb56U3zcLvzBqJwchUeACc.jpg
        bukti_transfer/       ← Folder bukti transfer
        santri_foto/          ← Folder lama (tidak digunakan)
  public/
    storage -> ../storage/app/public  ← Symlink
```

## Format URL yang Dihasilkan

### Response API Login (`/api/auth/login`):
```json
{
  "santri": [
    {
      "id": "xxx-xxx-xxx",
      "nis": "70000001",
      "nama": "Ahmad Putra",
      "foto_url": "http://localhost:8001/storage/foto-santri/VnnfwFOmNmJ3ckpwEzeb56U3zcLvzBqJwchUeACc.jpg"
    }
  ]
}
```

### URL Akses dari Mobile:
- **Android Emulator**: `http://10.0.2.2:8001/storage/foto-santri/xxx.jpg`
- **Physical Device**: `http://192.168.1.100:8001/storage/foto-santri/xxx.jpg` (ganti dengan IP komputer)

## Troubleshooting

### Foto masih tidak muncul?

1. **Cek symlink storage**:
   ```bash
   cd Backend
   php artisan storage:link
   ```

2. **Cek file foto ada**:
   ```bash
   ls Backend/storage/app/public/foto-santri/
   ```

3. **Test URL di browser**:
   - Buka: `http://localhost:8001/storage/foto-santri/VnnfwFOmNmJ3ckpwEzeb56U3zcLvzBqJwchUeACc.jpg`
   - Jika tidak bisa, berarti symlink atau server bermasalah

4. **Cek dari mobile**:
   - Android Emulator: `http://10.0.2.2:8001/storage/foto-santri/xxx.jpg`
   - Jika timeout, pastikan server Laravel running di port 8001

5. **Cek network permission (Android)**:
   File: `android/app/src/main/AndroidManifest.xml`
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   ```

6. **Allow cleartext traffic (untuk HTTP, bukan HTTPS)**:
   File: `android/app/src/main/AndroidManifest.xml`
   ```xml
   <application
       android:usesCleartextTraffic="true"
       ...>
   ```

## Fix CORS untuk Flutter Web

### Masalah CORS
Ketika menjalankan Flutter web, browser akan memblokir akses ke foto karena CORS policy:
```
Access to XMLHttpRequest at 'http://localhost:8001/storage/foto-santri/xxx.jpg' 
from origin 'http://localhost:49900' has been blocked by CORS policy
```

### Solusi
Laravel sudah dikonfigurasi untuk serve foto melalui route khusus dengan CORS headers:

**Route**: `/public-storage/{path}` (bukan `/storage/{path}`)

File `routes/web.php` sudah memiliki route ini:
```php
Route::get('/public-storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    
    if (!file_exists($filePath)) {
        abort(404);
    }
    
    $file = file_get_contents($filePath);
    $type = mime_content_type($filePath);
    
    return Response::make($file, 200, [
        'Content-Type' => $type,
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => '*',
    ]);
})->where('path', '.*');
```

WaliController sudah diupdate untuk menggunakan route ini:
```php
$fotoUrl = url('public-storage/' . $s->foto);
// Result: http://localhost:8001/public-storage/foto-santri/xxx.jpg
```

## Catatan Penting

1. **Flutter Web vs Native Mobile**:
   - **Flutter Web**: Butuh CORS headers (gunakan `/public-storage` route)
   - **Android/iOS**: Tidak ada CORS restriction, bisa langsung akses `/storage`

2. **Gunakan HTTPS di production**: URL HTTP hanya untuk development

3. **Optimize images**: Foto santri sebaiknya di-resize untuk mengurangi bandwidth

4. **Cache images**: Flutter akan cache image secara otomatis dengan `NetworkImage`

5. **Fallback icon**: Jika foto tidak ada atau error, akan tampil icon boy/girl sesuai jenis kelamin

## Files yang Dimodifikasi

1. `Backend/.env`
2. `Backend/app/Http/Controllers/Api/WaliController.php`
3. `mobile/lib/config/app_config.dart`
4. `mobile/lib/models/santri_model.dart`
5. `mobile/lib/screens/home_screen.dart`

---

**Status**: ✅ Fixed
**Tanggal**: 30 November 2025
**Tested**: Android Emulator
