# Unified Payment System - Dokumentasi

## Perubahan

Sistem pembayaran dan top-up telah **disatukan** menjadi satu halaman untuk mempermudah user experience.

### File yang Diubah/Ditambahkan

1. **mobile/lib/screens/unified_payment_screen.dart** (BARU)
   - Screen tunggal untuk semua jenis transaksi
   - Mendukung 3 mode:
     * Pembayaran tagihan saja
     * Top-up dompet saja
     * Pembayaran tagihan + Top-up sekaligus

2. **mobile/lib/screens/tagihan_detail_screen.dart** (DIPERBARUI)
   - Sekarang hanya wrapper yang redirect ke UnifiedPaymentScreen
   - Backward compatibility terjaga

3. **mobile/lib/screens/wallet_history_screen.dart** (DIPERBARUI)
   - Navigasi top-up sekarang menggunakan UnifiedPaymentScreen

4. **mobile/lib/main.dart** (DIPERBARUI)
   - Route `/upload-bukti` sekarang menggunakan UnifiedPaymentScreen
   - Auto-detect mode berdasarkan parameter

5. **Backend/app/Http/Controllers/Api/WaliController.php** (DIPERBARUI)
   - Method `uploadBukti()` sekarang mendukung:
     * `tagihan_ids` nullable (untuk top-up only)
     * `nominal_topup` untuk menambahkan top-up ke pembayaran

### File yang DIHAPUS
- ❌ **mobile/lib/screens/upload_bukti_screen.dart** - Tidak digunakan lagi
- ❌ **mobile/lib/screens/upload_bukti_topup_screen.dart** - Tidak digunakan lagi

## Fitur

### 1. Upload Bukti untuk Pembayaran Tagihan
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => UnifiedPaymentScreen(
      tagihan: tagihanData,
      isTopupOnly: false,
    ),
  ),
);
```

### 2. Upload Bukti untuk Top-up Dompet
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => UnifiedPaymentScreen(
      isTopupOnly: true,
      topupNominal: 50000,
      santriName: 'Ahmad',
    ),
  ),
);
```

### 3. Pembayaran + Top-up Sekaligus
Di halaman pembayaran tagihan, user bisa centang checkbox "Sekaligus top-up dompet" untuk menambahkan nominal top-up.

## Perbaikan Bug

### Bug Web Platform
**Masalah:** Error `Image.file is not supported on Flutter Web` saat upload bukti transfer.

**Solusi:**
- Mengganti `file_picker` dengan `image_picker`
- Menggunakan `Uint8List` untuk web platform
- Conditional rendering: `Image.memory()` untuk web, `Image.file()` untuk mobile

### Backend Validation
**Masalah:** Backend memerlukan `tagihan_ids` bahkan untuk top-up only.

**Solusi:**
- Validasi `tagihan_ids` sekarang `nullable`
- Backend mendeteksi jenis transaksi dari kombinasi `tagihan_ids` dan `nominal_topup`

## API Endpoint

### POST /wali/upload-bukti/{santri_id}
**Parameters:**
- `tagihan_ids[]` (nullable) - Array ID tagihan
- `total_nominal` (required) - Total nominal pembayaran + top-up
- `nominal_topup` (nullable) - Nominal top-up
- `bukti` (required) - File gambar bukti transfer
- `catatan` (nullable) - Catatan dari wali

**Response:**
```json
{
  "success": true,
  "message": "Bukti transfer berhasil dikirim. Tunggu konfirmasi admin.",
  "data": {
    "id": 1,
    "jenis_transaksi": "pembayaran_topup",
    "status": "pending",
    ...
  }
}
```

## Jenis Transaksi
- `pembayaran` - Pembayaran tagihan saja
- `topup` - Top-up dompet saja
- `pembayaran_topup` - Pembayaran tagihan + Top-up sekaligus

## Testing
Pastikan untuk test semua skenario:
1. ✅ Upload bukti pembayaran tagihan
2. ✅ Upload bukti top-up dompet
3. ✅ Upload bukti pembayaran + top-up sekaligus
4. ✅ Web platform (Chrome)
5. ✅ Mobile platform (Android/iOS)
6. ✅ Admin approval untuk semua jenis transaksi
