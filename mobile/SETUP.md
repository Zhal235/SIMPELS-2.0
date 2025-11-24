# SIMPELS Mobile - Instalasi & Setup

## Status Proyek
✅ Struktur proyek Flutter telah dibuat
⏳ Menunggu instalasi Flutter SDK

## Instalasi Flutter SDK

### Windows
1. **Download Flutter SDK:**
   - Kunjungi: https://docs.flutter.dev/get-started/install/windows
   - Download file ZIP terbaru

2. **Extract Flutter:**
   ```powershell
   # Extract ke C:\flutter (atau lokasi pilihan Anda)
   Expand-Archive -Path flutter_windows_*.zip -DestinationPath C:\
   ```

3. **Tambahkan ke PATH:**
   - Buka "Edit the system environment variables"
   - Klik "Environment Variables"
   - Edit variabel "Path"
   - Tambahkan: `C:\flutter\bin`
   - Klik OK

4. **Verifikasi Instalasi:**
   ```powershell
   flutter doctor
   ```

5. **Install Dependencies (jika diperlukan):**
   ```powershell
   # Android Studio (untuk Android development)
   # Chrome (untuk web development - sudah terinstall)
   ```

## Setup Proyek

Setelah Flutter SDK terinstall:

```powershell
# Masuk ke folder mobile
cd "c:\Users\Rhezal Maulana\Documents\GitHub\SIMPELS-2.0\mobile"

# Install dependencies
flutter pub get

# Run di browser (PWA)
flutter run -d chrome

# Atau run di Android emulator
flutter run -d android
```

## Struktur Proyek

```
mobile/
├── lib/
│   ├── main.dart              ✅ Entry point
│   ├── config/
│   │   ├── app_config.dart    ✅ API endpoints
│   │   └── app_theme.dart     ✅ Theme & styling
│   ├── models/                ✅ Data models
│   │   ├── wali_model.dart
│   │   ├── santri_model.dart
│   │   ├── pembayaran_model.dart
│   │   └── tunggakan_model.dart
│   ├── services/
│   │   └── api_service.dart   ✅ API client (Dio)
│   ├── providers/
│   │   └── auth_provider.dart ✅ State management
│   ├── screens/               ✅ UI screens
│   │   ├── splash_screen.dart
│   │   ├── login_screen.dart
│   │   └── home_screen.dart
│   ├── utils/                 ✅ Helper functions
│   │   ├── storage_helper.dart
│   │   └── format_helper.dart
│   └── widgets/               📁 Reusable widgets (empty)
├── assets/                    📁 Images & icons (empty)
├── web/                       ✅ PWA files
│   ├── index.html
│   └── manifest.json
├── pubspec.yaml               ✅ Dependencies
├── analysis_options.yaml      ✅ Linter rules
├── .gitignore                 ✅
└── README.md                  ✅
```

## Fitur yang Sudah Dibuat

### ✅ Authentication
- Login screen dengan validasi
- Splash screen dengan auto-login check
- Auth provider dengan state management
- Token storage (SharedPreferences)

### ✅ UI/UX
- Material Design 3
- Custom theme (Blue primary)
- Google Fonts (Inter)
- Responsive layout

### ✅ API Integration
- Dio HTTP client
- API service dengan interceptors
- Auto token injection
- Error handling

### ✅ Models
- WaliModel
- SantriModel
- PembayaranModel
- TunggakanModel

### ✅ Screens
- Splash Screen
- Login Screen
- Home Screen dengan 4 tabs:
  - Dashboard
  - Pembayaran
  - Tunggakan
  - Profile

## Yang Masih Perlu Dikembangkan

### Backend (Laravel)
✅ API endpoints untuk wali santri sudah tersedia:
- `POST /api/auth/login` - Login wali ✅
- `GET /api/wali/santri` - Data santri ✅
- `GET /api/wali/wallet/{id}` - Saldo dompet ✅
- `GET /api/wali/pembayaran/{id}` - Riwayat pembayaran ✅
- `GET /api/wali/tunggakan/{id}` - Tunggakan ✅

**Login dengan Nomor HP:**
```
Nomor HP: [HP Ayah/Ibu dari data santri]
Password: 123456 (default semua)
```

**Contoh untuk Testing:**
- `081234567800` - Ayah Ahmad Putra & Budi Saputra
- `081234567900` - Ibu Ahmad Putra  
- `081234567902` - Ibu Dimas Pratama

> **Note:** Sistem login langsung menggunakan nomor HP dari database santri. Tidak perlu seeder khusus.

### Mobile App
⏳ Implementasi fitur lengkap:
- Detail santri
- Riwayat pembayaran lengkap
- Daftar tunggakan lengkap
- Top-up saldo
- Notifikasi push
- Edit profile

## Testing

```powershell
# Run tests
flutter test

# Run dengan hot reload
flutter run -d chrome --web-renderer html

# Build untuk production
flutter build web --release
```

## Deploy PWA

```powershell
# Build
flutter build web --release

# Output akan ada di: mobile/build/web/
# Upload folder tersebut ke hosting (Vercel, Netlify, dll)
```

## Catatan Penting

1. **API URL:** Ubah `AppConfig.apiBaseUrl` di `lib/config/app_config.dart` sesuai URL backend production Anda

2. **Icons:** Tambahkan icon app di folder `web/icons/` (192x192, 512x512)

3. **CORS:** Pastikan Backend Laravel sudah enable CORS untuk domain mobile app

4. **SSL:** Untuk production, gunakan HTTPS

## Support

Untuk bantuan lebih lanjut:
- Flutter Docs: https://docs.flutter.dev/
- Material Design: https://m3.material.io/
