# Fix WA Block, Reminder Saldo & Auto-Confirm Pesanan Kebutuhan

**Tanggal:** 6 April 2026  
**Status:** ✅ Ready to Deploy

## 🔧 Perubahan yang Dibuat

### 1. **WA Gateway - Anti Block (Delay Random)**

**File:** `wa-gateway/src/worker.js`

**Problem:**
- Pesan dikirim terlalu cepat beruntun
- WhatsApp mendeteksi sebagai spam → akun di-block

**Solusi:**
- Tambah delay random **5-15 detik** setelah setiap pengiriman
- Lebih aman dari deteksi spam WhatsApp

**Perubahan:**
```javascript
// Setelah kirim pesan, tunggu 5-15 detik sebelum ambil job berikutnya
const delayMs = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
await new Promise(resolve => setTimeout(resolve, delayMs));
```

---

### 2. **Backend - Fix Reminder Saldo**

#### A. Enable Log Scheduler

**File:** `Backend/Dockerfile`

**Problem:**
- Scheduler log di-disable (`/dev/null`)
- Tidak tahu apakah scheduler jalan atau ada error

**Solusi:**
- Redirect log scheduler ke stdout/stderr
- Sekarang bisa lihat log di Dokploy dashboard

#### B. Auto-Seed Template WA

**File:** 
- `Backend/database/seeders/DatabaseSeeder.php`
- `Backend/docker-entrypoint.sh`

**Problem:**
- Template WA `reminder_saldo` tidak masuk ke database
- Command `wa:reminder-saldo-minimal` gagal karena tidak ada template

**Solusi:**
- Tambahkan `WaMessageTemplateSeeder` ke DatabaseSeeder
- Auto-run seeder setiap kali deploy

---

### 3. **Pesanan Kebutuhan - Auto-Confirm**

**File:**
- `Backend/app/Models/EposKebutuhanOrder.php`
- `Backend/app/Http/Controllers/Api/V1/Epos/KebutuhanOrderController.php`
- `Backend/database/seeders/WaMessageTemplateSeeder.php`

**Problem:**
- Pesanan kebutuhan auto-cancel setelah 24 jam
- Wali sering lupa konfirmasi → pesanan dibatalkan

**Solusi:**
- **Auto-confirm otomatis** setelah 24 jam
- Saldo dipotong otomatis jika mencukupi
- Template WA diubah: "akan dikonfirmasi otomatis" instead of "akan dibatalkan"

**Perubahan:**
- Method `expireOldOrders()` → `autoConfirmOldOrders()`
- Otomatis potong saldo & buat transaksi jika saldo cukup
- Push status ke EPOS otomatis
- Jika saldo tidak cukup, baru di-expire

**Template WA baru:**
```
🛒 PESANAN KEBUTUHAN SANTRI

✅ Pesanan akan otomatis dikonfirmasi dalam 24 jam jika tidak ada penolakan.

📱 CARA MENOLAK PESANAN:
1️⃣ Buka aplikasi SIMPELS Mobile
2️⃣ Login dengan nomor HP Anda
3️⃣ Pilih menu "Pesanan Kebutuhan"
4️⃣ Klik Tolak jika tidak setuju

💡 Catatan: 
• Saldo akan dipotong otomatis setelah 24 jam
• Pastikan saldo santri mencukupi
```

---

## 🚀 Cara Deploy

### Step 1: Commit & Push

```powershell
git add .
git commit -m "fix: WA anti-block delay + auto-confirm pesanan kebutuhan + enable scheduler log + auto-seed WA templates"
git push origin main
```

### Step 2: Redeploy di Dokploy

#### **Backend:**
1. Buka dashboard Dokploy
2. Pilih service **Backend** (SIMPELS API)
3. Klik **"Redeploy"**
4. Tunggu build selesai (~2-5 menit)

#### **WA Gateway:**
1. Pilih service **WA Gateway**
2. Klik **"Redeploy"**
3. Tunggu build selesai (~1-3 menit)

---

## ✅ Cara Verifikasi

### 1. **Cek Log WA Gateway**

Buka Logs WA Gateway di Dokploy, pastikan muncul:
```
[Worker] Job 12345 sent successfully
[Worker] Waiting 8.3s before next message (anti-spam)
```

### 2. **Cek Log Scheduler Backend**

Buka Logs Backend di Dokploy, setiap 1 menit seharusnya muncul:
```
Running scheduled command: Artisan::call('wa:run-scheduled')
Running scheduled command: Artisan::call('wa:reminder-saldo-minimal')
```

### 3. **Test Manual Reminder Saldo**

SSH ke container Backend:
```bash
# Dry-run (preview tanpa kirim)
php artisan wa:reminder-saldo-minimal --dry-run

# Kirim nyata
php artisan wa:reminder-saldo-minimal
```

**Output yang diharapkan:**
```
Mengecek santri dengan saldo di bawah Rp 10.000
=== SUMMARY ===
Total santri aktif: 50
Saldo di bawah minimal: 5
Sudah dinotifikasi sebelumnya: 2
Tanpa wallet: 0
Antrian dibuat: 3
```

### 4. **Cek Template di Database**

Login ke database, jalankan:
```sql
SELECT type, LEFT(body, 50) FROM wa_message_templates WHERE type = 'reminder_saldo';
```

Harusnya ada 1 row dengan template "⚠️ *NOTIFIKASI SALDO RENDAH*..."

---

## 📋 Checklist Deploy

- [ ] Commit & push semua perubahan
- [ ] Redeploy Backend di Dokploy  
- [ ] Redeploy WA Gateway di Dokploy
- [ ] Cek log scheduler muncul di Backend logs
- [ ] Cek delay muncul di WA Gateway logs
- [ ] Test command `wa:reminder-saldo-minimal --dry-run`
- [ ] Verifikasi template `reminder_saldo` ada di database

---

## 📅 Jadwal Reminder Saldo

**Scheduler:** Setiap hari jam **08:00 WIB**

**Kondisi pengiriman:**
- Santri status `aktif`
- Saldo < `global_minimum_balance` (default: Rp 10.000)
- Belum pernah dinotifikasi sebelumnya (akan reset jika saldo naik lagi)

**Template pesan:**
```
⚠️ NOTIFIKASI SALDO RENDAH

Assalamu'alaikum Wr. Wb.
Yth. Wali Santri *[Nama Santri]*

Kami informasikan bahwa saldo santri saat ini berada di bawah 
batas minimal yang ditentukan:

💰 Saldo saat ini: Rp [Saldo]
📊 Batas minimal: Rp [Minimum]

Mohon segera melakukan top-up saldo agar santri dapat melakukan 
transaksi dengan lancar.
```

---

## 🔧 Troubleshooting

### Reminder Saldo Tidak Terkirim

1. **Cek scheduler jalan:**
   ```bash
   # Di container Backend
   grep "schedule:run" /proc/*/cmdline
   ```

2. **Cek template ada:**
   ```bash
   php artisan tinker
   >>> \App\Models\WaMessageTemplate::where('type', 'reminder_saldo')->exists()
   ```

3. **Cek global minimum balance:**
   ```bash
   php artisan tinker
   >>> \App\Models\WalletSettings::first()->global_minimum_balance
   ```

4. **Test manual:**
   ```bash
   php artisan wa:reminder-saldo-minimal --dry-run
   ```

### WA Masih Kena Block

1. **Perbesar delay** (edit `worker.js`):
   ```javascript
   // Ubah dari 5-15 detik jadi 10-30 detik
   const delayMs = Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000;
   ```

2. **Kurangi frekuensi reminder:**
   - Edit `routes/console.php`
   - Ubah jadwal dari `dailyAt` jadi `twiceWeekly` atau `weekly`

---

## 📝 Notes

- Delay random mencegah pattern yang predictable
- Scheduler log sekarang visible untuk debugging
- Template auto-seed setiap kali deploy (updateOrCreate, aman)
- Field `low_balance_notified_at` di `wallets` table untuk tracking
