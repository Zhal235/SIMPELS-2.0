# Testing Login dengan Nomor HP - SIMPELS Mobile

## Persiapan Testing

### 1. Pastikan Backend Running
```bash
cd Backend
php artisan serve --port=8001
```

### 2. Pastikan Ada Data Santri
Check data santri di database:
```bash
php artisan tinker --execute="echo json_encode(\App\Models\Santri::select('nama_santri', 'hp_ayah', 'hp_ibu')->limit(5)->get()->toArray(), JSON_PRETTY_PRINT);"
```

### 3. Launch Mobile App
```bash
cd mobile
flutter run -d chrome
```

---

## Skenario Testing

### Test 1: Login dengan Nomor HP Ayah (Single Account)
**Input:**
- Nomor HP: `081234567801`
- Password: `123456`

**Expected Result:**
- Login berhasil
- Langsung masuk ke Home Screen (tidak ada pilihan santri)
- Dashboard menampilkan data santri "Budi Saputra"

---

### Test 2: Login dengan Nomor HP Ayah (Multi Account)
**Input:**
- Nomor HP: `081234567800`
- Password: `123456`

**Expected Result:**
- Login berhasil
- Tampil "Select Account Screen"
- Menampilkan 2 card santri:
  1. Ahmad Putra (Saldo: Rp 464.000)
  2. Budi Saputra (Saldo: Rp 0)
- Setelah pilih santri → masuk Home Screen dengan data santri terpilih

---

### Test 3: Login dengan Nomor HP Ibu
**Input:**
- Nomor HP: `081234567900`
- Password: `123456`

**Expected Result:**
- Login berhasil
- Profile menampilkan "Ibu dari Ahmad Putra"
- Dashboard menampilkan data santri "Ahmad Putra"

---

### Test 4: Login dengan Format Nomor Berbeda
**Test berbagai format nomor HP (semuanya harus berhasil):**

| Format Input | Dinormalisasi Jadi | Status |
|--------------|-------------------|---------|
| `081234567800` | `6281234567800` | ✅ Valid |
| `8123456780 0` | `6281234567800` | ✅ Valid |
| `+6281234567800` | `6281234567800` | ✅ Valid |
| `6281234567800` | `6281234567800` | ✅ Valid |
| `0812-3456-7800` | `6281234567800` | ✅ Valid |

**Expected Result:** Semua format berhasil login

---

### Test 5: Password Salah
**Input:**
- Nomor HP: `081234567800`
- Password: `wrongpass`

**Expected Result:**
- Login gagal
- Muncul snackbar: "Password salah."

---

### Test 6: Nomor HP Tidak Terdaftar
**Input:**
- Nomor HP: `089999999999`
- Password: `123456`

**Expected Result:**
- Login gagal
- Muncul snackbar: "Nomor HP tidak terdaftar atau tidak ada santri aktif."

---

## Testing Backend API Langsung

### Test Login API
```powershell
# Single account
$body = @{no_hp='081234567801';password='123456'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:8001/api/auth/login' -Method POST -Body $body -ContentType 'application/json' -Headers @{'Accept'='application/json'}
$response | ConvertTo-Json -Depth 10

# Multi account
$body = @{no_hp='081234567800';password='123456'} | ConvertTo-Json
$response = Invoke-RestMethod -Uri 'http://localhost:8001/api/auth/login' -Method POST -Body $body -ContentType 'application/json' -Headers @{'Accept'='application/json'}
$response.santri | ConvertTo-Json
```

### Test dengan cURL (Bash/Linux/Mac)
```bash
# Single account
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"no_hp":"081234567801","password":"123456"}'

# Multi account
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"no_hp":"081234567800","password":"123456"}'
```

---

## Expected API Response

### Single Account Response
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "xxx",
  "wali": {
    "no_hp": "081234567801",
    "nama": "Bapak Saputra",
    "tipe": "ayah",
    "label": "Ayah dari Budi Saputra"
  },
  "santri": [
    {
      "id": "uuid-xxx",
      "nis": "70000002",
      "nama": "Budi Saputra",
      "jenis_kelamin": "L",
      "kelas": null,
      "asrama": null,
      "foto_url": null,
      "saldo_dompet": 0,
      "hubungan": "ayah",
      "nama_wali": "Bapak Saputra"
    }
  ],
  "active_santri_id": "uuid-xxx"
}
```

### Multi Account Response
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "xxx",
  "wali": {
    "no_hp": "081234567800",
    "nama": "Bapak Putra",
    "tipe": "ayah",
    "label": "Ayah dari Ahmad Putra"
  },
  "santri": [
    {
      "id": "uuid-1",
      "nama": "Ahmad Putra",
      "saldo_dompet": 464000,
      ...
    },
    {
      "id": "uuid-2",
      "nama": "Budi Saputra",
      "saldo_dompet": 0,
      ...
    }
  ],
  "active_santri_id": "uuid-1"
}
```

---

## Troubleshooting

### Error: "Nomor HP tidak terdaftar"
**Penyebab:** Nomor HP tidak ada di database atau santri tidak aktif

**Solusi:**
```bash
# Check data santri
php artisan tinker --execute="\App\Models\Santri::where('status', 'aktif')->get(['nama_santri', 'hp_ayah', 'hp_ibu'])"

# Atau update nomor HP santri
DB::table('santri')->where('id', 'uuid-santri')->update(['hp_ayah' => '081234567800']);
```

### Error: "Connection refused"
**Penyebab:** Backend tidak running

**Solusi:**
```bash
cd Backend
php artisan serve --port=8001
```

### Hot Reload Tidak Bekerja
**Solusi:**
```bash
# Stop app (Ctrl+C di terminal flutter)
# Restart
cd mobile
flutter run -d chrome
```

---

## Checklist Testing

- [ ] Login dengan HP ayah (single account) → ✅ Langsung ke home
- [ ] Login dengan HP ayah (multi account) → ✅ Tampil select account
- [ ] Login dengan HP ibu → ✅ Berhasil
- [ ] Login dengan format +62 → ✅ Berhasil
- [ ] Login dengan format tanpa 0 → ✅ Berhasil
- [ ] Login dengan password salah → ✅ Error message muncul
- [ ] Login dengan HP tidak terdaftar → ✅ Error message muncul
- [ ] Switch account dari profile → ⏳ (Belum diimplementasi)
- [ ] Token tersimpan di storage → ✅ Auto-login saat buka app
- [ ] Logout berfungsi → ✅ Redirect ke login screen

---

## Next Steps

- [ ] Implementasi Switch Account di Profile Tab
- [ ] Update Home Screen dengan DANA-style UI
- [ ] Implementasi fitur detail transaksi
- [ ] Implementasi fitur top-up saldo
- [ ] Add loading states & error handling yang lebih baik

---

Last updated: November 24, 2025
