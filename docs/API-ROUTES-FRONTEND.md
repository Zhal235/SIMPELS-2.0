# API Routes - Frontend (Admin Dashboard)

> **Status:** 🔴 Belum Lengkap  
> **Last Updated:** 7 April 2026  
> **Base URL:** `http://localhost:8000/api`

---

## 🔐 Authentication

### Login Admin
```http
POST /api/login
Content-Type: application/json

{
  "email": "admin@simpels.com",
  "password": "password"
}

Response 200:
{
  "token": "1|xxxx...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@simpels.com",
    "role": "admin"
  }
}
```

### Logout
```http
POST /api/logout
Authorization: Bearer {token}

Response 200:
{
  "message": "Logged out successfully"
}
```

---

## 💰 Wallet Management (Dompet Digital)

### Get All Wallets (dengan filter & pagination)
```http
GET /api/v1/wallets?search=ahmad&status=active&page=1&per_page=20
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "santri_id": "uuid",
      "nama": "Ahmad",
      "cash_balance": 50000,
      "bank_balance": 100000,
      ...
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 100,
    ...
  }
}
```

### Get Total Balances
```http
GET /api/v1/wallets/balances
Authorization: Bearer {token}

Response 200:
{
  "cash_balance": 5000000,
  "bank_balance": 10000000,
  "total_balance": 15000000
}
```

### Get Wallet by Santri
```http
GET /api/v1/wallets/{santriId}
Authorization: Bearer {token}

Response 200:
{
  "santri_id": "uuid",
  "nama": "Ahmad",
  "cash_balance": 50000,
  "bank_balance": 100000,
  "daily_limit": 20000,
  "settings": { ... }
}
```

### Top Up Wallet
```http
POST /api/v1/wallets/{santriId}/topup
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50000,
  "method": "cash", // atau "transfer"
  "notes": "Top up manual"
}

Response 201:
{
  "transaction_id": "xxx",
  "message": "Top up berhasil"
}
```

### Debit Wallet (Tarik Saldo)
```http
POST /api/v1/wallets/{santriId}/debit
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 20000,
  "method": "cash",
  "notes": "Penarikan tunai"
}

Response 201:
{
  "transaction_id": "xxx",
  "message": "Debit berhasil"
}
```

### Get Wallet Transactions
```http
GET /api/v1/wallets/{santriId}/transactions?type=credit&method=cash&start_date=2026-01-01
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "type": "credit",
      "method": "cash",
      "amount": 50000,
      "notes": "Top up manual",
      "created_at": "2026-04-07 10:00:00"
    }
  ]
}
```

### Get All Transactions (Global)
```http
GET /api/v1/wallets/transactions?search=ahmad&type=credit&page=1
Authorization: Bearer {token}

Response 200:
{
  "data": [ ... ],
  "meta": { ... }
}
```

### Update Transaction
```http
PUT /api/v1/wallets/transactions/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 55000,
  "notes": "Updated notes"
}

Response 200:
{
  "message": "Transaction updated"
}
```

### Void Transaction
```http
DELETE /api/v1/wallets/transactions/{id}
Authorization: Bearer {token}

Response 200:
{
  "message": "Transaction voided"
}
```

### Cash Withdrawal (Bank → Cash)
```http
POST /api/v1/wallets/cash-withdrawal
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 500000,
  "notes": "Tarik dana ke kas"
}

Response 201:
{
  "message": "Cash withdrawal berhasil"
}
```

---

## 🏪 EPOS Withdrawal Management

### List EPOS Withdrawals
```http
GET /api/v1/wallets/epos/withdrawals?status=pending&page=1
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "withdrawal_number": "WD20260407001",
      "santri_name": "Ahmad",
      "amount": 50000,
      "payment_method": "cash",
      "status": "pending",
      ...
    }
  ]
}
```

### Approve EPOS Withdrawal
```http
PUT /api/v1/wallets/epos/withdrawal/{id}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "payment_method": "cash", // atau "transfer"
  "notes": "Approved by admin"
}

Response 200:
{
  "message": "Withdrawal approved"
}
```

### Reject EPOS Withdrawal
```http
PUT /api/v1/wallets/epos/withdrawal/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Insufficient balance"
}

Response 200:
{
  "message": "Withdrawal rejected"
}
```

---

## 👨‍🎓 Santri Management (Kesantrian)

### List Santri
```http
GET /api/v1/kesantrian/santri?search=ahmad&kelas_id=1&page=1
Authorization: Bearer {token}

Response 200:
{
  "data": [ ... ],
  "meta": { ... }
}
```

### Create Santri
```http
POST /api/v1/kesantrian/santri
Authorization: Bearer {token}
Content-Type: application/json

{
  "nis": "12345",
  "nama": "Ahmad",
  "kelas_id": 1,
  ...
}

Response 201:
{
  "message": "Santri created",
  "santri": { ... }
}
```

### Update Santri
```http
PUT /api/v1/kesantrian/santri/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nama": "Ahmad Updated",
  ...
}

Response 200:
{
  "message": "Santri updated"
}
```

### Delete Santri
```http
DELETE /api/v1/kesantrian/santri/{id}
Authorization: Bearer {token}

Response 200:
{
  "message": "Santri deleted"
}
```

### Download Import Template
```http
GET /api/v1/kesantrian/santri/template
Authorization: Bearer {token}

Response 200:
File download: template-santri.xlsx
```

### Import Santri
```http
POST /api/v1/kesantrian/santri/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [Excel file]

Response 200:
{
  "message": "Import berhasil",
  "imported": 50,
  "failed": 0
}
```

### Export Santri
```http
GET /api/v1/kesantrian/santri/export
Authorization: Bearer {token}

Response 200:
File download: santri-export-2026-04-07.xlsx
```

---

## 💳 Tagihan & Pembayaran

### List Tagihan Santri
```http
GET /api/v1/keuangan/tagihan-santri?santri_id=xxx&status=unpaid
Authorization: Bearer {token}

Response 200:
{
  "data": [ ... ]
}
```

### Generate Tagihan
```http
POST /api/v1/keuangan/tagihan-santri/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "jenis_tagihan_id": 1,
  "bulan": 4,
  "tahun": 2026,
  "kelas_ids": [1, 2, 3]
}

Response 201:
{
  "message": "Tagihan generated",
  "count": 150
}
```

### Submit Pembayaran
```http
POST /api/v1/keuangan/pembayaran
Authorization: Bearer {token}
Content-Type: application/json

{
  "santri_id": "uuid",
  "tagihan_ids": [1, 2, 3],
  "metode_bayar": "cash",
  "total": 300000
}

Response 201:
{
  "message": "Pembayaran berhasil",
  "pembayaran": { ... }
}
```

---

## 🏦 Bank Accounts

### List Bank Accounts
```http
GET /api/v1/keuangan/bank-accounts
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "nama_bank": "BCA",
      "no_rekening": "1234567890",
      "atas_nama": "Yayasan XYZ",
      "is_active": true
    }
  ]
}
```

### Create Bank Account
```http
POST /api/v1/keuangan/bank-accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "nama_bank": "BCA",
  "no_rekening": "1234567890",
  "atas_nama": "Yayasan XYZ"
}

Response 201:
{
  "message": "Bank account created"
}
```

---

## 📢 Announcements (Pengumuman)

### List Announcements
```http
GET /api/v1/announcements
Authorization: Bearer {token}

Response 200:
{
  "data": [ ... ]
}
```

### Create Announcement
```http
POST /api/v1/announcements
Authorization: Bearer {token}
Content-Type: application/json

{
  "judul": "Pengumuman Penting",
  "konten": "...",
  "target_type": "all", // all, kelas, santri
  "target_ids": []
}

Response 201:
{
  "message": "Announcement created"
}
```

---

## 📱 Mobile Monitoring

### Get Statistics
```http
GET /api/admin/mobile-monitoring/statistics
Authorization: Bearer {token}

Response 200:
{
  "total_wali": 150,
  "active_today": 45,
  "active_this_week": 120,
  ...
}
```

### Get Wali List
```http
GET /api/admin/mobile-monitoring/wali-list?search=ahmad
Authorization: Bearer {token}

Response 200:
{
  "data": [ ... ]
}
```

---

## 🔔 Bukti Transfer Management

### List Bukti Transfer (Pending Approval)
```http
GET /api/admin/bukti-transfer
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "santri_name": "Ahmad",
      "amount": 100000,
      "bukti_url": "...",
      "status": "pending",
      ...
    }
  ]
}
```

### Approve Bukti
```http
POST /api/admin/bukti-transfer/{id}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Verified"
}

Response 200:
{
  "message": "Bukti approved"
}
```

### Reject Bukti
```http
POST /api/admin/bukti-transfer/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Invalid transfer proof"
}

Response 200:
{
  "message": "Bukti rejected"
}
```

---

## 📊 Dashboard

### Get Dashboard Summary
```http
GET /api/dashboard
Authorization: Bearer {token}

Response 200:
{
  "total_santri": 500,
  "total_tagihan": 15000000,
  "total_pembayaran": 12000000,
  "tunggakan": 3000000,
  ...
}
```

---

## ⚙️ Settings

### Get Instansi Settings
```http
GET /api/v1/instansi
Authorization: Bearer {token}

Response 200:
{
  "nama_instansi": "Pondok Pesantren XYZ",
  "alamat": "...",
  "logo_url": "...",
  ...
}
```

### Update Instansi Settings
```http
PUT /api/v1/instansi
Authorization: Bearer {token}
Content-Type: application/json

{
  "nama_instansi": "...",
  "alamat": "...",
  ...
}

Response 200:
{
  "message": "Settings updated"
}
```

---

## 📝 Notes

- Semua endpoint memerlukan `Authorization: Bearer {token}` kecuali endpoint publik
- Format tanggal: `YYYY-MM-DD HH:mm:ss`
- Format currency: integer (dalam rupiah)
- Pagination default: 20 items per page
- Error response format:
  ```json
  {
    "message": "Error message",
    "errors": {
      "field": ["Validation error"]
    }
  }
  ```

---

**TODO Phase 0.1.1:**
- [ ] Test semua endpoint dengan Postman
- [ ] Dokumentasikan semua query parameters
- [ ] Dokumentasikan semua error responses
- [ ] Verifikasi authorization & permissions
