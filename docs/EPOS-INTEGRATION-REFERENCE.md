# 🔗 EPOS Integration - Critical Endpoints Reference

> **Project:** EPOS SAZA → SIMPELS Backend  
> **Service File:** `EPOS_SAZA/app/Services/SimpelsApiService.php`  
> **Config:** `EPOS_SAZA/config/services.php`  
> **Status:** ✅ ACTIVE IN PRODUCTION  
> **Last Updated:** 7 April 2026

---

## 🚨 CRITICAL: DO NOT BREAK THESE ENDPOINTS!

Endpoint-endpoint ini **WAJIB tetap berfungsi** dan **response structure TIDAK BOLEH BERUBAH** karena digunakan oleh EPOS production system.

---

## 1️⃣ Health Check (Ping)

### Endpoint
```
GET /api/v1/wallets/ping
```

### EPOS Usage
```php
// EPOS_SAZA/app/Services/SimpelsApiService.php:90
public function testConnection()
{
    return $this->makeRequest('GET', $this->endpoints['ping']);
}
```

### Required Response Format
```json
{
  "status": "ok",
  "message": "Wallet API is running",
  "timestamp": "2026-04-07 10:00:00"
}
```

### Testing Command
```bash
curl http://localhost:8000/api/v1/wallets/ping
```

---

## 2️⃣ RFID Lookup (CRITICAL!)

### Endpoint
```
GET /api/v1/wallets/rfid/uid/{uid}
```

### EPOS Usage
```php
// EPOS_SAZA/app/Services/SimpelsApiService.php:147
public function getSantriByRfid($uid)
{
    $response = $this->makeRequest('GET', $this->endpoints['rfid_lookup'] . '/' . $uid);
    return $response;
}
```

### Required Response Format (MUST NOT CHANGE!)
```json
{
  "rfid_uid": "04ABC123",
  "santri_id": "uuid-here",
  "santri": {
    "id": "uuid",
    "nis": "12345",
    "nama": "Ahmad",
    "kelas": "1 Aliyah",
    "foto_url": "http://..."
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
```

### Error Response Format
```json
{
  "message": "RFID not found"
}
// Status: 404
```

### Testing Command
```bash
curl http://localhost:8000/api/v1/wallets/rfid/uid/TEST123
```

---

## 3️⃣ EPOS Transaction (CRITICAL!)

### Endpoint
```
POST /api/v1/wallets/epos/transaction
```

### EPOS Usage
```php
// EPOS_SAZA/app/Services/SimpelsApiService.php:243
public function postTransaction($data)
{
    $transactionData = [
        'santri_id' => $data['santri_id'],
        'amount' => (float) $data['amount'],
        'epos_txn_id' => $data['transaction_ref'] ?? 'EPOS-...',
        'meta' => [
            'items' => $data['items'] ?? [],
            'description' => $data['description'] ?? 'EPOS Transaction',
            'cashier' => $data['cashier'] ?? 'EPOS System',
            'terminal_id' => $data['terminal_id'] ?? gethostname(),
            'timestamp' => now()->timezone('Asia/Jakarta')->toDateTimeString()
        ]
    ];
    
    return $this->makeRequest('POST', $this->endpoints['epos_transaction'], $transactionData);
}
```

### Request Format
```json
{
  "santri_id": "uuid",
  "amount": 15000,
  "epos_txn_id": "EPOS-20260407-xxxxx",
  "meta": {
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
    "description": "EPOS Transaction",
    "cashier": "Admin",
    "terminal_id": "EPOS-001",
    "timestamp": "2026-04-07 10:00:00"
  }
}
```

### Required Response Format (SUCCESS)
```json
{
  "success": true,
  "message": "Transaction successful",
  "data": {
    "transaction": {
      "id": 123
    },
    "wallet_balance": 35000,
    "remaining_limit": 5000,
    "spent_today": 15000,
    "limit_harian": 20000
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Insufficient balance"
}
// Status: 400

{
  "success": false,
  "message": "Daily limit exceeded"
}
// Status: 400
```

### Testing Command
```bash
curl -X POST http://localhost:8000/api/v1/wallets/epos/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "santri_id": "uuid-here",
    "amount": 10000,
    "epos_txn_id": "EPOS-TEST-001",
    "meta": {
      "items": [{"name": "Test Item", "quantity": 1, "price": 10000}],
      "terminal_id": "TEST"
    }
  }'
```

---

## 4️⃣ Wallet Settings

### Endpoint
```
GET /api/v1/epos/wallet-settings
```

### EPOS Usage
```php
// EPOS_SAZA/app/Services/SimpelsApiService.php:208
public function getWalletSettings($useCache = true)
{
    $response = $this->makeRequest('GET', $this->endpoints['wallet_settings']);
    return $response;
}
```

### Required Response Format
```json
{
  "success": true,
  "data": {
    "global_minimum_balance": 10000,
    "min_balance_jajan": 0
  }
}
```

### Testing Command
```bash
curl http://localhost:8000/api/v1/epos/wallet-settings
```

---

## 5️⃣ Kebutuhan Order

### Endpoint
```
POST /api/v1/epos/kebutuhan-order
```

### EPOS Config
```php
// EPOS_SAZA/config/services.php:51
'kebutuhan_order' => '/v1/epos/kebutuhan-order',
```

### Required Response Format
```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "order_id": 123,
    "order_number": "KO20260407001",
    "status": "pending_wali_approval"
  }
}
```

---

## 6️⃣ Withdrawal

### Endpoints
```
POST /api/v1/wallets/epos/withdrawal
GET  /api/v1/wallets/epos/withdrawal/{withdrawalNumber}/status
```

### EPOS Config
```php
// EPOS_SAZA/config/services.php:57-58
'withdrawal_create' => '/v1/wallets/epos/withdrawal',
'withdrawal_status' => '/v1/wallets/epos/withdrawal',
```

---

## 🧪 TESTING CHECKLIST (WAJIB SEBELUM DEPLOY!)

### Pre-Refactor Testing
- [ ] **Health Check**: `curl http://localhost:8000/api/v1/wallets/ping`
- [ ] **RFID Lookup**: Test dengan real RFID UID dari database
- [ ] **Transaction**: Test dengan real santri_id dan amount
- [ ] **Wallet Settings**: Verify response format
- [ ] **All responses**: Save to JSON files sebagai baseline

### During Refactor
- [ ] Run EPOS integration tests setiap commit
- [ ] Compare response dengan baseline JSON
- [ ] Verify HTTP status codes tidak berubah
- [ ] Check response time < 200ms

### Post-Refactor Testing
- [ ] Run full EPOS test suite
- [ ] Test dengan EPOS simulator
- [ ] Test dengan real EPOS terminal (jika memungkinkan)
- [ ] Monitor logs untuk error

---

## 🔒 REFACTOR RULES

### ✅ AMAN (Boleh Dilakukan)
- Extract logic ke service class
- Add unit tests
- Optimize query
- Add caching
- Improve error handling
- Add logging

### ❌ TIDAK AMAN (JANGAN DILAKUKAN!)
- Ubah response structure
- Ubah field names
- Ubah HTTP status codes
- Ubah endpoint URL
- Remove fields dari response
- Change data types (string → int, etc)

### 🟡 HATI-HATI (Perlu Extra Testing)
- Add new fields ke response (OK, tapi test dulu)
- Change validation rules (bisa reject request yang valid sebelumnya)
- Add middleware (bisa block EPOS requests)
- Change error messages (EPOS bisa parse message)

---

## 📊 EPOS Request Flow

```
1. EPOS Tap RFID Card
   ↓
2. EPOS calls GET /api/v1/wallets/rfid/uid/{uid}
   ↓
3. Backend returns santri + wallet data
   ↓
4. EPOS shows balance & limit
   ↓
5. EPOS creates transaction
   ↓
6. EPOS calls POST /api/v1/wallets/epos/transaction
   ↓
7. Backend deducts balance & checks limit
   ↓
8. Backend returns new balance & remaining limit
   ↓
9. EPOS prints receipt
```

---

## 🚨 ROLLBACK PLAN

Jika setelah deploy ada masalah dengan EPOS:

```bash
# 1. Rollback ke version sebelumnya
git checkout v2.0-before-refactor

# 2. Restart services
cd Backend
php artisan config:clear
php artisan cache:clear
php artisan queue:restart

# 3. Verify EPOS working
curl http://backend-url/api/v1/wallets/ping

# 4. Check logs
tail -f storage/logs/laravel.log | grep EPOS
```

---

## 📞 Emergency Contacts

Jika EPOS down di production:
1. Check endpoint dengan `curl`
2. Check logs: `Backend/storage/logs/laravel.log`
3. Rollback jika perlu
4. Test dengan EPOS simulator sebelum deploy ulang

---

## 🔗 Related Files

### Backend (SIMPELS 2.0)
- `Backend/routes/api.php` - Line 200-300 (EPOS routes)
- `Backend/app/Http/Controllers/WalletController.php`
- `Backend/app/Http/Controllers/EposController.php`
- `Backend/app/Http/Controllers/RfidTagController.php`

### EPOS
- `EPOS_SAZA/app/Services/SimpelsApiService.php` - Main integration service
- `EPOS_SAZA/config/services.php` - Endpoint configuration
- `EPOS_SAZA/tests/Feature/SimpelsIntegrationTest.php` - Integration tests

---

**Remember:** EPOS adalah production system yang dipakai real users setiap hari. Breaking EPOS = santri tidak bisa jajan! 🛡️
