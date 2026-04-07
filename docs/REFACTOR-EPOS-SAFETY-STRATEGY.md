# 🛡️ Strategi Refactor Backend - EPOS Safety Plan

> **Tujuan:** Refactor backend tanpa break EPOS integration  
> **Status:** 🟢 Ready to Implement  
> **Created:** 7 April 2026

---

## 🔍 Problem Statement

- **EPOS** adalah project **terpisah** (external system)
- EPOS **bergantung penuh** pada API backend
- Refactor backend bisa **break EPOS** jika tidak hati-hati
- Perlu strategi testing yang **solid** sebelum deploy

---

## ✅ SOLUSI: 5-Layer Safety Strategy

### 1️⃣ **Contract Testing (API Contract)**

**Buat file contract test yang memastikan API contract tidak berubah**

```bash
Backend/tests/Feature/Epos/
├── EposApiContractTest.php       # Test semua EPOS endpoints
├── RfidLookupContractTest.php    # Test RFID lookup contract
├── TransactionContractTest.php   # Test transaction contract
└── WithdrawalContractTest.php    # Test withdrawal contract
```

**Contoh Test:**
```php
// Backend/tests/Feature/Epos/EposApiContractTest.php
public function test_rfid_lookup_contract()
{
    // Arrange
    $rfid = RfidTag::factory()->create();
    
    // Act
    $response = $this->get("/api/v1/wallets/rfid/uid/{$rfid->uid}");
    
    // Assert - MUST NOT CHANGE
    $response->assertStatus(200);
    $response->assertJsonStructure([
        'rfid_uid',
        'santri_id',
        'santri' => [
            'id', 'nis', 'nama', 'kelas', 'foto_url'
        ],
        'wallet' => [
            'cash_balance',
            'bank_balance',
            'total_balance',
            'daily_limit',
            'today_spending',
            'remaining_limit'
        ]
    ]);
}
```

---

### 2️⃣ **API Versioning Strategy**

**JANGAN ubah endpoint yang sudah ada, buat versi baru jika perlu breaking changes**

#### ✅ AMAN (Backward Compatible):
```php
// Refactor internal logic, response tetap sama
class WalletController {
    public function show($santriId) {
        // OLD: Logic langsung di controller
        // NEW: Pakai service, tapi response structure SAMA
        $wallet = $this->walletService->getWallet($santriId);
        return response()->json($wallet); // Format tidak berubah
    }
}
```

#### ⚠️ HATI-HATI (Bisa Break):
```php
// Jangan ubah response structure
// OLD Response:
{
    "cash_balance": 50000,
    "bank_balance": 100000
}

// NEW Response (JANGAN!):
{
    "balances": {
        "cash": 50000,
        "bank": 100000
    }
}
```

#### 🔴 JIKA HARUS BREAKING CHANGE:
```php
// Buat endpoint baru dengan version
// OLD: /api/v1/wallets/rfid/uid/{uid}  (tetap jalan untuk EPOS)
// NEW: /api/v2/wallets/rfid/uid/{uid}  (untuk frontend baru)
```

---

### 3️⃣ **Mock EPOS Server untuk Testing**

**Buat mock EPOS server di development environment**

```bash
# Buat folder baru di project
Backend/tests/Mock/
└── EposMockServer.php
```

**Script NodeJS sederhana untuk simulate EPOS:**
```javascript
// epos-simulator/server.js
const axios = require('axios');
const API_BASE = 'http://localhost:8000/api/v1';

// Test 1: RFID Lookup
async function testRfidLookup(uid) {
    try {
        const res = await axios.get(`${API_BASE}/wallets/rfid/uid/${uid}`);
        console.log('✅ RFID Lookup OK:', res.data);
        return true;
    } catch (err) {
        console.error('❌ RFID Lookup FAIL:', err.response?.data);
        return false;
    }
}

// Test 2: Transaction
async function testTransaction(rfidUid, amount) {
    try {
        const res = await axios.post(`${API_BASE}/epos/transaction`, {
            rfid_uid: rfidUid,
            amount: amount,
            items: [{ name: 'Test Item', quantity: 1, price: amount }],
            terminal_id: 'TEST-001'
        });
        console.log('✅ Transaction OK:', res.data);
        return true;
    } catch (err) {
        console.error('❌ Transaction FAIL:', err.response?.data);
        return false;
    }
}

// Run all tests
(async () => {
    console.log('🧪 Starting EPOS Integration Tests...\n');
    
    await testRfidLookup('TEST123');
    await testTransaction('TEST123', 10000);
    
    // Tambah test lain...
})();
```

**Jalankan setiap kali refactor:**
```bash
cd epos-simulator
npm install axios
node server.js
```

---

### 4️⃣ **Integration Test Suite (Laravel)**

**Buat comprehensive integration tests**

```bash
Backend/tests/Integration/Epos/
├── EposTransactionFlowTest.php
├── EposWithdrawalFlowTest.php
└── EposKebutuhanOrderFlowTest.php
```

**Contoh:**
```php
// Backend/tests/Integration/Epos/EposTransactionFlowTest.php
class EposTransactionFlowTest extends TestCase
{
    /** @test */
    public function epos_can_complete_full_transaction_flow()
    {
        // 1. Setup data
        $santri = Santri::factory()->create();
        $rfid = RfidTag::factory()->create(['santri_id' => $santri->id]);
        Wallet::factory()->create([
            'santri_id' => $santri->id,
            'cash_balance' => 50000
        ]);
        
        // 2. EPOS lookup RFID
        $lookup = $this->get("/api/v1/wallets/rfid/uid/{$rfid->uid}");
        $lookup->assertStatus(200);
        
        // 3. EPOS create transaction
        $transaction = $this->post('/api/v1/epos/transaction', [
            'rfid_uid' => $rfid->uid,
            'santri_id' => $santri->id,
            'amount' => 10000,
            'items' => [['name' => 'Nasi', 'quantity' => 1, 'price' => 10000]],
            'terminal_id' => 'EPOS-001'
        ]);
        
        $transaction->assertStatus(201);
        $transaction->assertJsonStructure([
            'transaction_id',
            'message',
            'santri',
            'amount',
            'balance_before',
            'balance_after'
        ]);
        
        // 4. Verify balance updated
        $this->assertEquals(40000, $santri->wallet->fresh()->cash_balance);
    }
}
```

**Jalankan sebelum commit:**
```bash
php artisan test --filter Epos
```

---

### 5️⃣ **Monitoring & Rollback Plan**

**Setup monitoring untuk detect error cepat**

#### A. Error Logging
```php
// Backend/app/Http/Middleware/EposRequestLogger.php
class EposRequestLogger
{
    public function handle($request, Closure $next)
    {
        // Log semua request dari EPOS
        if (str_contains($request->path(), 'epos') || 
            str_contains($request->path(), 'rfid')) {
            
            Log::channel('epos')->info('EPOS Request', [
                'path' => $request->path(),
                'method' => $request->method(),
                'body' => $request->all(),
                'ip' => $request->ip()
            ]);
        }
        
        $response = $next($request);
        
        // Log response
        if ($response->status() >= 400) {
            Log::channel('epos')->error('EPOS Error', [
                'path' => $request->path(),
                'status' => $response->status(),
                'response' => $response->content()
            ]);
        }
        
        return $response;
    }
}
```

#### B. Health Check Endpoint
```php
// Backend/routes/api.php
Route::get('/epos/health', function() {
    return response()->json([
        'status' => 'ok',
        'version' => '2.0.1',
        'endpoints' => [
            'rfid_lookup' => 'available',
            'transaction' => 'available',
            'withdrawal' => 'available',
            'kebutuhan_order' => 'available'
        ],
        'database' => DB::connection()->getPdo() ? 'connected' : 'down',
        'timestamp' => now()
    ]);
});
```

**EPOS bisa monitoring:**
```bash
curl http://localhost:8000/api/epos/health
```

#### C. Rollback Plan
```bash
# 1. Backup sebelum deploy
git tag -a v2.0-before-refactor -m "Backup before refactor"
git push origin v2.0-before-refactor

# 2. Jika ada error, rollback cepat
git checkout v2.0-before-refactor
php artisan migrate:rollback
php artisan cache:clear
```

---

## 🎯 WORKFLOW: Refactor Step-by-Step

### Phase 1: Preparation (WAJIB!)

```bash
# 1. Dokumentasi API Contract
✅ docs/API-ROUTES-EPOS.md sudah dibuat

# 2. Buat Contract Tests
cd Backend
php artisan make:test Epos/EposApiContractTest

# 3. Buat Integration Tests
php artisan make:test Integration/Epos/EposTransactionFlowTest

# 4. Setup Mock EPOS Simulator
mkdir -p epos-simulator
cd epos-simulator
npm init -y
npm install axios
# Copy script di atas ke server.js

# 5. Run baseline tests (MUST PASS!)
php artisan test --filter Epos
node epos-simulator/server.js
```

---

### Phase 2: Refactor (PER SERVICE)

**Contoh: Refactor EposController**

```bash
# 1. Create branch
git checkout -b refactor/epos-transaction-service

# 2. Buat Service baru
php artisan make:class Services/Epos/EposTransactionService

# 3. Extract logic dari controller ke service
# PENTING: Response structure HARUS TETAP SAMA!

# 4. Update controller untuk pakai service
# OLD:
public function transaction(Request $request) {
    // 100 baris logic di sini...
}

# NEW:
public function transaction(Request $request) {
    return $this->eposTransactionService->process($request);
}

# 5. Run tests (MUST PASS!)
php artisan test --filter Epos

# 6. Run mock EPOS simulator
node epos-simulator/server.js

# 7. Manual test dengan POSTMAN
# Test semua endpoint EPOS

# 8. Commit hanya jika semua test PASS
git add .
git commit -m "✅ refactor: extract EposTransactionService (all tests pass)"

# 9. Test di staging dulu sebelum production!
```

---

### Phase 3: Testing Checklist

**Sebelum merge PR, checklist ini HARUS COMPLETED:**

- [ ] ✅ Unit tests pass: `php artisan test --filter Epos`
- [ ] ✅ Integration tests pass
- [ ] ✅ Mock EPOS simulator tests pass
- [ ] ✅ Manual test dengan Postman (semua endpoint)
- [ ] ✅ Contract test pass (response structure tidak berubah)
- [ ] ✅ Health check endpoint return OK
- [ ] ✅ No breaking changes di API contract
- [ ] ✅ Dokumentasi API up-to-date
- [ ] ✅ Code review approved
- [ ] ✅ Tested di staging environment

**Jika ADA SATU yang fail, JANGAN deploy!**

---

## 📁 WORKSPACE SETUP (Opsional tapi Direkomendasikan)

### Opsi 1: Multi-Root Workspace (VS Code)

**Buat file: `simpels-workspace.code-workspace`**
```json
{
  "folders": [
    {
      "name": "Backend",
      "path": "./Backend"
    },
    {
      "name": "Frontend",
      "path": "./frontend"
    },
    {
      "name": "Mobile",
      "path": "./mobile"
    },
    {
      "name": "EPOS (External)",
      "path": "../EPOS-PROJECT"  // Path ke project EPOS terpisah
    }
  ],
  "settings": {
    "files.exclude": {
      "**/node_modules": true,
      "**/vendor": true,
      "**/.git": true
    }
  }
}
```

**Buka workspace:**
```bash
code simpels-workspace.code-workspace
```

**Keuntungan:**
- Bisa edit Backend & EPOS sekaligus
- Search across projects
- Terminal untuk semua project dalam 1 window

---

### Opsi 2: Git Submodule (Jika EPOS punya repo terpisah)

```bash
# Di root SIMPELS-2.0
git submodule add <EPOS-REPO-URL> epos-project
git submodule init
git submodule update

# Struktur jadi:
SIMPELS-2.0/
├── Backend/
├── frontend/
├── mobile/
└── epos-project/  ← Git submodule
```

---

### Opsi 3: Docker Compose (Recommended untuk Testing)

**Update `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  backend:
    build: ./Backend
    ports:
      - "8000:8000"
    volumes:
      - ./Backend:/var/www/html
    networks:
      - simpels-network

  epos-simulator:
    build: ./epos-simulator
    ports:
      - "3001:3001"
    environment:
      - API_BASE_URL=http://backend:8000/api/v1
    depends_on:
      - backend
    networks:
      - simpels-network

networks:
  simpels-network:
    driver: bridge
```

**Run:**
```bash
docker-compose up backend epos-simulator
```

---

## 🚨 RED FLAGS - STOP IMMEDIATELY IF:

❌ Contract test FAIL  
❌ Response structure berubah  
❌ HTTP status code berubah  
❌ Field name berubah (contoh: `cash_balance` → `cashBalance`)  
❌ Integration test FAIL  
❌ Mock EPOS simulator error  
❌ Manual testing menemukan bug  

**Jika ada red flag, ROLLBACK dan fix dulu!**

---

## 📊 Success Metrics

### Before Refactor:
- Tests: ❓ Unknown
- Documentation: 🔴 Incomplete
- Error handling: 🔴 Mixed
- Monitoring: 🔴 None

### After Refactor:
- Tests: ✅ 100% pass
- Documentation: ✅ Complete
- Error handling: ✅ Consistent
- Monitoring: ✅ Full logging

---

## 🎓 Best Practices

### DO:
✅ Refactor internal logic, keep API contract sama  
✅ Run tests setiap kali ubah code  
✅ Test di staging sebelum production  
✅ Monitor logs setelah deploy  
✅ Setup rollback plan  
✅ Dokumentasi API contract  

### DON'T:
❌ Langsung refactor tanpa tests  
❌ Skip testing phase  
❌ Deploy langsung ke production  
❌ Ubah response structure tanpa versioning  
❌ Ignore error logs  

---

## 📝 Checklist Integration Ke BACKEND-REFACTOR-CHECKLIST.md

**Tambahkan di Phase 0:**
- [ ] Setup EPOS Mock Server
- [ ] Buat Contract Tests untuk EPOS endpoints
- [ ] Buat Integration Tests untuk EPOS flows
- [ ] Setup health check endpoint
- [ ] Setup EPOS request logging
- [ ] Test all EPOS endpoints dengan Postman
- [ ] Dokumentasi API contract (sudah ada di `API-ROUTES-EPOS.md`)

**Setiap Phase 1, 2, 3:**
- [ ] Run EPOS contract tests sebelum commit
- [ ] Run EPOS mock simulator
- [ ] Manual test EPOS endpoints
- [ ] Verify no breaking changes

---

## 🔗 Quick Links

- [API Routes EPOS](./API-ROUTES-EPOS.md)
- [Backend Refactor Checklist](./BACKEND-REFACTOR-CHECKLIST.md)
- [Deployment Guide](./LINUX-DEPLOY-GUIDE.md)

---

**INGAT:** Safety first! EPOS adalah production system yang dipakai real users. Jangan sampai down!

🛡️ **Test → Test → Test → Deploy**
