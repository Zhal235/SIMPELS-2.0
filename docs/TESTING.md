# Quick Start - Testing Integrasi Penarikan ePOS ↔ SIMPELS

## 🚀 Jalankan Aplikasi

### 1. SIMPELS Backend (Port 8001)
```bash
cd "C:\Users\Rhezal Maulana\Documents\GitHub\SIMPELS-2.0\Backend"
php artisan serve --port=8001
```

### 2. SIMPELS Frontend (Port 5173)
```bash
cd "C:\Users\Rhezal Maulana\Documents\GitHub\SIMPELS-2.0\frontend"
npm run dev
```

### 3. ePOS (Port 8002)
```bash
cd "C:\Users\Rhezal Maulana\Documents\GitHub\EPOS_SAZA"
php artisan serve --port=8002
```

---

## 🧪 Test Flow

### Step 1: Buat Request Penarikan di ePOS
1. Buka ePOS: http://localhost:8002
2. Login sebagai admin
3. Menu: **Manajemen Keuangan** (icon 💰 di sidebar kiri)
4. Klik Tab **"Penarikan RFID"** (tab ketiga dengan icon 💵)
5. Klik tombol **"Tarik Saldo RFID"** (tombol biru di kanan atas)
6. Modal akan terbuka, input data:
   - **Nominal**: Masukkan nominal penarikan atau kosongkan untuk tarik semua saldo tersedia
   - **Metode Penarikan**: Pilih "Transfer Bank" atau "Tunai"
   - Jika Transfer Bank: isi Nama Bank, No Rekening, Nama Pemegang
   - **Catatan**: Opsional
7. Klik **"Ajukan"**

**Expected Result:**
- ✅ Notifikasi sukses: "Permintaan penarikan dibuat dan dikirim ke SIMPels"
- ✅ Muncul di riwayat dengan status "pending"

### Step 2: Approve di SIMPELS
1. Buka SIMPELS: http://localhost:5173
2. Login sebagai admin
3. Menu: **Dompet** → **"Penarikan ePOS"**
4. Lihat saldo pool ePOS (catat nilainya)
5. Klik **"Setujui"** pada request yang pending
6. Konfirmasi

**Expected Result:**
- ✅ Notifikasi sukses: "Withdrawal berhasil disetujui"
- ✅ Status berubah menjadi "Disetujui"
- ✅ Saldo pool berkurang sesuai nominal
- ✅ Callback terkirim ke ePOS

### Step 3: Verifikasi di ePOS
1. Kembali ke ePOS
2. Refresh halaman atau klik button refresh
3. Check status withdrawal

**Expected Result:**
- ✅ Status SIMPELS berubah menjadi "Disetujui"
- ✅ Ada timestamp update
- ✅ Transaksi terkait ditandai sudah ditarik

---

## 🔍 Debugging

### Check Logs

**SIMPELS Backend:**
```bash
cd "C:\Users\Rhezal Maulana\Documents\GitHub\SIMPELS-2.0\Backend"
Get-Content storage\logs\laravel.log -Tail 50 -Wait
```

**ePOS:**
```bash
cd "C:\Users\Rhezal Maulana\Documents\GitHub\EPOS_SAZA"
Get-Content storage\logs\laravel.log -Tail 50 -Wait
```

### Test API Endpoints

**Test SIMPELS Ping:**
```powershell
curl http://localhost:8001/api/v1/wallets/ping
```

**Test List Withdrawals (SIMPELS):**
```powershell
curl http://localhost:8001/api/v1/wallets/epos/withdrawals
```

**Test ePOS Callback Endpoint:**
```powershell
curl -X PUT http://localhost:8002/api/simpels/withdrawal/TEST123/status `
  -H "Content-Type: application/json" `
  -d '{"status":"approved","updated_by":"Test","notes":"Test"}'
```

---

## ⚠️ Troubleshooting

### Issue: Request tidak sampai ke SIMPELS

**Solution:**
1. Check SIMPELS backend running di port 8001
2. Test ping: `curl http://localhost:8001/api/v1/wallets/ping`
3. Check `.env` ePOS: `SIMPELS_API_URL=http://localhost:8001/api/v1/wallets`

### Issue: Callback tidak sampai ke ePOS

**Solution:**
1. Check ePOS running di port 8002
2. Check `.env` SIMPELS: `EPOS_API_URL=http://localhost:8002`
3. Manual refresh di ePOS UI

### Issue: Error 500 saat approve

**Solution:**
1. Check log SIMPELS Backend
2. Pastikan saldo pool mencukupi
3. Pastikan status withdrawal = "pending"

---

## 📊 Database Check

### SIMPELS - Check Pool Balance
```sql
-- Connect to SIMPELS database
SELECT * FROM epos_pools WHERE name = 'epos_main';
```

### SIMPELS - Check Withdrawals
```sql
-- Connect to SIMPELS database
SELECT id, withdrawal_number, amount, status, approved_at 
FROM epos_withdrawals 
ORDER BY created_at DESC 
LIMIT 5;
```

### ePOS - Check Withdrawals
```sql
-- Connect to EPOS database
SELECT id, withdrawal_number, total_amount, status, simpels_status 
FROM simpels_withdrawals 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## ✅ Success Criteria

Integrasi berhasil jika:
1. ✅ Request dibuat di ePOS muncul di SIMPELS
2. ✅ Approval di SIMPELS memotong saldo pool
3. ✅ Status di ePOS ter-update setelah approval
4. ✅ Rejection di SIMPELS ter-update di ePOS
5. ✅ Log tidak ada error critical
6. ✅ UI responsive dan user-friendly

---

**Happy Testing! 🎉**
