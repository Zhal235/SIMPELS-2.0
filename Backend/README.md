# SIMPELS Backend API

<div align="center">

**Sistem Informasi Pesantren Laravel (SIMPELS)**  
*Backend API Server*

**Powered by Bank Syariah Indonesia (BSI)**

---

*Solusi digital terpercaya untuk manajemen pesantren modern*

</div>

## Overview

SIMPELS Backend adalah REST API yang mengelola sistem informasi pesantren meliputi:
- Manajemen santri dan data pesantren
- Sistem tagihan dan pembayaran
- Digital wallet dan ePOS integration
- RFID system untuk transaksi
- Notifikasi dan pengumuman

## Quick Start

### Prerequisites
- PHP 8.1+
- Composer
- SQLite/MySQL
- Node.js (untuk asset compilation)

### Installation

1. **Clone dan Install Dependencies**
   ```bash
   git clone <repository>
   cd Backend
   composer install
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. **Database Setup**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

4. **Start Development Server**
   ```bash
   php artisan serve --port=8001
   ```

## API Features

### Core Systems
- **Authentication** - JWT-based authentication untuk admin & wali santri
- **Santri Management** - CRUD santri dan data pesantren
- **Financial System** - Tagihan, pembayaran, dan laporan keuangan
- **Digital Wallet** - E-wallet santri dengan transaction limits
- **ePOS Integration** - RFID-based point of sale system
- **Notifications** - Push notifications dan announcements

### Security Features
- Role-based access control (Admin/User)
- JWT token authentication
- CORS configuration
- Input validation dan sanitization
- Global minimum balance enforcement

## Project Structure

```
Backend/
├── app/
│   ├── Http/Controllers/    # API Controllers
│   ├── Models/             # Eloquent Models
│   └── Services/           # Business Logic
├── config/                 # Configuration files
├── database/
│   ├── migrations/         # Database migrations
│   └── seeders/           # Database seeders
├── docs/                  # Documentation
│   ├── deployment/        # Deployment guides
│   ├── fixes/            # Bug fixes documentation
│   └── archive/          # Archived files
├── routes/api.php         # API routes
└── storage/              # File storage
```

## API Documentation

### Base URL
- Development: `http://localhost:8001/api`
- Production: `https://api.saza.sch.id/api`

### Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "no_hp": "08123456789",
  "password": "123456"
}
```

### Key Endpoints
- **Authentication**: `/auth/*`
- **Santri Management**: `/santri/*`
- **Wallet Operations**: `/wallet/*`
- **ePOS Transactions**: `/epos/*`
- **Notifications**: `/notifications/*`

## Development

### Running Tests
```bash
php artisan test
```

### Code Style
```bash
composer run-script phpcs
composer run-script phpcbf
```

### Asset Compilation
```bash
npm run dev      # Development
npm run build    # Production
```

## Deployment

Lihat panduan deployment di [`docs/deployment/`](docs/deployment/)

## Support

Untuk pertanyaan teknis atau bug report, silakan buat issue di repository ini.

---

**© 2026 SIMPELS - Bank Syariah Indonesia**
