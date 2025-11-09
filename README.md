# SIMPELS-2.0 Monorepo (Frontend & Backend)

Struktur telah dipisah menjadi dua proyek:

- frontend/ — proyek UI mandiri menggunakan Vite + TypeScript + TailwindCSS
- Backend/ — aplikasi Laravel (backend API + server sisi server)

## Menjalankan pengembangan

Frontend:
- cd frontend
- npm run dev
- Buka http://localhost:5173/

Backend (Laravel):
- cd Backend
- php artisan serve
- Buka http://127.0.0.1:8000/

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

## Catatan

- Tidak ada perubahan pada business logic, routing, dan alur aplikasi Laravel — hanya pemisahan folder.
- Jika sebelumnya Anda menjalankan perintah di `laravel/`, gunakan `Backend/` sebagai pengganti.
- Untuk seeding yang telah dibuat: `php artisan db:seed` dari folder `Backend/`.