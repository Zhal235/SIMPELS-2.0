# Implementasi Info Rekening Bank di Alur Pembayaran Mobile

## 📋 Overview
Menambahkan fitur informasi rekening bank di alur pembayaran mobile app, sehingga wali santri dapat melihat rekening tujuan transfer sebelum melakukan pembayaran.

---

## 🎯 Problem Statement
Sebelumnya, alur pembayaran langsung ke upload bukti transfer tanpa menampilkan informasi rekening bank. Wali harus mencari sendiri nomor rekening sekolah dari sumber lain (WhatsApp, spanduk, dll).

---

## ✅ Solution Implemented

### **New Payment Flow:**
```
1. Wali pilih tagihan → Klik "Bayar"
2. ✨ NEW: Screen "Informasi Pembayaran"
   - Tampilkan rekening bank aktif
   - Total pembayaran
   - Opsi tambah top-up
   - Tombol "Salin Nomor Rekening"
3. Klik "Saya Sudah Transfer"
4. Upload bukti transfer
5. Tunggu konfirmasi admin
```

---

## 📂 Files Created

### **Backend**
1. **Migration**: `2025_11_30_000001_create_bank_accounts_table.php`
   - Table untuk menyimpan data rekening bank

2. **Migration**: `2025_11_30_000002_add_selected_bank_id_to_bukti_transfer.php`
   - Tracking rekening mana yang dipilih wali

3. **Model**: `Backend/app/Models/BankAccount.php`
   - Model Laravel untuk bank_accounts

4. **Controller**: `Backend/app/Http/Controllers/BankAccountController.php`
   - CRUD API untuk admin panel

5. **Seeder**: `Backend/database/seeders/BankAccountSeeder.php`
   - Sample data rekening bank (BRI, BCA, Mandiri)

### **Frontend (Admin Panel)**
6. **Page**: `frontend/src/pages/keuangan/RekeningBank.tsx`
   - Halaman CRUD rekening bank untuk admin
   - Features: Add, Edit, Delete, Toggle Active, Sort

### **Mobile (Flutter)**
7. **Model**: `mobile/lib/models/bank_account.dart`
   - Model untuk data rekening bank

8. **Screen**: `mobile/lib/screens/payment_info_screen.dart`
   - Screen baru untuk menampilkan info pembayaran & rekening bank
   - Features:
     * List rekening bank dengan radio button
     * Copy nomor rekening ke clipboard
     * Tampilkan total pembayaran
     * Opsi tambah top-up (untuk pembayaran tagihan)
     * Important notes untuk wali

---

## 📝 Files Modified

### **Backend**
1. `Backend/app/Http/Controllers/Api/WaliController.php`
   - ✅ Added `getBankAccounts()` method
   - ✅ Updated `uploadBukti()` to accept `selected_bank_id`

2. `Backend/routes/api.php`
   - ✅ Added `/wali/bank-accounts` endpoint (mobile)
   - ✅ Added `/v1/keuangan/bank-accounts` CRUD endpoints (admin)

3. `Backend/app/Models/BuktiTransfer.php`
   - ✅ Added `selected_bank_id` to fillable
   - ✅ Added `selectedBank()` relationship

### **Frontend (Admin Panel)**
4. `frontend/src/components/Sidebar.tsx`
   - ✅ Added "Rekening Bank" menu under Keuangan section

5. `frontend/src/App.tsx`
   - ✅ Added route `/keuangan/rekening-bank`
   - ✅ Lazy load RekeningBank component

### **Mobile (Flutter)**
6. `mobile/lib/services/api_service.dart`
   - ✅ Added `getBankAccounts()` method
   - ✅ Updated `uploadBuktiTransfer()` to accept `selectedBankId`

7. `mobile/lib/screens/unified_payment_screen.dart`
   - ✅ Added `selectedBankId` parameter
   - ✅ Pass `selectedBankId` to API

8. `mobile/lib/screens/tagihan_detail_screen.dart`
   - ✅ Changed redirect from `UnifiedPaymentScreen` to `PaymentInfoScreen`

9. `mobile/lib/screens/wallet_history_screen.dart`
   - ✅ Updated top-up flow to use `PaymentInfoScreen`

---

## 🗄️ Database Schema

### **Table: bank_accounts**
```sql
CREATE TABLE bank_accounts (
  id BIGINT PRIMARY KEY,
  bank_name VARCHAR(100),           -- BRI, BCA, Mandiri, BSI
  account_number VARCHAR(50),
  account_name VARCHAR(255),
  is_active BOOLEAN DEFAULT 1,      -- Tampil di mobile jika TRUE
  sort_order INT DEFAULT 0,         -- Urutan tampil
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Table: bukti_transfer (Modified)**
```sql
ALTER TABLE bukti_transfer
  ADD COLUMN selected_bank_id BIGINT NULL,
  ADD FOREIGN KEY (selected_bank_id) REFERENCES bank_accounts(id) ON DELETE SET NULL;
```

---

## 🔗 API Endpoints

### **For Mobile App (Read-Only)**
```
GET /api/wali/bank-accounts
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bank_name": "BRI",
      "account_number": "1234-5678-9012-3456",
      "account_name": "YAYASAN PESANTREN CONTOH"
    },
    ...
  ]
}
```

### **For Admin Panel (CRUD)**
```
GET    /api/v1/keuangan/bank-accounts        # List all
POST   /api/v1/keuangan/bank-accounts        # Create new
PUT    /api/v1/keuangan/bank-accounts/{id}   # Update
DELETE /api/v1/keuangan/bank-accounts/{id}   # Delete
POST   /api/v1/keuangan/bank-accounts/{id}/toggle-active  # Toggle active/inactive
```

---

## 🚀 How to Use

### **Admin Panel:**
1. Login ke admin panel
2. Buka menu: **Keuangan** → **Rekening Bank**
3. Klik **"+ Tambah Rekening"**
4. Isi form:
   - Nama Bank (BRI, BCA, dll)
   - Nomor Rekening
   - Nama Pemilik Rekening
   - Centang "Aktifkan" untuk tampil di mobile
5. Klik **"Tambah Rekening"**

### **Mobile App (Wali Santri):**
1. Pilih santri
2. Buka tab **Tagihan**
3. Klik tagihan yang mau dibayar
4. ✨ **NEW**: Muncul screen "Informasi Pembayaran"
   - Lihat rekening bank yang tersedia
   - Pilih rekening tujuan transfer
   - Salin nomor rekening (klik icon copy)
   - Cek total pembayaran
5. Keluar dari app → Transfer via mobile banking
6. Kembali ke app → Klik **"Saya Sudah Transfer"**
7. Upload bukti transfer
8. Tunggu konfirmasi admin

---

## 🎨 UI Features

### **PaymentInfoScreen**
- ✅ Gradient card untuk total pembayaran
- ✅ Radio button untuk pilih rekening
- ✅ Copy to clipboard untuk nomor rekening
- ✅ Warning box dengan instruksi penting
- ✅ Support multiple bank accounts
- ✅ Checkbox untuk tambah top-up (payment mode)

### **Admin Panel - RekeningBank Page**
- ✅ Card-based layout dengan bank icon
- ✅ Badge status (Aktif/Nonaktif)
- ✅ Toggle active/inactive button
- ✅ Edit & Delete buttons
- ✅ Modal form untuk add/edit
- ✅ Empty state dengan CTA

---

## 📊 Tracking & Analytics

Dengan `selected_bank_id` di tabel `bukti_transfer`, admin bisa:
- Track wali transfer ke rekening mana
- Lihat rekening mana yang paling sering digunakan
- Generate laporan per rekening bank

---

## 🔒 Security & Validation

### **Backend Validation:**
- ✅ `selected_bank_id` must exist in `bank_accounts` table
- ✅ Only active banks are returned to mobile app
- ✅ Cannot delete bank account if used in transactions

### **Mobile Validation:**
- ✅ Must select a bank before proceeding
- ✅ Show error if no active banks available

---

## ✅ Testing Checklist

- [x] Migration runs successfully
- [x] Seeder creates sample bank accounts
- [x] API `/wali/bank-accounts` returns active banks
- [x] Admin can add/edit/delete bank accounts
- [x] Admin can toggle active status
- [x] Mobile shows PaymentInfoScreen before upload
- [x] Copy to clipboard works
- [x] selectedBankId is saved in bukti_transfer
- [x] Top-up flow also uses PaymentInfoScreen
- [x] Payment with top-up works correctly

---

## 🐛 Known Issues & Future Enhancements

### **Future Enhancements:**
1. **Bank Logo**: Add bank logo images
2. **QRIS Support**: Add QR code for instant payment
3. **Virtual Account**: Generate unique VA number per transaction
4. **Payment Gateway**: Integration with payment gateway (Midtrans, Xendit)
5. **Auto-reconciliation**: Match transfer amount with bank statement

---

## 📚 Related Documentation

- [UNIFIED-PAYMENT-SYSTEM.md](./UNIFIED-PAYMENT-SYSTEM.md)
- [FIX-FOTO-MOBILE.md](./FIX-FOTO-MOBILE.md)
- [API-MOBILE.md](./API-MOBILE.md)
- [BUGFIX-PAYMENT-BANK-INFO.md](./BUGFIX-PAYMENT-BANK-INFO.md) - Bug fixes & improvements

---

## 🔄 Updates

### Update 1 - Bug Fixes (30 Nov 2025)
Fixed missing bank information in API responses and improved data consistency. See [BUGFIX-PAYMENT-BANK-INFO.md](./BUGFIX-PAYMENT-BANK-INFO.md) for details.

**Changes**:
- ✅ Added `selectedBank` relationship to all bukti transfer responses
- ✅ Updated admin panel to display bank info
- ✅ Fixed top-up upload to include selected_bank_id
- ✅ Improved transaction type labels and display

---

**Status**: ✅ Implemented & Bug-Fixed
**Date**: 30 November 2025
**Developer**: GitHub Copilot
