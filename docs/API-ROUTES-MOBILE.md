# API Routes - Mobile App (Wali Santri)

> **Status:** 🔴 Belum Lengkap  
> **Last Updated:** 7 April 2026  
> **Base URL:** `http://localhost:8000/api/v1`

---

## 🔐 Authentication

### Login Wali
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "no_hp": "081234567890",
  "password": "password"
}

Response 200:
{
  "token": "2|xxxx...",
  "wali": {
    "id": 1,
    "nama": "Bapak Ahmad",
    "no_hp": "081234567890",
    "santri": [
      {
        "id": "uuid",
        "nama": "Ahmad Jr",
        "nis": "12345",
        ...
      }
    ]
  }
}
```

### Change Password
```http
POST /api/v1/wali/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "old_password": "oldpass",
  "new_password": "newpass",
  "new_password_confirmation": "newpass"
}

Response 200:
{
  "message": "Password changed successfully"
}
```

---

## 👨‍👩‍👧‍👦 Santri Management

### Get Santri List
```http
GET /api/v1/wali/santri
Authorization: Bearer {token}

Response 200:
{
  "santri": [
    {
      "id": "uuid",
      "nis": "12345",
      "nama": "Ahmad Jr",
      "kelas": "1 Aliyah",
      "foto_url": "...",
      ...
    }
  ]
}
```

### Get Santri Detail
```http
GET /api/v1/wali/santri/{santri_id}/detail
Authorization: Bearer {token}

Response 200:
{
  "id": "uuid",
  "nis": "12345",
  "nama": "Ahmad Jr",
  "kelas": "1 Aliyah",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "2010-01-01",
  ...
}
```

### Submit Data Correction
```http
POST /api/v1/wali/santri/{santri_id}/correction
Authorization: Bearer {token}
Content-Type: application/json

{
  "field": "no_hp_wali",
  "old_value": "081234567890",
  "new_value": "081234567899",
  "reason": "Nomor HP berubah"
}

Response 201:
{
  "message": "Data correction submitted",
  "correction": { ... }
}
```

---

## 💰 Wallet (Dompet Digital)

### Get Wallet Balance
```http
GET /api/v1/wali/wallet/{santri_id}
Authorization: Bearer {token}

Response 200:
{
  "santri_id": "uuid",
  "santri_name": "Ahmad Jr",
  "cash_balance": 50000,
  "bank_balance": 100000,
  "total_balance": 150000,
  "daily_limit": 20000,
  "today_spending": 5000,
  "remaining_limit": 15000
}
```

### Get Wallet Transaction History
```http
GET /api/v1/wali/wallet/{santri_id}/history?page=1&per_page=20
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "type": "debit",
      "method": "cash",
      "amount": 5000,
      "notes": "Belanja di kantin",
      "created_at": "2026-04-07 10:00:00",
      "balance_after": 45000
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 50
  }
}
```

### Set Daily Limit
```http
PUT /api/v1/wali/wallet/{santri_id}/limit
Authorization: Bearer {token}
Content-Type: application/json

{
  "daily_limit": 25000
}

Response 200:
{
  "message": "Daily limit updated",
  "new_limit": 25000
}
```

---

## 💳 Tagihan & Pembayaran

### Get All Tagihan
```http
GET /api/v1/wali/tagihan/{santri_id}?bulan=4&tahun=2026
Authorization: Bearer {token}

Response 200:
{
  "tagihan": [
    {
      "id": 1,
      "jenis_tagihan": "SPP",
      "bulan": 4,
      "tahun": 2026,
      "nominal": 500000,
      "status": "unpaid",
      "jatuh_tempo": "2026-04-10"
    }
  ],
  "summary": {
    "total_tagihan": 1500000,
    "total_dibayar": 500000,
    "total_tunggakan": 1000000
  }
}
```

### Get Pembayaran History
```http
GET /api/v1/wali/pembayaran/{santri_id}?page=1
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "tanggal": "2026-04-07",
      "jenis_tagihan": "SPP",
      "nominal": 500000,
      "metode_bayar": "transfer",
      "status": "verified"
    }
  ]
}
```

### Get Tunggakan
```http
GET /api/v1/wali/tunggakan/{santri_id}
Authorization: Bearer {token}

Response 200:
{
  "tunggakan": [
    {
      "jenis_tagihan": "SPP",
      "bulan": 3,
      "tahun": 2026,
      "nominal": 500000,
      "days_overdue": 28
    }
  ],
  "total_tunggakan": 1500000
}
```

### Submit Payment
```http
POST /api/v1/wali/bayar/{santri_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "tagihan_ids": [1, 2, 3],
  "metode_bayar": "transfer", // cash, transfer, wallet
  "total": 1500000
}

Response 201:
{
  "message": "Payment submitted",
  "pembayaran": {
    "id": 123,
    "nomor_pembayaran": "PAY20260407001",
    "total": 1500000,
    "status": "pending_verification"
  }
}
```

---

## 📸 Bukti Transfer

### Upload Bukti Transfer (Pembayaran)
```http
POST /api/v1/wali/upload-bukti/{santri_id}
Authorization: Bearer {token}
Content-Type: multipart/form-data

pembayaran_id: 123
bukti: [image file]

Response 201:
{
  "message": "Bukti uploaded",
  "bukti": {
    "id": 1,
    "bukti_url": "...",
    "status": "pending"
  }
}
```

### Upload Bukti Transfer (Top Up Wallet)
```http
POST /api/v1/wali/upload-bukti-topup/{santri_id}
Authorization: Bearer {token}
Content-Type: multipart/form-data

amount: 100000
bank_account_id: 1
bukti: [image file]

Response 201:
{
  "message": "Top up request submitted",
  "request": {
    "id": 1,
    "amount": 100000,
    "status": "pending"
  }
}
```

### Get Bukti History
```http
GET /api/v1/wali/bukti-history/{santri_id}
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "type": "pembayaran", // atau "topup"
      "amount": 500000,
      "bukti_url": "...",
      "status": "approved",
      "uploaded_at": "2026-04-07 10:00:00",
      "verified_at": "2026-04-07 11:00:00"
    }
  ]
}
```

---

## 🏦 Bank Accounts

### Get Bank Accounts (for payment reference)
```http
GET /api/v1/wali/bank-accounts
Authorization: Bearer {token}

Response 200:
{
  "bank_accounts": [
    {
      "id": 1,
      "nama_bank": "BCA",
      "no_rekening": "1234567890",
      "atas_nama": "Yayasan XYZ"
    }
  ]
}
```

---

## 🔔 Notifications

### Get Notifications
```http
GET /api/v1/wali/notifications/{santri_id}?page=1
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "title": "Pembayaran Diverifikasi",
      "message": "Pembayaran SPP April 2026 telah diverifikasi",
      "type": "payment",
      "is_read": false,
      "created_at": "2026-04-07 10:00:00"
    }
  ],
  "unread_count": 5
}
```

### Mark as Read
```http
POST /api/v1/wali/notifications/{id}/read
Authorization: Bearer {token}

Response 200:
{
  "message": "Notification marked as read"
}
```

### Mark All as Read
```http
POST /api/v1/wali/notifications/{santri_id}/read-all
Authorization: Bearer {token}

Response 200:
{
  "message": "All notifications marked as read"
}
```

### Get Unread Count
```http
GET /api/v1/wali/notifications/{santri_id}/unread-count
Authorization: Bearer {token}

Response 200:
{
  "unread_count": 5
}
```

---

## 📢 Announcements (Pengumuman)

### Get Announcements
```http
GET /api/v1/wali/announcements?page=1
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "judul": "Libur Semester",
      "konten": "Pengumuman libur semester...",
      "tanggal": "2026-04-07",
      "is_read": false
    }
  ]
}
```

### Get Unread Count
```http
GET /api/v1/wali/announcements/unread-count
Authorization: Bearer {token}

Response 200:
{
  "unread_count": 3
}
```

### Show Announcement Detail
```http
GET /api/v1/wali/announcements/{id}
Authorization: Bearer {token}

Response 200:
{
  "id": 1,
  "judul": "Libur Semester",
  "konten": "...",
  "tanggal": "2026-04-07",
  "attachments": []
}
```

### Mark as Read
```http
POST /api/v1/wali/announcements/{id}/mark-read
Authorization: Bearer {token}

Response 200:
{
  "message": "Announcement marked as read"
}
```

---

## 💼 Tabungan (Read Only untuk Wali)

### Get Tabungan Balance
```http
GET /api/v1/wali/tabungan/{santri_id}
Authorization: Bearer {token}

Response 200:
{
  "santri_id": "uuid",
  "santri_name": "Ahmad Jr",
  "saldo": 500000,
  "last_transaction": "2026-04-07"
}
```

### Get Tabungan History
```http
GET /api/v1/wali/tabungan/{santri_id}/history?page=1
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "type": "setor",
      "nominal": 50000,
      "saldo_after": 500000,
      "keterangan": "Setoran rutin",
      "tanggal": "2026-04-07"
    }
  ]
}
```

---

## 🛒 Kebutuhan Orders (EPOS)

### Get Kebutuhan Orders
```http
GET /api/v1/wali/kebutuhan-orders/{santri_id}?status=pending
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "order_number": "KO20260407001",
      "item_name": "Buku Tulis",
      "quantity": 5,
      "total_price": 25000,
      "status": "pending_approval",
      "created_at": "2026-04-07 10:00:00"
    }
  ]
}
```

### Respond to Order (Approve/Reject)
```http
POST /api/v1/wali/kebutuhan-orders/{orderId}/respond
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "approve", // atau "reject"
  "notes": "Disetujui"
}

Response 200:
{
  "message": "Order approved"
}
```

---

## 📝 Notes

- Semua endpoint memerlukan `Authorization: Bearer {token}`
- Token didapat dari endpoint `/api/v1/auth/login`
- Token berlaku 30 hari
- Format tanggal: `YYYY-MM-DD HH:mm:ss`
- Format currency: integer (dalam rupiah)
- Image upload max size: 5MB
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

**TODO Phase 0.1.2:**
- [ ] Test semua endpoint dari mobile app
- [ ] Verify JWT token authentication
- [ ] Test file upload (bukti transfer)
- [ ] Verify image URL accessible
- [ ] Test pagination
- [ ] Check error handling
