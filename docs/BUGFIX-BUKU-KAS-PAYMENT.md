# Fix: Pembayaran Mobile Tidak Masuk ke Buku Kas yang Sesuai

## Masalah
Ketika pembayaran dilakukan via mobile dan disetujui admin, pembayaran masuk ke satu buku kas saja (biasanya yang pertama ditemukan) dan tidak sesuai dengan buku kas dari jenis tagihan.

**Contoh Kasus:**
- Santri bayar tagihan dari 2 jenis:
  - BERAS (Oktober 2025): Rp 150.000 → seharusnya masuk ke Buku Kas BERAS
  - BERAS (September 2025): Rp 150.000 → seharusnya masuk ke Buku Kas BERAS  
  - BMP (Oktober 2025): Rp 400.000 → seharusnya masuk ke Buku Kas BMP

**Yang Terjadi Sebelumnya:**
- Semua pembayaran (Rp 700.000) masuk ke Buku Kas BMP saja
- Buku Kas BERAS tidak bertambah

## Root Cause
Di `AdminBuktiTransferController->approve()`, kode menggunakan buku kas pertama untuk semua pembayaran:

```php
// ❌ KODE LAMA (SALAH)
$bukuKasId = DB::table('buku_kas')->value('id');
```

Kode ini mengambil ID buku kas pertama yang ditemukan di database, bukan buku kas yang sesuai dengan jenis tagihan.

## Solusi
Setiap `JenisTagihan` memiliki relasi ke `BukuKas` melalui field `buku_kas_id`. Kita harus menggunakan buku kas yang sesuai dengan jenis tagihan:

```php
// ✅ KODE BARU (BENAR)
// Eager load jenisTagihan relation
$tagihans = TagihanSantri::with('jenisTagihan')->whereIn('id', $bukti->tagihan_ids)->get();

// Get buku_kas_id from jenis tagihan
$bukuKasId = null;
if ($tagihan->jenisTagihan && $tagihan->jenisTagihan->buku_kas_id) {
    $bukuKasId = $tagihan->jenisTagihan->buku_kas_id;
} else {
    // Fallback to first buku kas if jenis tagihan doesn't have buku_kas_id
    $bukuKasId = DB::table('buku_kas')->value('id');
}
```

## File yang Diubah

### 1. `Backend/app/Http/Controllers/Api/AdminBuktiTransferController.php`

**Line 192-195:**
```php
// BEFORE
$tagihans = TagihanSantri::whereIn('id', $bukti->tagihan_ids)->get();

// AFTER  
$tagihans = TagihanSantri::with('jenisTagihan')->whereIn('id', $bukti->tagihan_ids)->get();
```

**Line 217-227:**
```php
// BEFORE
$bukuKasId = DB::table('buku_kas')->value('id');
if (!$bukuKasId) {
    $bukuKasId = DB::table('buku_kas')->insertGetId([...]);
}

// AFTER
$bukuKasId = null;
if ($tagihan->jenisTagihan && $tagihan->jenisTagihan->buku_kas_id) {
    $bukuKasId = $tagihan->jenisTagihan->buku_kas_id;
} else {
    // Fallback to first buku kas if jenis tagihan doesn't have buku_kas_id
    $bukuKasId = DB::table('buku_kas')->value('id');
    if (!$bukuKasId) {
        $bukuKasId = DB::table('buku_kas')->insertGetId([...]);
    }
}
```

## Relasi Data

```
JenisTagihan (BERAS)
├── buku_kas_id: 1 (Buku Kas BERAS)
└── TagihanSantri
    └── Pembayaran → buku_kas_id: 1 ✅

JenisTagihan (BMP)
├── buku_kas_id: 2 (Buku Kas BMP)
└── TagihanSantri
    └── Pembayaran → buku_kas_id: 2 ✅
```

## Testing

1. **Setup:**
   - Buat 2 jenis tagihan dengan buku kas berbeda
   - Generate tagihan untuk santri dari kedua jenis

2. **Test Case:**
   - Di mobile, santri upload bukti transfer untuk bayar tagihan dari kedua jenis
   - Admin approve bukti transfer
   
3. **Expected Result:**
   - Pembayaran untuk tagihan BERAS masuk ke Buku Kas BERAS
   - Pembayaran untuk tagihan BMP masuk ke Buku Kas BMP
   - Saldo masing-masing buku kas bertambah sesuai nominal pembayaran
   - Total saldo tetap sama (Rp 700.000 dalam contoh)

## Catatan

- Fix ini memastikan setiap pembayaran masuk ke buku kas yang sesuai dengan jenis tagihan
- Jika jenis tagihan tidak memiliki `buku_kas_id`, sistem akan fallback ke buku kas pertama (untuk backward compatibility)
- Kode di `PembayaranController.php` sudah benar sejak awal, hanya `AdminBuktiTransferController` yang perlu diperbaiki

## Memperbaiki Data Yang Sudah Salah

Jika ada data pembayaran yang sudah masuk ke buku kas yang salah sebelum fix ini diterapkan, gunakan salah satu cara berikut untuk memperbaikinya:

### Opsi 1: Menggunakan Artisan Command (RECOMMENDED) ⭐

Cara paling mudah dan aman:

```bash
cd Backend

# Cek dulu tanpa mengubah data (dry-run)
php artisan fix:buku-kas-data --dry-run

# Jika sudah yakin, jalankan untuk fix data
php artisan fix:buku-kas-data

# Atau jika ingin fix dari tanggal tertentu
php artisan fix:buku-kas-data --from=2025-11-01
```

Command ini akan:
1. ✅ Mencari semua pembayaran yang masuk ke buku kas salah
2. ✅ Menampilkan daftar pembayaran yang bermasalah dalam tabel
3. ✅ Meminta konfirmasi
4. ✅ Memperbaiki `buku_kas_id` di tabel `pembayaran` dan `transaksi_kas`
5. ✅ Menampilkan progress bar dan summary

### Opsi 2: Menggunakan Script PHP

Script tersedia di `Backend/tools/fix_buku_kas_data.php`. Jalankan dengan:

```bash
cd Backend
php tools/fix_buku_kas_data.php
```

**Catatan:** Script ini memerlukan MySQL server berjalan dan tidak berfungsi dengan SQLite.

### Opsi 2: SQL Manual

Jika ingin memperbaiki manual via SQL:

```sql
-- Step 1: Cek pembayaran yang buku_kas_id-nya salah
SELECT 
    p.id AS pembayaran_id,
    p.buku_kas_id AS current_buku_kas_id,
    jt.buku_kas_id AS correct_buku_kas_id,
    jt.nama_tagihan,
    s.nama_lengkap,
    p.nominal_bayar,
    p.tanggal_bayar,
    bk1.nama_kas AS current_kas_name,
    bk2.nama_kas AS correct_kas_name
FROM pembayaran p
INNER JOIN tagihan_santri ts ON p.tagihan_santri_id = ts.id
INNER JOIN jenis_tagihan jt ON ts.jenis_tagihan_id = jt.id
INNER JOIN santris s ON p.santri_id = s.id
LEFT JOIN buku_kas bk1 ON p.buku_kas_id = bk1.id
LEFT JOIN buku_kas bk2 ON jt.buku_kas_id = bk2.id
WHERE p.buku_kas_id != jt.buku_kas_id
  AND p.tanggal_bayar >= '2025-12-01';

-- Step 2: Perbaiki pembayaran (ganti X dengan pembayaran_id dari Step 1)
START TRANSACTION;

-- Update pembayaran
UPDATE pembayaran p
INNER JOIN tagihan_santri ts ON p.tagihan_santri_id = ts.id
INNER JOIN jenis_tagihan jt ON ts.jenis_tagihan_id = jt.id
SET p.buku_kas_id = jt.buku_kas_id
WHERE p.buku_kas_id != jt.buku_kas_id
  AND p.tanggal_bayar >= '2025-12-01';

-- Update transaksi_kas yang terkait
UPDATE transaksi_kas tk
INNER JOIN pembayaran p ON tk.pembayaran_id = p.id
INNER JOIN tagihan_santri ts ON p.tagihan_santri_id = ts.id
INNER JOIN jenis_tagihan jt ON ts.jenis_tagihan_id = jt.id
SET tk.buku_kas_id = jt.buku_kas_id
WHERE tk.buku_kas_id != jt.buku_kas_id
  AND p.tanggal_bayar >= '2025-12-01';

COMMIT;

-- Step 3: Verifikasi tidak ada lagi yang salah
SELECT COUNT(*) AS still_wrong
FROM pembayaran p
INNER JOIN tagihan_santri ts ON p.tagihan_santri_id = ts.id
INNER JOIN jenis_tagihan jt ON ts.jenis_tagihan_id = jt.id
WHERE p.buku_kas_id != jt.buku_kas_id
  AND p.tanggal_bayar >= '2025-12-01';
-- Harusnya return 0
```

### Opsi 3: Via Laravel Tinker

```bash
cd Backend
php artisan tinker
```

```php
DB::transaction(function() {
    // Get wrong payments
    $wrongPayments = DB::table('pembayaran')
        ->join('tagihan_santri', 'pembayaran.tagihan_santri_id', '=', 'tagihan_santri.id')
        ->join('jenis_tagihan', 'tagihan_santri.jenis_tagihan_id', '=', 'jenis_tagihan.id')
        ->whereRaw('pembayaran.buku_kas_id != jenis_tagihan.buku_kas_id')
        ->where('pembayaran.tanggal_bayar', '>=', '2025-12-01')
        ->select('pembayaran.id', 'jenis_tagihan.buku_kas_id as correct_id')
        ->get();
    
    echo "Found " . $wrongPayments->count() . " wrong payments\n";
    
    foreach ($wrongPayments as $payment) {
        // Update pembayaran
        DB::table('pembayaran')
            ->where('id', $payment->id)
            ->update(['buku_kas_id' => $payment->correct_id]);
        
        // Update transaksi_kas
        DB::table('transaksi_kas')
            ->where('pembayaran_id', $payment->id)
            ->update(['buku_kas_id' => $payment->correct_id]);
        
        echo "Fixed pembayaran ID {$payment->id}\n";
    }
    
    echo "Done!\n";
});
```

## Status
✅ Fixed - 2 Desember 2025

**Catatan:** Setelah fix ini diterapkan, semua pembayaran baru akan otomatis masuk ke buku kas yang sesuai dengan jenis tagihannya.
