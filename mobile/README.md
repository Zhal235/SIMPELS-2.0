# SIMPELS Mobile

Aplikasi PWA (Progressive Web App) untuk Wali Santri - SIMPELS 2.0

## Fitur Utama

- 📱 Login Wali Santri
- 👶 Lihat Data Santri (Anak)
- 💰 Cek Saldo Dompet Digital
- 📊 Riwayat Pembayaran
- 💳 Tunggakan & Tagihan
- 🔔 Notifikasi Real-time

## Tech Stack

- **Framework:** Flutter (Web, Android, iOS)
- **State Management:** Provider
- **API Client:** Dio
- **Backend:** Laravel (SIMPELS 2.0 Backend API)

## Setup

### Prerequisites

1. Install Flutter SDK: https://docs.flutter.dev/get-started/install/windows
2. Install VS Code dengan extensions:
   - Dart
   - Flutter

### Development

```bash
# Install dependencies
flutter pub get

# Run di browser (PWA mode)
flutter run -d chrome

# Run di Android emulator
flutter run -d android

# Build PWA untuk production
flutter build web
```

## Struktur Proyek

```
mobile/
├── lib/
│   ├── main.dart              # Entry point
│   ├── config/                # Config & constants
│   ├── models/                # Data models
│   ├── services/              # API services
│   ├── providers/             # State management
│   ├── screens/               # UI screens
│   ├── widgets/               # Reusable widgets
│   └── utils/                 # Helper functions
├── assets/                    # Images, icons, fonts
├── web/                       # PWA specific files
└── pubspec.yaml              # Dependencies
```

## API Backend

Backend URL: `http://localhost:8000/api`

Endpoints yang digunakan:
- `POST /api/auth/login` - Login wali santri
- `GET /api/wali/santri` - Data santri
- `GET /api/wali/wallet` - Saldo dompet
- `GET /api/wali/pembayaran` - Riwayat pembayaran
- `GET /api/wali/tunggakan` - Tunggakan

## License

Proprietary - SIMPELS 2.0
