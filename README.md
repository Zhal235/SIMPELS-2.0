# SIMPELS 2.0 - Sistem Manajemen Pesantren

Sistem manajemen pesantren berbasis web yang terdiri dari:

- **frontend/** — Aplikasi UI menggunakan React 19 + Vite + TypeScript + TailwindCSS
- **Backend/** — Backend API menggunakan Laravel 12 + PHP 8.2

## 📋 Fitur Utama

- Manajemen Data Santri
- Manajemen Keuangan (Tagihan & Pembayaran)
- Manajemen Kelas
- Manajemen Asrama
- Manajemen Tahun Ajaran
- Pelaporan dan Dashboard

## Menjalankan pengembangan

Frontend:
- cd frontend
- npm run dev
- Buka http://localhost:5173/

Backend (Laravel):
- cd Backend
- php artisan serve
- Buka http://127.0.0.1:8001/

## Build produksi

Frontend (build statis):
- cd frontend
- npm run build
- Hasil build ada di `frontend/dist/`
- Opsi deploy:
  - Sajikan langsung via CDN/hosting statis (Nginx/Apache/Vercel/Netlify)
  - Atau salin ke `Backend/public/frontend` dan referensikan aset dari Blade

Backend (Laravel):
- cd Backend
- composer install --no-dev --optimize-autoloader
- php artisan config:cache
- php artisan route:cache
- php artisan view:cache
- Pastikan `.env` produksi sudah diset (APP_ENV=production, APP_DEBUG=false, SESSION_SECURE_COOKIE=true, dsb.)

## 📚 Dokumentasi

- **[SERVER_SPECIFICATIONS.md](SERVER_SPECIFICATIONS.md)** - Spesifikasi server lengkap (Bahasa Indonesia)
  - Spesifikasi hardware untuk berbagai skala deployment
  - Konfigurasi web server (Nginx/Apache)
  - Konfigurasi database dan caching
  - Rekomendasi keamanan dan monitoring
  - Estimasi biaya operasional

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Panduan deployment cepat (English)
  - Installation steps untuk Ubuntu 22.04 LTS
  - Konfigurasi environment
  - Setup SSL/HTTPS
  - Strategi backup dan monitoring
  - Troubleshooting umum

## 💻 Persyaratan Sistem

### Development
- PHP 8.2+
- Node.js 18+
- Composer 2.x
- MySQL 8.0+ / PostgreSQL 14+ / SQLite
- 4 GB RAM minimum

### Production (Small Scale)
- 2 vCPU
- 4-8 GB RAM
- 50 GB SSD
- Nginx/Apache + PHP-FPM
- MySQL/PostgreSQL + Redis

Lihat [SERVER_SPECIFICATIONS.md](SERVER_SPECIFICATIONS.md) untuk spesifikasi lengkap.

## Catatan

- Tidak ada perubahan pada business logic, routing, dan alur aplikasi Laravel — hanya pemisahan folder.
- Jika sebelumnya Anda menjalankan perintah di `laravel/`, gunakan `Backend/` sebagai pengganti.
- Untuk seeding yang telah dibuat: `php artisan db:seed` dari folder `Backend/`.