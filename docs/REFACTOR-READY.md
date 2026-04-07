# ✅ SIMPELS Backend Refactor - Siap Mulai!

> **Status:** 🟢 Setup Complete - Ready to Start  
> **Last Updated:** 7 April 2026, 23:55 WIB

---

## 📦 Yang Sudah Dibuat

### 1. **Checklist Refactor** ([BACKEND-REFACTOR-CHECKLIST.md](./BACKEND-REFACTOR-CHECKLIST.md))
- ✅ 198 tasks dibagi 5 fase (Phase 0-4)
- ✅ Progress tracking system
- ✅ Workflow guide lengkap

### 2. **API Documentation**
- ✅ [API-ROUTES-FRONTEND.md](./API-ROUTES-FRONTEND.md) - Semua endpoint untuk admin dashboard
- ✅ [API-ROUTES-MOBILE.md](./API-ROUTES-MOBILE.md) - Semua endpoint untuk wali mobile app  
- ✅ [API-ROUTES-EPOS.md](./API-ROUTES-EPOS.md) - Semua endpoint untuk EPOS terminal

### 3. **EPOS Safety Documents** (CRITICAL!)
- ✅ [REFACTOR-EPOS-SAFETY-STRATEGY.md](./REFACTOR-EPOS-SAFETY-STRATEGY.md) - Strategi refactor aman
- ✅ [EPOS-INTEGRATION-REFERENCE.md](./EPOS-INTEGRATION-REFERENCE.md) - Reference endpoint EPOS

### 4. **VS Code Workspace**
- ✅ [simpels-workspace.code-workspace](../simpels-workspace.code-workspace)
- Includes: Backend, Frontend, Mobile, WA Gateway, **EPOS**
- Tasks & launch configurations ready

---

## 🎯 Yang Harus Dilakukan

### Phase 0: Pre-Refactor Verification (WAJIB!)

```bash
# 1. Open workspace
code simpels-workspace.code-workspace

# 2. Mulai dari task 0.1.1
# Baca: docs/BACKEND-REFACTOR-CHECKLIST.md

# 3. Dokumentasi & test semua endpoints
# Lihat: docs/API-ROUTES-*.md

# 4. PENTING: Test EPOS integration
cd EPOS_SAZA
php integration_test.php
```

---

## 🔗 EPOS Integration - Key Points

### 📍 EPOS Location
```
c:\Users\Rhezal Maulana\Documents\GitHub\EPOS_SAZA
```

### 🔑 Critical Files
```
EPOS_SAZA/
├── app/Services/SimpelsApiService.php  ← Main integration service
├── config/services.php                  ← Endpoint configuration  
└── tests/Feature/SimpelsIntegrationTest.php
```

### 🚨 Critical Endpoints (DO NOT BREAK!)

1. **Health Check**
   ```
   GET /api/v1/wallets/ping
   ```

2. **RFID Lookup** ⭐ PALING KRUSIAL!
   ```
   GET /api/v1/wallets/rfid/uid/{uid}
   ```

3. **Transaction** ⭐ PALING KRUSIAL!
   ```
   POST /api/v1/wallets/epos/transaction
   ```

4. **Wallet Settings**
   ```
   GET /api/v1/epos/wallet-settings
   ```

### ✅ AMAN untuk direfactor
- ✅ Extract logic ke service
- ✅ Add tests
- ✅ Optimize queries
- ✅ Add caching
- ✅ Improve error handling

### ❌ TIDAK AMAN (JANGAN!)
- ❌ Ubah response structure
- ❌ Ubah field names
- ❌ Ubah HTTP status codes
- ❌ Ubah endpoint URLs
- ❌ Remove fields

---

## 🧪 Testing Strategy

### Before Every Commit
```bash
# 1. Run backend tests
cd Backend
php artisan test --filter Epos

# 2. Run EPOS integration test
cd ../EPOS_SAZA
php integration_test.php

# 3. Manual check critical endpoints
curl http://localhost:8000/api/v1/wallets/ping
curl http://localhost:8000/api/v1/wallets/rfid/uid/TEST123
```

### Baseline Testing (Phase 0)
```bash
# Save current responses
mkdir -p docs/api-baseline
curl http://localhost:8000/api/v1/wallets/ping > docs/api-baseline/ping.json
curl http://localhost:8000/api/v1/wallets/rfid/uid/TEST123 > docs/api-baseline/rfid-lookup.json

# Compare after refactor
diff docs/api-baseline/ping.json <(curl http://localhost:8000/api/v1/wallets/ping)
```

---

## 🚀 Workflow Refactor

### 1. Phase 0: Verification (1-2 hari)
```bash
git checkout -b refactor/phase-0-verification

# Task 0.1.1 - 0.1.6
# Dokumentasi + testing semua endpoint
# EPOS integration baseline test

git commit -m "✅ phase 0: API verification & EPOS baseline"
```

### 2. Phase 1: WalletController (3-5 hari)
```bash
git checkout -b refactor/wallet-controller

# Task 1.1.1: WalletBalanceService
php artisan make:class Services/Wallet/WalletBalanceService
# Extract logic...
php artisan test --filter Epos  # MUST PASS!

git commit -m "✅ extract WalletBalanceService"

# Task 1.1.2: WalletCrudService
# ...dst
```

### 3. After Every Task
```bash
# 1. Run tests
php artisan test --filter Epos

# 2. Check EPOS integration
cd ../EPOS_SAZA && php integration_test.php

# 3. Jika PASS, commit
git add .
git commit -m "✅ task 1.1.X completed - all tests pass"

# 4. Jika FAIL, rollback & fix
git reset --hard HEAD
```

---

## 📁 Project Structure

```
SIMPELS-2.0/
├── Backend/              ← Refactor ini
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   └── WalletController.php  (1,605 baris → 150 baris)
│   │   └── Services/
│   │       └── Wallet/  ← Buat folder ini
│   │           ├── WalletBalanceService.php
│   │           ├── WalletCrudService.php
│   │           └── ...
│   ├── routes/api.php
│   └── tests/
│       ├── Feature/Epos/
│       └── Integration/Epos/
│
├── EPOS_SAZA/            ← JANGAN diubah!
│   ├── app/Services/SimpelsApiService.php
│   └── config/services.php
│
├── frontend/
├── mobile/
├── wa-gateway/
│
└── docs/
    ├── BACKEND-REFACTOR-CHECKLIST.md  ← Checklist utama
    ├── EPOS-INTEGRATION-REFERENCE.md  ← ⭐ Baca dulu!
    ├── REFACTOR-EPOS-SAFETY-STRATEGY.md
    ├── API-ROUTES-*.md
    └── api-baseline/  ← Buat folder ini untuk baseline JSON
```

---

## ⚠️ Red Flags - STOP Immediately!

Hentikan refactor dan rollback jika:
- ❌ EPOS contract tests FAIL
- ❌ EPOS integration test error
- ❌ Response structure berubah
- ❌ HTTP status codes berubah
- ❌ Field names berubah
- ❌ Endpoint tidak response
- ❌ Response time > 500ms

**Fix dulu sebelum lanjut!**

---

## 🎓 Best Practices

### DO:
✅ Test setiap commit  
✅ Commit sering dengan pesan jelas  
✅ Update checklist after each task  
✅ Keep response structure identical  
✅ Monitor logs during testing  
✅ Test di EPOS sebelum merge  

### DON'T:
❌ Skip testing phase  
❌ Deploy tanpa EPOS test  
❌ Ubah API contract  
❌ Commit tanpa test pass  
❌ Refactor banyak sekaligus  
❌ Ignore error logs  

---

## 📊 Success Metrics

### Before Refactor
```
⚠️ WalletController:      1,605 baris
⚠️ WaliController:          958 baris
⚠️ SantriController:        870 baris
⚠️ Test Coverage:           ~20%
⚠️ EPOS Tests:              None
⚠️ Documentation:           Incomplete
```

### After Refactor (Target)
```
✅ WalletController:      < 150 baris
✅ All Services:          < 200 baris each
✅ Test Coverage:           > 70%
✅ EPOS Tests:              100% pass
✅ Documentation:           Complete
✅ No Breaking Changes
```

---

## 🔗 Quick Links

### Documentation
- [Main Checklist](./BACKEND-REFACTOR-CHECKLIST.md)
- [EPOS Reference](./EPOS-INTEGRATION-REFERENCE.md) ⭐
- [EPOS Safety](./REFACTOR-EPOS-SAFETY-STRATEGY.md)
- [API Frontend](./API-ROUTES-FRONTEND.md)
- [API Mobile](./API-ROUTES-MOBILE.md)
- [API EPOS](./API-ROUTES-EPOS.md)

### Key Files
- [Workspace Config](../simpels-workspace.code-workspace)
- [Backend Routes](../Backend/routes/api.php)
- [EPOS Service](../../EPOS_SAZA/app/Services/SimpelsApiService.php)

---

## 🚦 Ready to Start?

### Step 1: Open Workspace
```bash
cd "c:\Users\Rhezal Maulana\Documents\GitHub\SIMPELS-2.0"
code simpels-workspace.code-workspace
```

### Step 2: Read Documents
1. [BACKEND-REFACTOR-CHECKLIST.md](./BACKEND-REFACTOR-CHECKLIST.md)
2. [EPOS-INTEGRATION-REFERENCE.md](./EPOS-INTEGRATION-REFERENCE.md) ⭐

### Step 3: Start Phase 0
```bash
git checkout -b refactor/phase-0-verification
```

### Step 4: Complete Phase 0 Tasks
- Task 0.1.1: Frontend API docs
- Task 0.1.2: Mobile API docs
- Task 0.1.3: EPOS API docs
- Task 0.1.4: Contract tests
- Task 0.1.5: Backup & safety
- Task 0.1.6: EPOS integration safety ⭐

### Step 5: Setelah Phase 0 100%
```bash
git add .
git commit -m "✅ phase 0 complete: all APIs verified & EPOS baseline tested"
git push
# Create PR for review
```

---

## 💬 Questions?

Check dokumentasi lengkap di folder `docs/`:
- General questions → [BACKEND-REFACTOR-CHECKLIST.md](./BACKEND-REFACTOR-CHECKLIST.md)
- EPOS specific → [EPOS-INTEGRATION-REFERENCE.md](./EPOS-INTEGRATION-REFERENCE.md)
- Safety concerns → [REFACTOR-EPOS-SAFETY-STRATEGY.md](./REFACTOR-EPOS-SAFETY-STRATEGY.md)

---

**Remember:** 
- 🛡️ Safety First!
- 🧪 Test → Test → Test
- 📝 Document Everything
- 🔄 Commit Often
- ⚡ EPOS Must Always Work!

**Semoga sukses refactornya! 🚀**
