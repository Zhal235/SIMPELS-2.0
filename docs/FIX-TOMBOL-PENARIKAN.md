# 🔧 TROUBLESHOOTING: Tombol Buat Penarikan Tidak Berfungsi

## ✅ MASALAH SUDAH DIPERBAIKI

### 🐛 **Root Cause**
Error yang terjadi: **"Tidak bisa menarik Rp 3.000. Transaksi terkecil yang tersedia adalah Rp 33.000."**

**Penyebab:**
- Logic validation di `FinancialService::createWithdrawalRequest()` terlalu ketat
- Ketika user input nominal lebih kecil dari transaksi RFID terkecil, sistem reject request
- User mencoba tarik Rp 3.000, tapi transaksi terkecil yang ada adalah Rp 33.000

### 🔧 **Solusi yang Diterapkan**

#### 1. **Update Logic di `FinancialService.php`**
**Sebelum:**
```php
// Reject jika nominal lebih kecil dari transaksi terkecil
if ($totalAmount > $requestedAmount && $transactions->count() == 1) {
    throw new \Exception("Tidak bisa menarik...");
}
```

**Sesudah:**
```php
// Ambil transaksi dan rounded up otomatis
foreach ($sortedTransactions as $transaction) {
    $transactions->push($transaction);
    $currentTotal += $transaction->amount;
    
    // Stop jika sudah mencapai target
    if ($currentTotal >= $requestedAmount) {
        break;
    }
}

// Beri info jika total lebih besar (rounded up)
if ($totalAmount > $requestedAmount) {
    Log::info("Withdrawal amount adjusted (rounded up)");
}
```

**Behavior Baru:**
- ✅ Jika user input Rp 3.000 tapi transaksi terkecil Rp 33.000 → sistem ambil Rp 33.000
- ✅ Jika user input Rp 50.000 dan ada transaksi Rp 10.000 + Rp 20.000 + Rp 25.000 → sistem ambil sampai total ≥ Rp 50.000
- ✅ Jika user kosongkan nominal → sistem ambil **semua** transaksi yang belum ditarik

#### 2. **Update UI di `financial.blade.php`**
- ✅ Tambah informasi "rounded up" di form
- ✅ Tambah validation error display yang lebih jelas
- ✅ Tambah loading state pada tombol submit
- ✅ Tambah alert untuk menampilkan semua error validasi

#### 3. **Tambah Logging untuk Debug**
- ✅ Log saat method `createWithdrawal()` dipanggil
- ✅ Log available balance
- ✅ Log jika amount di-adjust (rounded up)

---

## 🧪 Cara Testing Setelah Fix

### **Test 1: Tarik Semua Saldo**
1. Buka modal "Tarik Saldo RFID"
2. **Kosongkan** field "Jumlah Penarikan"
3. Pilih metode: Tunai atau Transfer Bank
4. Klik "Buat Penarikan"
5. ✅ **Expected:** Berhasil, tarik semua saldo (Rp 33.000)

### **Test 2: Tarik Nominal Lebih Kecil (Rounded Up)**
1. Input nominal: **Rp 10.000**
2. Pilih metode: Tunai
3. Klik "Buat Penarikan"
4. ✅ **Expected:** Berhasil, sistem tarik Rp 33.000 (rounded up)
5. ✅ Check log: "Withdrawal amount adjusted"

### **Test 3: Tarik Nominal Pas atau Lebih Besar**
1. Input nominal: **Rp 33.000** atau lebih
2. Pilih metode: Tunai
3. Klik "Buat Penarikan"
4. ✅ **Expected:** Berhasil

### **Test 4: Validation Error**
1. Input nominal: **Rp 100**
2. Pilih metode: **Transfer Bank**
3. **Jangan** isi detail bank
4. Klik "Buat Penarikan"
5. ✅ **Expected:** Muncul error: "Nama bank harus diisi", dll

---

## 📝 Cara Menggunakan (Updated)

### **Langkah-Langkah:**

1. **Buka ePOS** → Login → **Manajemen Keuangan**

2. **Klik Tab "Penarikan RFID"** (tab ketiga)

3. **Klik "Tarik Saldo RFID"** (tombol biru kanan atas)

4. **Isi Form:**
   
   **A. Jumlah Penarikan:**
   - **Kosongkan** → Tarik **SEMUA** saldo (recommended)
   - **Isi nominal** → Sistem akan tarik transaksi sampai ≥ nominal
     - Contoh: Input Rp 10.000, sistem tarik Rp 33.000 (rounded up)
   
   **B. Metode Penarikan:**
   - **Tunai** → Tidak perlu isi detail bank
   - **Transfer Bank** → Wajib isi:
     - Nama Bank (contoh: BCA, Mandiri, BRI)
     - No Rekening
     - Nama Pemegang Rekening
   
   **C. Catatan:** (Opsional)

5. **Klik "Buat Penarikan"**

6. **Tunggu Loading** (tombol jadi disabled, muncul spinner)

7. **Notifikasi Sukses** atau **Error** akan muncul

---

## 🔍 Debug Checklist

Jika tombol masih tidak berfungsi, check:

### ✅ **1. Browser Console (F12)**
```javascript
// Check apakah ada error JavaScript
// Tekan F12 → Tab Console
// Cari error berwarna merah
```

### ✅ **2. Laravel Log**
```bash
cd "C:\Users\Rhezal Maulana\Documents\GitHub\EPOS_SAZA"
Get-Content storage\logs\laravel.log -Tail 50
```

**Yang harus ada:**
```
[INFO] createWithdrawal method called
[INFO] Available balance calculated
[INFO] Creating withdrawal request
[INFO] Withdrawal request created successfully
```

**Jika ada error:**
```
[ERROR] Failed to create withdrawal request
```
→ Lihat detail error-nya

### ✅ **3. Network Tab (F12 → Network)**
- Klik "Buat Penarikan"
- Check request ke `/livewire/update`
- Status harus **200 OK**
- Jika **500**: ada error di server
- Jika **422**: validation error

### ✅ **4. Livewire**
```javascript
// Di browser console, check:
window.Livewire

// Jika undefined, Livewire belum load
```

---

## ⚠️ Known Issues & Solutions

### Issue 1: Tombol Disabled Terus
**Cause:** Livewire loading state stuck
**Solution:**
```bash
# Clear cache
php artisan cache:clear
php artisan view:clear
php artisan config:clear

# Restart server
# Ctrl+C → php artisan serve
```

### Issue 2: Modal Tidak Muncul
**Cause:** JavaScript error atau Livewire conflict
**Solution:**
- Hard refresh: `Ctrl+Shift+R` atau `Ctrl+F5`
- Clear browser cache
- Check browser console for errors

### Issue 3: Form Submit Tapi Tidak Ada Respon
**Cause:** CSRF token expired atau Livewire version issue
**Solution:**
- Reload halaman
- Check `@csrf` token di form
- Pastikan Livewire scripts ter-load di layout

---

## 📊 Expected Behavior Summary

| Input Nominal | Saldo Tersedia | Hasil                        |
|---------------|----------------|------------------------------|
| Kosong        | Rp 33.000      | Tarik Rp 33.000 (semua)     |
| Rp 10.000     | Rp 33.000      | Tarik Rp 33.000 (rounded up)|
| Rp 33.000     | Rp 33.000      | Tarik Rp 33.000             |
| Rp 50.000     | Rp 33.000      | ❌ Error: Melebihi saldo    |

---

## ✅ Verification Steps

Setelah fix, pastikan:
1. ✅ Tombol "Buat Penarikan" clickable
2. ✅ Loading state muncul (spinner)
3. ✅ Notifikasi sukses/error muncul
4. ✅ Modal tertutup setelah sukses
5. ✅ Data muncul di tab "Penarikan RFID"
6. ✅ Log tidak ada error
7. ✅ Request ter-record di database
8. ✅ Request muncul di SIMPELS

---

**Status:** ✅ **FIXED**
**Date:** 23 November 2025
**Files Modified:**
- `app/Services/FinancialService.php`
- `resources/views/livewire/financial.blade.php`
- `app/Livewire/Financial.php`
