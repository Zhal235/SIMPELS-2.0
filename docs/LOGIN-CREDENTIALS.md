# Login Credentials - SIMPELS 2.0

## Mobile App (Wali Santri)

### Login dengan Nomor HP

Sistem login menggunakan **nomor HP wali santri** yang terdaftar di database (kolom `hp_ayah` dan `hp_ibu` pada tabel `santri`).

**Format Login:**
```
Nomor HP: [Nomor HP Ayah/Ibu dari database]
Password: 123456 (default untuk semua wali)
```

**Contoh Nomor HP untuk Testing:**
```
081234567800 - Ayah dari Ahmad Putra & Budi Saputra (Multi-Account)
081234567900 - Ibu dari Ahmad Putra
081234567801 - Ayah dari Budi Saputra
081234567902 - Ibu dari Dimas Pratama
```

**Format Nomor HP yang Didukung:**
- `08123456789` (dengan 0)
- `8123456789` (tanpa 0)
- `+628123456789` (dengan kode negara)
- `628123456789` (kode negara tanpa +)

Semua format akan dinormalisasi otomatis ke format `628xxx`.

### Fitur Multi-Account

Jika satu nomor HP terdaftar untuk beberapa santri (misalnya kakak-adik), sistem akan:
1. Menampilkan screen "Pilih Akun Santri"
2. Menampilkan card untuk setiap santri
3. User memilih santri yang ingin dilihat
4. User bisa switch account tanpa logout dari Profile

### Setup
Tidak perlu seeder khusus. Sistem langsung menggunakan data dari tabel `santri`.

---

## Web App (Admin)

Untuk login ke web admin panel:

### Admin User
```
Email: Admin.simpels@saza.sch.id
Password: ChangeMeNow!2025
```

> **⚠️ PENTING:** Ganti password admin setelah deployment ke production!

---

## API Endpoints

### Mobile App (Wali)
- Base URL: `http://localhost:8001/api`
- Login: `POST /api/auth/login`
- Endpoints:
  - `GET /api/wali/santri` - Daftar santri
  - `GET /api/wali/wallet/{santri_id}` - Info dompet santri
  - `GET /api/wali/pembayaran/{santri_id}` - Riwayat pembayaran
  - `GET /api/wali/tunggakan/{santri_id}` - Tunggakan santri

### Web Admin
- Base URL: `http://localhost:8001/api`
- Login: `POST /api/login`

---

## Troubleshooting

### Error 422 (Unprocessable Content) saat login
Penyebab:
- Email atau password salah
- User belum dibuat di database

Solusi:
1. Pastikan menggunakan kredensial yang benar (lihat di atas)
2. Jalankan seeder untuk membuat user:
   ```bash
   php artisan db:seed --class=WaliDemoSeeder
   php artisan db:seed --class=UserSeeder
   ```

### CORS Error
Jika muncul CORS error, pastikan:
1. File `Backend/config/cors.php` sudah configured dengan benar
2. Backend sudah dijalankan di port yang sesuai (default: 8001)
3. Frontend/Mobile URL sudah ditambahkan ke `allowed_origins_patterns`

### Connection Refused
Pastikan:
1. Backend Laravel sudah running: `php artisan serve --port=8001`
2. Database sudah di-migrate: `php artisan migrate`
3. Port 8001 tidak digunakan aplikasi lain

---

## Membuat User Baru

### Via Seeder (Recommended)
Edit file `Backend/database/seeders/WaliDemoSeeder.php` dan sesuaikan data user.

### Via Tinker
```bash
cd Backend
php artisan tinker
```

```php
use App\Models\User;

User::create([
    'name' => 'Nama Wali',
    'email' => 'email@example.com',
    'password' => 'password123', // akan di-hash otomatis
    'email_verified_at' => now(),
    'role' => 'wali',
]);
```

### Via API (if registration endpoint exists)
```bash
POST /api/register
{
  "name": "Nama Wali",
  "email": "email@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

---

## Security Notes

⚠️ **JANGAN** commit credentials ke git repository
⚠️ **JANGAN** gunakan password default di production
⚠️ **SELALU** ganti password setelah setup awal
⚠️ **GUNAKAN** environment variables untuk credentials production

---

Last updated: November 24, 2025
