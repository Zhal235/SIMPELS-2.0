# Fitur Ganti Password & Reset Password

Dokumentasi implementasi fitur ganti password untuk mobile app dan reset password untuk semua user.

## Status
✅ **Selesai diimplementasikan** - 1 Desember 2025

## Fitur yang Ditambahkan

### 1. **Ganti Password untuk Wali (Mobile App)**

#### Backend
- **Model**: `PasswordWali` untuk menyimpan password custom wali
- **Migration**: `2025_12_01_165550_create_password_wali_table.php`
- **Tabel**: `password_wali`
  - `id`: Primary key
  - `no_hp`: Nomor HP wali (unique)
  - `password`: Password yang di-hash
  - `timestamps`: Created & updated at

#### API Endpoints
```
POST /api/wali/change-password
```
**Request Body**:
```json
{
  "no_hp": "081234567890",
  "current_password": "123456",
  "new_password": "password_baru",
  "new_password_confirmation": "password_baru"
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

#### Cara Kerja
1. **Login Default**: Password default tetap `123456`
2. **Setelah Ganti Password**: System akan check custom password di tabel `password_wali`
3. **Login Flow**:
   - Check apakah wali punya custom password
   - Jika ada, validasi dengan custom password
   - Jika tidak ada, gunakan password default `123456`

#### Mobile App
- **Screen**: `ChangePasswordScreen` 
- **File**: `mobile/lib/screens/change_password_screen.dart`
- **Akses**: Via tab **Profile** → "Ubah Password"

**Fitur UI**:
- Form dengan 3 field:
  - Password Lama
  - Password Baru (min 6 karakter)
  - Konfirmasi Password Baru
- Toggle show/hide password
- Validasi form
- Info card dengan instruksi
- Loading state

---

### 2. **Reset Password untuk Admin/User (Web Dashboard)**

#### Backend
- **Migration**: `2025_12_01_165603_create_password_reset_tokens_table.php`
- **Tabel**: `password_reset_tokens`
  - `email`: Primary key
  - `token`: Reset token
  - `created_at`: Timestamp

#### API Endpoints

**Forgot Password** (Send reset link):
```
POST /api/forgot-password
```
**Request**:
```json
{
  "email": "user@example.com"
}
```

**Reset Password** (Using token):
```
POST /api/reset-password
```
**Request**:
```json
{
  "token": "reset_token",
  "email": "user@example.com",
  "password": "new_password",
  "password_confirmation": "new_password"
}
```

**Change Password** (Authenticated user):
```
POST /api/change-password
```
**Headers**: `Authorization: Bearer {token}`
**Request**:
```json
{
  "current_password": "old_password",
  "new_password": "new_password",
  "new_password_confirmation": "new_password"
}
```

---

## Database Schema

### Tabel `password_wali`
```sql
CREATE TABLE password_wali (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    no_hp VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_no_hp (no_hp)
);
```

### Tabel `password_reset_tokens`
```sql
CREATE TABLE password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL
);
```

---

## Testing

### Test Ganti Password (Mobile)
1. Login dengan password default `123456`
2. Klik menu 3 titik → "Ubah Password"
3. Masukkan:
   - Password lama: `123456`
   - Password baru: `password123`
   - Konfirmasi: `password123`
4. Submit
5. Logout dan login kembali dengan password baru

### Test Reset Password (Web)
1. Di halaman login, klik "Lupa Password"
2. Masukkan email
3. Check email untuk link reset
4. Klik link dan masukkan password baru
5. Login dengan password baru

---

## Admin Features

### Reset Password Wali (Web Dashboard)

Admin bisa reset password wali santri yang lupa password mereka.

**Halaman**: Pengaturan → Reset Password Wali  
**Route**: `/pengaturan/reset-password-wali`

**API Endpoints**:
```
GET  /api/admin/wali/check-password/{noHp}  - Check wali account
POST /api/admin/wali/reset-password         - Reset to default
```

**Fitur**:
- ✅ Search wali by nomor HP
- ✅ Tampilkan info santri terkait
- ✅ Status password (default/custom)
- ✅ Reset ke password default (123456)
- ✅ Konfirmasi dialog
- ✅ Toast notifications

**Flow**:
1. Wali lupa password → Hubungi admin
2. Admin buka halaman Reset Password Wali
3. Input nomor HP wali → Search
4. Verifikasi data santri
5. Klik "Reset Password ke Default"
6. Informasikan ke wali: password = 123456
7. Anjurkan wali ubah password setelah login

---

## TODO / Future Improvements

### Security
- [ ] Implementasi rate limiting untuk prevent brute force
- [ ] Add password complexity requirements
- [ ] Password expiry policy
- [ ] Two-factor authentication (2FA)
- [ ] Audit log untuk password reset

---

## Migration Commands

Untuk apply migrations:
```bash
cd Backend
php artisan migrate
```

Untuk rollback jika ada masalah:
```bash
php artisan migrate:rollback --step=2
```

---

## File Changes Summary

### Backend
- `app/Http/Controllers/Api/AuthController.php` - Added password methods
- `app/Http/Controllers/API/WaliController.php` - Updated login & added changePassword
- `app/Models/PasswordWali.php` - New model
- `database/migrations/2025_12_01_165550_create_password_wali_table.php` - New
- `database/migrations/2025_12_01_165603_create_password_reset_tokens_table.php` - New
- `routes/api.php` - Added new routes

### Mobile
- `lib/services/api_service.dart` - Added changePassword method
- `lib/screens/change_password_screen.dart` - New screen
- `lib/screens/home_screen.dart` - Added menu item
- `lib/main.dart` - Added route

---

## Notes

1. **Password Default**: Semua wali baru masih menggunakan password default `123456` sampai mereka ubah sendiri
2. **Security**: Password di-hash menggunakan bcrypt via Laravel Hash facade
3. **Validation**: 
   - Password minimal 6 karakter
   - Harus konfirmasi password
   - Old password harus benar
4. **UX**: User-friendly error messages dalam Bahasa Indonesia

