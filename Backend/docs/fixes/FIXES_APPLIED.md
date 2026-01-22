# Payment Recording Fixes - BuktiTransfer Transfer Method

## Issue
Transaksi pembayaran santri tercatat di tabel `pembayaran` tetapi tidak tercatat di `transaksi_kas` (buku kas), terutama untuk pembayaran via bukti transfer yang disetujui admin.

## Root Cause
Method `AdminBuktiTransferController->approve()` menciptakan record `Pembayaran` tetapi **tidak membuat corresponding `TransaksiKas` record** untuk mencatat pemasukan ke buku kas.

## Fixes Applied

### 1. Added TransaksiKas Import
**File:** `Backend/app/Http/Controllers/Api/AdminBuktiTransferController.php`

```php
use App\Models\TransaksiKas;
```

Added import untuk menggunakan model TransaksiKas dalam controller.

### 2. Create TransaksiKas Record in approve() Method
**File:** `Backend/app/Http/Controllers/Api/AdminBuktiTransferController.php`

Ditambahkan logic untuk membuat `TransaksiKas` record setelah `Pembayaran` record dibuat:

```php
// Catat sebagai transaksi pemasukan di buku kas
$maxRetries = 5;
$transaksiKasCreated = false;

for ($i = 0; $i < $maxRetries; $i++) {
    try {
        $noTransaksiKas = TransaksiKas::generateNoTransaksi('pemasukan');
        
        // Add random suffix if retry
        if ($i > 0) {
            $noTransaksiKas .= '-' . $i;
        }
        
        TransaksiKas::create([
            'buku_kas_id' => $bukuKasId,
            'no_transaksi' => $noTransaksiKas,
            'tanggal' => now(),
            'jenis' => 'pemasukan',
            'metode' => 'transfer',  // ← Metode transfer dijamin
            'kategori' => 'Pembayaran Tagihan',
            'nominal' => $nominalBayar,
            'keterangan' => 'Pembayaran ' . $tagihan->jenisTagihan->nama_tagihan . ' - ' . $tagihan->bulan . ' ' . $tagihan->tahun . ' (via bukti transfer)',
            'pembayaran_id' => $pembayaran->id,
        ]);
        
        $transaksiKasCreated = true;
        break;
    } catch (\Illuminate\Database\QueryException $e) {
        if ($e->getCode() !== '23000') {
            throw $e;
        }
        // Retry dengan suffix baru
        usleep(100000);
    }
}

if (!$transaksiKasCreated) {
    throw new \Exception('Gagal membuat transaksi kas setelah beberapa percobaan');
}
```

### 3. Metode Pembayaran Dijamin "transfer"
- `'metode_pembayaran' => 'transfer'` di tabel `pembayaran`
- `'metode' => 'transfer'` di tabel `transaksi_kas`
- Memastikan konsistensi metode pembayaran untuk semua bukti transfer yang disetujui

## Data Flow After Fix

```
Admin Approve Bukti Transfer
    ↓
1. Update TagihanSantri (dibayar, sisa, status)
    ↓
2. Create Pembayaran record
   - metode_pembayaran: 'transfer'
   - bukti_pembayaran: bukti path
    ↓
3. Create TransaksiKas record (NEW)
   - jenis: 'pemasukan'
   - metode: 'transfer'
   - pembayaran_id: linked to Pembayaran
    ↓
4. Update BuktiTransfer status to 'approved'
    ↓
5. Return success response
```

## Verification
- Setiap pembayaran via bukti transfer akan tercatat di kedua tabel:
  - `pembayaran` table - untuk tracking detail pembayaran per santri
  - `transaksi_kas` table - untuk laporan keuangan dan buku kas
- Metode pembayaran dijamin konsisten: `transfer`
- Link antara `pembayaran` dan `transaksi_kas` melalui `pembayaran_id`

## Testing
Untuk memverifikasi fix:
1. Login sebagai admin
2. Navigasi ke menu "Bukti Transfer"
3. Approve sebuah bukti transfer
4. Cek di database:
   - `SELECT * FROM pembayaran WHERE metode_pembayaran = 'transfer'`
   - `SELECT * FROM transaksi_kas WHERE pembayaran_id IS NOT NULL AND metode = 'transfer'`
   - Jumlah record harus sama dan nominal cocok

