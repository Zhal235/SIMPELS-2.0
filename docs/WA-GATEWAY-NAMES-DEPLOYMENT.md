# WA Gateway - Santri Names Feature Deployment Guide

## 🔧 Masalah
Nama santri tidak muncul di WA Gateway logs di server production (Dokploy), tapi muncul di local.

## 🎯 Solusi

### Penyebab Kemungkinan:
1. ✅ Migration belum dijalankan di production
2. ✅ Cache Laravel belum di-clear
3. ✅ Model accessor tidak ter-load
4. ✅ PHP-FPM perlu restart

---

## 📦 Deploy ke Production (Dokploy)

### **Metode 1: Via Dokploy Console** (RECOMMENDED)

1. **Buka Dokploy Dashboard**
   - Masuk ke project SIMPELS Backend
   - Klik **"Terminal"** atau **"Console"**

2. **Jalankan Command Berikut:**

```bash
# Masuk ke direktori app
cd /app

# Pull latest code (jika belum otomatis)
git pull origin main

# Clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Run migration
php artisan migrate --force

# Optimize
php artisan config:cache
php artisan route:cache

# Test accessor
php artisan tinker --execute="\$log = \App\Models\WaMessageLog::first(); echo \$log ? (\$log->santri_names ?? 'null') : 'no logs';"
```

### **Metode 2: Trigger Redeploy** (AUTO)

1. **Push code ke Git:**
   ```bash
   git add .
   git commit -m "feat: add santri names to WA logs"
   git push origin main
   ```

2. **Di Dokploy Dashboard:**
   - Pilih **Backend service**
   - Klik **"Redeploy"**
   - Tunggu hingga status **hijau (✓)**

3. **Setelah deploy selesai, exec ke container:**
   ```bash
   php artisan migrate --force
   php artisan config:cache
   ```

---

## 🧪 Testing

### **1. Test di Local Dulu:**

```powershell
# Di folder Backend
.\deploy-wa-names-fix.ps1
```

Pastikan output: `Santri Names: Ahmad Rizki, Fatimah` (bukan null)

### **2. Test API di Production:**

```bash
# Via curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api-simpels.saza.sch.id/api/v1/admin/wa/logs
```

**Response harus include:**
```json
{
  "data": [{
    "id": 1,
    "phone": "081234567890",
    "santri_names": "Ahmad Rizki, Fatimah Zahra",  ← HARUS ADA
    "message_type": "reminder",
    "status": "sent"
  }]
}
```

### **3. Test di Browser:**

1. Buka: https://app-simpels.saza.sch.id/wa-gateway
2. Lihat log WA
3. Pastikan **👤 Nama Santri** muncul di setiap log untuk wali

---

## 🔍 Troubleshooting

### ❌ Nama masih null setelah deploy

**Check 1: Apakah migration sudah jalan?**
```bash
php artisan migrate:status
```
Cari: `2026_03_07_000001_create_wa_message_logs_table` → harus **Ran**

**Check 2: Clear cache sekali lagi**
```bash
php artisan optimize:clear
php artisan config:cache
```

**Check 3: Restart container**
Di Dokploy Dashboard:
- Klik **Backend service**
- Klik **"Restart"**

**Check 4: Cek logs**
```bash
php artisan tinker --execute="
\$log = \App\Models\WaMessageLog::with('santri')->first();
dd(\$log->santri_names);
"
```

### ❌ Error "Class 'Santri' not found"

Model `Santri` tidak ter-import di `WaMessageLog.php`. Tambahkan di bagian atas:
```php
use App\Models\Santri;
```

### ❌ Error di frontend console

Buka **Developer Tools → Console**, lihat error:
```
[WA Log] Data log tidak valid atau kosong
```

Berarti API tidak return data yang benar. Cek response API langsung.

---

## 📝 Files yang Diubah

- ✅ `Backend/app/Models/WaMessageLog.php` - Added `santri_names` accessor
- ✅ `Backend/database/migrations/2026_03_07_000001_create_wa_message_logs_table.php` - Created table
- ✅ `frontend/src/components/wa/WaMessageLogTable.tsx` - Show santri names in UI

---

## ✅ Checklist Deployment

- [ ] Git pull latest code di production
- [ ] Run `php artisan migrate --force`
- [ ] Clear cache: `php artisan config:clear`
- [ ] Optimize: `php artisan config:cache`
- [ ] Test accessor via tinker
- [ ] Test API endpoint
- [ ] Clear browser cache & reload
- [ ] Verify nama santri muncul di UI

---

## 🚀 One-Liner untuk Dokploy Console

```bash
cd /app && git pull && php artisan migrate --force && php artisan config:clear && php artisan cache:clear && php artisan config:cache && php artisan route:cache && echo "✅ Done! Test API: curl https://api-simpels.saza.sch.id/api/v1/admin/wa/logs"
```

Setelah semua langkah di atas, nama santri akan muncul di production! 🎉
