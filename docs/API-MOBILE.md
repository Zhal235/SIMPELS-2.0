# Backend API untuk SIMPELS Mobile

## Endpoints yang Dibutuhkan

Berikut adalah API endpoints yang perlu dibuat di Backend Laravel untuk mendukung SIMPELS Mobile (Wali Santri).

### 1. Authentication

#### POST `/api/auth/login`
Login untuk wali santri.

**Request:**
```json
{
  "email": "wali@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "nama": "Ahmad Wali",
    "email": "wali@example.com",
    "no_hp": "081234567890",
    "alamat": "Jl. Contoh No. 123"
  }
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Email atau password salah"
}
```

---

### 2. Data Santri

#### GET `/api/wali/santri`
Mendapatkan daftar santri yang menjadi tanggung jawab wali.

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nis": "2024001",
      "nama": "Muhammad Rizki",
      "jenis_kelamin": "L",
      "kelas": "1 KMI",
      "asrama": "Ar-Rahman",
      "foto_url": "https://example.com/foto.jpg",
      "saldo_dompet": 500000
    }
  ]
}
```

---

### 3. Wallet/Dompet Digital

#### GET `/api/wali/wallet/{santri_id}`
Mendapatkan detail saldo dan transaksi dompet santri.

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "santri_id": 1,
    "santri_nama": "Muhammad Rizki",
    "saldo": 500000,
    "limit_harian": 50000,
    "limit_tersisa": 30000,
    "transaksi_terakhir": [
      {
        "id": 1,
        "tanggal": "2024-11-24 10:30:00",
        "keterangan": "Pembelian di Kantin",
        "jumlah": 15000,
        "tipe": "debit",
        "saldo_akhir": 485000
      }
    ]
  }
}
```

---

### 4. Riwayat Pembayaran

#### GET `/api/wali/pembayaran/{santri_id}`
Mendapatkan riwayat pembayaran santri.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `bulan` (optional): Filter by bulan (1-12)
- `tahun` (optional): Filter by tahun (e.g., 2024)
- `limit` (optional): Limit data (default: 50)

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tanggal": "2024-11-01",
      "jenis_tagihan": "SPP",
      "bulan": "November",
      "tahun": 2024,
      "jumlah": 500000,
      "metode_pembayaran": "Transfer Bank",
      "status": "lunas",
      "bukti_url": "https://example.com/bukti.jpg"
    },
    {
      "id": 2,
      "tanggal": "2024-10-15",
      "jenis_tagihan": "Makan",
      "bulan": "Oktober",
      "tahun": 2024,
      "jumlah": 750000,
      "metode_pembayaran": "Cash",
      "status": "lunas",
      "bukti_url": null
    }
  ],
  "total": 1250000
}
```

---

### 5. Tunggakan

#### GET `/api/wali/tunggakan/{santri_id}`
Mendapatkan daftar tunggakan santri.

**Headers:**
```
Authorization: Bearer {token}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "jenis_tagihan": "SPP",
      "bulan": "Desember",
      "tahun": 2024,
      "jumlah": 500000,
      "sudah_dibayar": 200000,
      "sisa": 300000,
      "status": "belum_lunas",
      "jatuh_tempo": "2024-12-10"
    },
    {
      "id": 2,
      "jenis_tagihan": "Buku",
      "bulan": null,
      "tahun": 2024,
      "jumlah": 350000,
      "sudah_dibayar": 0,
      "sisa": 350000,
      "status": "belum_lunas",
      "jatuh_tempo": "2024-11-30"
    }
  ],
  "total_tunggakan": 650000
}
```

---

## Implementasi di Laravel

### 1. Create Controller

```bash
php artisan make:controller Api/WaliController
```

### 2. Routes (routes/api.php)

```php
use App\Http\Controllers\Api\WaliController;

Route::prefix('auth')->group(function () {
    Route::post('login', [WaliController::class, 'login']);
});

Route::middleware('auth:sanctum')->prefix('wali')->group(function () {
    Route::get('santri', [WaliController::class, 'getSantri']);
    Route::get('wallet/{santri_id}', [WaliController::class, 'getWallet']);
    Route::get('pembayaran/{santri_id}', [WaliController::class, 'getPembayaran']);
    Route::get('tunggakan/{santri_id}', [WaliController::class, 'getTunggakan']);
});
```

### 3. Database

Tambahkan kolom `wali_id` di tabel `santri` atau buat tabel relasi `wali_santri`:

```sql
ALTER TABLE santri ADD COLUMN wali_id INT UNSIGNED NULL;
ALTER TABLE santri ADD FOREIGN KEY (wali_id) REFERENCES users(id);
```

Atau buat tabel relasi (jika 1 santri bisa punya multiple wali):

```sql
CREATE TABLE wali_santri (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wali_id INT UNSIGNED NOT NULL,
  santri_id INT UNSIGNED NOT NULL,
  hubungan VARCHAR(50), -- 'ayah', 'ibu', 'wali'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wali_id) REFERENCES users(id),
  FOREIGN KEY (santri_id) REFERENCES santri(id)
);
```

### 4. CORS Configuration

Update `config/cors.php`:

```php
'paths' => ['api/*'],
'allowed_origins' => ['*'], // Atau domain spesifik untuk production
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

## Testing

Gunakan Postman atau cURL untuk testing:

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wali@test.com","password":"password"}'

# Get Santri
curl -X GET http://localhost:8000/api/wali/santri \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Notes

1. **Authentication:** Gunakan Laravel Sanctum untuk token-based auth
2. **Authorization:** Pastikan wali hanya bisa akses data santri mereka sendiri
3. **Rate Limiting:** Implement rate limiting untuk prevent abuse
4. **Input Validation:** Validate semua input dari mobile app
5. **HTTPS:** Gunakan HTTPS di production
