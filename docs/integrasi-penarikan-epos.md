# Integrasi Penarikan Saldo ePOS ke SIMPELS

## 📋 Overview
Sistem integrasi penarikan saldo transaksi RFID dari ePOS ke SIMPELS memungkinkan admin ePOS untuk mengajukan penarikan dana yang terkumpul di pool ePOS, kemudian disetujui oleh admin SIMPELS.

## 🔄 Alur Proses

### 1. **Admin ePOS Mengajukan Penarikan**
- **Lokasi**: Menu **"Manajemen Keuangan"** (sidebar kiri) → Tab **"Penarikan RFID"**
- **Tombol**: Klik **"Tarik Saldo RFID"** (tombol biru di kanan atas)
- **Form Input**:
  - Nominal penarikan (atau kosongkan untuk tarik semua saldo tersedia)
  - Metode penarikan (Transfer Bank / Tunai)
  - Detail bank (jika Transfer Bank): Nama Bank, No Rekening, Nama Pemegang
  - Catatan (opsional)
- **Proses**:
  - Sistem mengambil transaksi RFID yang belum pernah ditarik
  - Generate `withdrawal_number` (format: WD20251123XXXX)
  - Data disimpan di tabel `simpels_withdrawals` (ePOS)
  - Request dikirim ke SIMPELS via API

### 2. **SIMPELS Menerima Request**
- Endpoint: `POST /api/v1/wallets/epos/withdrawal`
- Data disimpan di tabel `epos_withdrawals` (SIMPELS)
- Status awal: `pending`
- Tampil di halaman "Dompet" → "Penarikan ePOS" di SIMPELS

### 3. **Admin SIMPELS Menyetujui/Menolak**
- Lokasi: Menu "Dompet" → "Penarikan ePOS" di SIMPELS
- Admin dapat:
  - **Setujui**: Saldo pool ePOS dipotong, status berubah `approved`
  - **Tolak**: Harus isi alasan penolakan, status berubah `rejected`
- Callback dikirim ke ePOS untuk update status

### 4. **Update Status di ePOS**
- Endpoint callback: `PUT /api/simpels/withdrawal/{withdrawal_number}/status`
- Status di ePOS diupdate otomatis
- Field yang diupdate:
  - `simpels_status`
  - `simpels_updated_at`
  - `simpels_notes`

### 5. **Tampilan Saldo**
- **Di SIMPELS**:
  - Saldo pool ePOS berkurang setelah approval
  - Riwayat penarikan tercatat
- **Di ePOS**:
  - Transaksi yang sudah ditarik ditandai
  - Saldo tersedia vs sudah ditarik terpisah

---

## 🏗️ Struktur Database

### ePOS - `simpels_withdrawals`
```sql
- id (primary key)
- withdrawal_number (unique, format: WD20251123XXXX)
- period_start, period_end
- total_transactions, total_amount
- status (pending/processing/completed/cancelled)
- simpels_status (pending/approved/rejected/completed) -- status dari SIMPELS
- simpels_updated_at
- simpels_notes
- withdrawal_method (bank_transfer/cash)
- requested_by, approved_by
- created_at, updated_at
```

### SIMPELS - `epos_withdrawals`
```sql
- id (primary key)
- withdrawal_number (unique)
- amount
- period_start, period_end
- total_transactions
- status (pending/approved/completed/rejected)
- requested_by (nama string, bukan FK)
- approved_by (user_id), approved_at
- rejected_by (user_id), rejected_at, rejection_reason
- notes
- created_at, updated_at
```

### SIMPELS - `epos_pools`
```sql
- id
- name (default: 'epos_main')
- balance (bertambah dari transaksi ePOS, berkurang saat approval withdrawal)
- created_at, updated_at
```

---

## 🔌 API Endpoints

### SIMPELS (Backend)

#### 1. Terima Request Penarikan dari ePOS
```
POST /api/v1/wallets/epos/withdrawal
```
**Body:**
```json
{
  "withdrawal_number": "WD202511230001",
  "amount": 500000,
  "period_start": "2025-11-01",
  "period_end": "2025-11-23",
  "total_transactions": 25,
  "requested_by": "Admin ePOS",
  "notes": "Penarikan periode November"
}
```

#### 2. List Withdrawal Requests
```
GET /api/v1/wallets/epos/withdrawals?status=pending
```

#### 3. Approve Withdrawal
```
PUT /api/v1/wallets/epos/withdrawal/{id}/approve
```
**Logic:**
- Cek status = pending
- Cek saldo pool mencukupi
- Potong saldo pool
- Update status → approved
- Kirim callback ke ePOS

#### 4. Reject Withdrawal
```
PUT /api/v1/wallets/epos/withdrawal/{id}/reject
```
**Body:**
```json
{
  "reason": "Saldo tidak mencukupi untuk saat ini"
}
```

#### 5. Get Status
```
GET /api/v1/wallets/epos/withdrawal/{withdrawalNumber}/status
```

### ePOS (Backend)

#### Terima Callback dari SIMPELS
```
PUT /api/simpels/withdrawal/{withdrawal_number}/status
```
**Body:**
```json
{
  "status": "approved",
  "updated_by": "Admin SIMPELS",
  "notes": "Penarikan disetujui",
  "updated_at": "2025-11-23 10:30:00"
}
```

---

## 🧪 Testing Guide

### Persiapan
1. **Jalankan Backend SIMPELS**
   ```bash
   cd Backend
   php artisan serve --port=8001
   ```

2. **Jalankan Frontend SIMPELS**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Jalankan ePOS**
   ```bash
   cd EPOS_SAZA
   php artisan serve --port=8002
   ```

4. **Setup Environment Variables**
   
   **SIMPELS `.env`:**
   ```
   EPOS_API_URL=http://localhost:8002
   ```
   
   **ePOS `.env`:**
   ```
   SIMPELS_API_URL=http://localhost:8001/api/v1/wallets
   ```

### Test Scenario

#### ✅ Scenario 1: Penarikan Berhasil Disetujui

1. **Di ePOS:**
   - Login sebagai admin
   - Buka "Manajemen Keuangan" → Tab "Penarikan RFID"
   - Pastikan ada saldo tersedia (pending_withdrawal > 0)
   - Klik "Ajukan Penarikan"
   - Input nominal atau kosongkan
   - Submit

2. **Verifikasi di ePOS:**
   - Check log: `storage/logs/laravel.log`
   - Cari: "Withdrawal request created"
   - Cari: "Withdrawal request sent to SIMPels"

3. **Di SIMPELS:**
   - Login sebagai admin
   - Buka "Dompet" → "Penarikan ePOS"
   - Seharusnya muncul request baru dengan status "Menunggu Approval"
   - Lihat saldo pool ePOS sebelum approval
   - Klik "Setujui"
   - Konfirmasi

4. **Verifikasi di SIMPELS:**
   - Status berubah menjadi "Disetujui"
   - Saldo pool berkurang
   - Check log: "EPOS withdrawal approved"
   - Check log: "Callback sent to EPOS"

5. **Verifikasi di ePOS:**
   - Refresh halaman atau tunggu auto-refresh
   - Status `simpels_status` berubah menjadi "approved"
   - Check transaksi yang terkait sudah marked as withdrawn

#### ❌ Scenario 2: Penarikan Ditolak

1. **Di SIMPELS:**
   - Buka request penarikan yang pending
   - Klik "Tolak"
   - Input alasan: "Saldo tidak mencukupi untuk periode ini"
   - Submit

2. **Verifikasi:**
   - Status di SIMPELS: "Ditolak"
   - Callback terkirim ke ePOS
   - Status di ePOS: `simpels_status` = "rejected"
   - Saldo pool tidak berubah

#### 🔄 Scenario 3: Callback Gagal (Network Issue)

1. Matikan server ePOS
2. Approve withdrawal di SIMPELS
3. Approval tetap berhasil (saldo terpotong)
4. Error log: "Failed to send callback to EPOS"
5. Hidupkan kembali ePOS
6. Manual refresh status di ePOS (button refresh)

---

## 📊 Monitoring & Debugging

### Log Files

**SIMPELS:**
```bash
tail -f Backend/storage/logs/laravel.log | grep -i "withdrawal\|epos"
```

**ePOS:**
```bash
tail -f storage/logs/laravel.log | grep -i "withdrawal\|simpels"
```

### Key Log Messages

**ePOS:**
- ✅ `Withdrawal request created`
- ✅ `Withdrawal request sent to SIMPels`
- ⚠️ `Failed to send withdrawal to SIMPels API`
- ✅ `Withdrawal status updated from SIMPels`

**SIMPELS:**
- ✅ `EPOS withdrawal request created`
- ✅ `EPOS withdrawal approved`
- ✅ `Callback sent to EPOS`
- ⚠️ `Failed to send callback to EPOS`

### Database Checks

**SIMPELS - Check Pool Balance:**
```sql
SELECT * FROM epos_pools WHERE name = 'epos_main';
```

**SIMPELS - Check Withdrawals:**
```sql
SELECT id, withdrawal_number, amount, status, approved_at 
FROM epos_withdrawals 
ORDER BY created_at DESC 
LIMIT 10;
```

**ePOS - Check Withdrawals:**
```sql
SELECT id, withdrawal_number, total_amount, status, simpels_status 
FROM simpels_withdrawals 
ORDER BY created_at DESC 
LIMIT 10;
```

**ePOS - Check Transactions:**
```sql
SELECT COUNT(*), SUM(amount) 
FROM financial_transactions 
WHERE type = 'rfid_payment' 
  AND withdrawal_id IS NULL;
-- Ini adalah transaksi yang belum ditarik
```

---

## 🐛 Troubleshooting

### Issue 1: Request tidak sampai ke SIMPELS
**Symptoms:** Request dibuat di ePOS tapi tidak muncul di SIMPELS

**Check:**
1. Pastikan SIMPELS backend running
2. Check `SIMPELS_API_URL` di `.env` ePOS
3. Test ping: `GET http://localhost:8001/api/v1/wallets/ping`
4. Check firewall/network

### Issue 2: Callback tidak sampai ke ePOS
**Symptoms:** Approval berhasil di SIMPELS tapi status di ePOS tidak update

**Check:**
1. Pastikan ePOS running
2. Check `EPOS_API_URL` di `.env` SIMPELS
3. Test endpoint: `PUT http://localhost:8002/api/simpels/withdrawal/TEST123/status`
4. Gunakan manual refresh di ePOS

### Issue 3: Saldo pool tidak terpotong
**Symptoms:** Approval berhasil tapi saldo pool tetap

**Check:**
1. Check log di SIMPELS
2. Verifikasi transaksi database
3. Check apakah ada exception di proses approval

### Issue 4: Duplicate withdrawal
**Symptoms:** Request terkirim berkali-kali

**Check:**
1. `withdrawal_number` harus unique
2. Check apakah ada retry logic yang berlebihan
3. Database constraint `unique` pada `withdrawal_number`

---

## 📝 Configuration

### ePOS `.env`
```env
SIMPELS_API_URL=http://localhost:8001/api/v1/wallets
SIMPELS_API_TIMEOUT=30
SIMPELS_API_KEY=  # Optional, untuk auth
```

### SIMPELS `.env`
```env
EPOS_API_URL=http://localhost:8002
EPOS_API_TIMEOUT=30
```

---

## 🎯 Best Practices

1. **Selalu cek saldo pool sebelum approve**
2. **Gunakan transaksi database** untuk ensure atomicity
3. **Log setiap step** untuk debugging
4. **Handle callback failure gracefully** - jangan rollback approval jika callback gagal
5. **Implementasi retry mechanism** untuk callback
6. **Auto-refresh status** di UI ePOS setiap beberapa menit
7. **Notifikasi email/SMS** saat ada approval/rejection

---

## 🔐 Security Notes

1. Gunakan API Key untuk autentikasi
2. Validate semua input
3. Rate limiting pada endpoints
4. Log audit trail lengkap
5. HTTPS di production
6. Restrict IP access untuk callback endpoint

---

## 📈 Future Enhancements

1. Email notification saat status berubah
2. Webhook subscription model
3. Batch approval multiple withdrawals
4. Export report penarikan
5. Dashboard analytics
6. Scheduled auto-approval dengan threshold tertentu
7. Multi-approval workflow (require 2+ admins)

---

**Dokumen ini dibuat pada:** 23 November 2025
**Versi:** 1.0
