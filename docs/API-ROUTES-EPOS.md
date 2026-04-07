# API Routes - EPOS Integration

> **Status:** 🔴 Belum Lengkap  
> **Last Updated:** 7 April 2026  
> **Base URL:** `http://localhost:8000/api/v1`

---

## ⚡ Health Check

### Ping (Connection Test)
```http
GET /api/v1/wallets/ping

Response 200:
{
  "status": "ok",
  "message": "Wallet API is running",
  "timestamp": "2026-04-07 10:00:00"
}
```

**Notes:**
- Public endpoint, tidak perlu authentication
- Untuk testing koneksi EPOS ke backend

---

## 🎫 RFID Management

### Lookup RFID by UID
```http
GET /api/v1/wallets/rfid/uid/{uid}

Example:
GET /api/v1/wallets/rfid/uid/04ABC123

Response 200:
{
  "rfid_uid": "04ABC123",
  "santri_id": "uuid",
  "santri": {
    "id": "uuid",
    "nis": "12345",
    "nama": "Ahmad",
    "kelas": "1 Aliyah",
    "foto_url": "..."
  },
  "wallet": {
    "cash_balance": 50000,
    "bank_balance": 100000,
    "total_balance": 150000,
    "daily_limit": 20000,
    "today_spending": 5000,
    "remaining_limit": 15000
  }
}

Response 404:
{
  "message": "RFID not found"
}
```

**Notes:**
- Public endpoint (untuk EPOS Terminal)
- Response sudah include data santri dan wallet balance
- Untuk tap kartu RFID di terminal EPOS

---

## 🛒 Transaction (Belanja)

### Create Transaction
```http
POST /api/v1/epos/transaction
Content-Type: application/json

{
  "rfid_uid": "04ABC123",
  "santri_id": "uuid",
  "amount": 15000,
  "items": [
    {
      "name": "Nasi Goreng",
      "quantity": 1,
      "price": 10000
    },
    {
      "name": "Es Teh",
      "quantity": 1,
      "price": 5000
    }
  ],
  "terminal_id": "EPOS-001",
  "notes": "Belanja kantin"
}

Response 201:
{
  "transaction_id": "TRX20260407001",
  "message": "Transaction successful",
  "santri": {
    "nama": "Ahmad",
    "nis": "12345"
  },
  "amount": 15000,
  "balance_before": 50000,
  "balance_after": 35000,
  "remaining_limit": 5000,
  "timestamp": "2026-04-07 10:00:00"
}

Response 400:
{
  "message": "Insufficient balance",
  "balance": 10000,
  "required": 15000
}

Response 400:
{
  "message": "Daily limit exceeded",
  "daily_limit": 20000,
  "today_spending": 18000,
  "remaining_limit": 2000
}
```

**Notes:**
- Public endpoint (untuk EPOS Terminal)
- Auto-deduct dari cash_balance santri
- Check daily limit sebelum process
- Kirim notifikasi WA ke wali otomatis

---

## 🏪 Kebutuhan Orders (Pesanan Kebutuhan)

### Create Kebutuhan Order
```http
POST /api/v1/epos/kebutuhan-order
Content-Type: application/json

{
  "rfid_uid": "04ABC123",
  "santri_id": "uuid",
  "items": [
    {
      "name": "Buku Tulis",
      "quantity": 5,
      "price_per_unit": 5000,
      "total_price": 25000
    }
  ],
  "total_amount": 25000,
  "terminal_id": "EPOS-002",
  "notes": "Pesanan buku"
}

Response 201:
{
  "order_number": "KO20260407001",
  "message": "Order created, waiting for wali approval",
  "santri": {
    "nama": "Ahmad",
    "nis": "12345",
    "wali_hp": "081234567890"
  },
  "items": [ ... ],
  "total_amount": 25000,
  "status": "pending_wali_approval",
  "created_at": "2026-04-07 10:00:00"
}
```

**Notes:**
- Public endpoint
- Order tidak langsung bayar, tunggu approval wali
- Kirim notifikasi WA ke wali untuk approval
- Setelah wali approve, admin konfirmasi

---

### Get Pending Orders by Santri
```http
GET /api/v1/epos/kebutuhan-order/santri/{santriId}/pending

Response 200:
{
  "santri": {
    "id": "uuid",
    "nama": "Ahmad",
    "nis": "12345"
  },
  "pending_orders": [
    {
      "order_number": "KO20260407001",
      "items": [ ... ],
      "total_amount": 25000,
      "status": "pending_wali_approval",
      "created_at": "2026-04-07 10:00:00"
    }
  ],
  "total_pending": 1
}
```

**Notes:**
- Public endpoint
- Untuk cek apakah santri punya pending order

---

## 💸 Withdrawal (Penarikan Saldo)

### Create EPOS Withdrawal
```http
POST /api/v1/wallets/epos/withdrawal
Content-Type: application/json

{
  "rfid_uid": "04ABC123",
  "santri_id": "uuid",
  "amount": 50000,
  "terminal_id": "EPOS-003",
  "notes": "Tarik tunai"
}

Response 201:
{
  "withdrawal_number": "WD20260407001",
  "message": "Withdrawal request created, waiting for admin approval",
  "santri": {
    "nama": "Ahmad",
    "nis": "12345"
  },
  "amount": 50000,
  "status": "pending",
  "created_at": "2026-04-07 10:00:00"
}

Response 400:
{
  "message": "Insufficient balance",
  "balance": 30000,
  "requested": 50000
}
```

**Notes:**
- Public endpoint
- Withdrawal harus di-approve admin dulu
- Notifikasi ke admin untuk approval

---

### Get Withdrawal Status
```http
GET /api/v1/wallets/epos/withdrawal/{withdrawalNumber}/status

Example:
GET /api/v1/wallets/epos/withdrawal/WD20260407001/status

Response 200:
{
  "withdrawal_number": "WD20260407001",
  "santri": {
    "nama": "Ahmad",
    "nis": "12345"
  },
  "amount": 50000,
  "status": "approved", // pending, approved, rejected
  "payment_method": "cash", // cash, transfer
  "created_at": "2026-04-07 10:00:00",
  "approved_at": "2026-04-07 10:30:00",
  "approved_by": "Admin"
}

Response 404:
{
  "message": "Withdrawal not found"
}
```

**Notes:**
- Public endpoint
- Untuk cek status withdrawal setelah request
- EPOS dapat polling endpoint ini untuk update status

---

### List EPOS Withdrawals
```http
GET /api/v1/wallets/epos/withdrawals?status=pending&date=2026-04-07

Response 200:
{
  "data": [
    {
      "withdrawal_number": "WD20260407001",
      "santri_name": "Ahmad",
      "santri_nis": "12345",
      "amount": 50000,
      "status": "pending",
      "created_at": "2026-04-07 10:00:00"
    }
  ],
  "summary": {
    "total_pending": 5,
    "total_amount_pending": 250000
  }
}
```

**Notes:**
- Public endpoint (bisa diakses dari EPOS terminal untuk monitoring)
- Filter by status: pending, approved, rejected
- Filter by date

---

## ⚙️ Settings

### Get Wallet Settings
```http
GET /api/v1/epos/wallet-settings

Response 200:
{
  "minimum_balance": 5000,
  "default_daily_limit": 20000,
  "max_transaction": 100000,
  "allow_negative_balance": false
}
```

**Notes:**
- Public endpoint
- EPOS use this untuk check minimum balance requirement

---

## 💰 Pool Balance

### Get EPOS Pool Balance
```http
GET /api/v1/epos/pool

Response 200:
{
  "pool_name": "EPOS Pool",
  "balance": 5000000,
  "total_transactions_today": 150,
  "total_amount_today": 2500000,
  "last_updated": "2026-04-07 10:00:00"
}
```

**Notes:**
- Public endpoint
- Untuk monitoring pool balance EPOS

---

## 🧪 Testing & Development

### Get Sample Santri (untuk testing)
```http
GET /api/v1/epos/sample-santri

Response 200:
{
  "santri": {
    "id": "uuid",
    "nis": "99999",
    "nama": "Santri Test",
    "rfid_uid": "TEST123",
    "cash_balance": 100000,
    "daily_limit": 50000
  }
}
```

**Notes:**
- Public endpoint
- Untuk testing integrasi EPOS
- Jangan gunakan di production

---

## 📊 Transaction Flow

### 1. Normal Transaction Flow
```
1. EPOS tap RFID → GET /api/v1/wallets/rfid/uid/{uid}
2. Show santri info & balance
3. Input items & total
4. POST /api/v1/epos/transaction
5. Show success/error
6. Print receipt
```

### 2. Kebutuhan Order Flow
```
1. EPOS tap RFID → GET /api/v1/wallets/rfid/uid/{uid}
2. Show santri info
3. Input kebutuhan items
4. POST /api/v1/epos/kebutuhan-order
5. Wait wali approval (via mobile app)
6. After wali approve → admin confirm → santri dapat barang
```

### 3. Withdrawal Flow
```
1. EPOS tap RFID → GET /api/v1/wallets/rfid/uid/{uid}
2. Show balance
3. Input amount
4. POST /api/v1/wallets/epos/withdrawal
5. Wait admin approval
6. Polling: GET /api/v1/wallets/epos/withdrawal/{number}/status
7. If approved → give cash to santri
```

---

## 🔒 Security Notes

- Semua endpoint EPOS adalah **public** (tidak perlu auth token)
- Untuk production, pertimbangkan:
  - IP whitelist untuk EPOS terminals
  - API Key authentication
  - Rate limiting
  - Request signing

---

## 📝 Error Codes

| Code | Message | Action |
|------|---------|--------|
| 400 | Insufficient balance | Top up required |
| 400 | Daily limit exceeded | Wait until tomorrow |
| 400 | Minimum balance | Keep minimum balance |
| 404 | RFID not found | Register RFID first |
| 404 | Santri not found | Check santri data |
| 422 | Validation error | Check request body |
| 500 | Server error | Contact admin |

---

**TODO Phase 0.1.3:**
- [ ] Test RFID lookup endpoint
- [ ] Test transaction endpoint dengan berbagai scenario
- [ ] Test withdrawal flow end-to-end
- [ ] Test kebutuhan order flow
- [ ] Verify notifikasi WA terkirim
- [ ] Test daily limit enforcement
- [ ] Test minimum balance check
- [ ] Test error handling
- [ ] Performance test dengan multiple concurrent requests
