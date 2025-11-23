# 📍 Lokasi Menu Penarikan di UI ePOS

## 🎯 Langkah Demi Langkah

### 1️⃣ **Login ke ePOS**
- URL: `http://localhost:8002`
- Login dengan akun admin

### 2️⃣ **Buka Menu Manajemen Keuangan**
- **Lokasi**: Sidebar kiri aplikasi
- **Icon**: 💰 (icon uang/wallet)
- **Label**: "Manajemen Keuangan"

```
┌─────────────────────┐
│ 🏠 Dashboard        │
│ 📦 Produk           │
│ 🧾 Transaksi        │
│ 👥 Pelanggan        │
│ 💰 Manajemen        │  ← KLIK DI SINI
│    Keuangan         │
│ 📊 Laporan          │
│ ⚙️ Pengaturan       │
└─────────────────────┘
```

### 3️⃣ **Pilih Tab "Penarikan RFID"**
Setelah masuk ke halaman Manajemen Keuangan, Anda akan melihat beberapa tab di bagian atas:

```
┌────────────────────────────────────────────────────────────────┐
│  [📊 Ringkasan]  [📝 Transaksi]  [💵 Penarikan RFID]  [🛒 ...]│
└────────────────────────────────────────────────────────────────┘
                                        ↑
                                  KLIK TAB INI
```

**Tab yang tersedia:**
1. **Ringkasan** - Overview keuangan
2. **Transaksi** - Detail transaksi harian
3. **Penarikan RFID** ← **KLIK TAB INI**
4. **Pengeluaran** - Pengeluaran operasional

### 4️⃣ **Klik Tombol "Tarik Saldo RFID"**
Di halaman tab "Penarikan RFID", di **pojok kanan atas** ada tombol:

```
┌──────────────────────────────────────────────────────────────┐
│ Tab: Penarikan RFID                   [+ Tarik Saldo RFID]  │ ← KLIK TOMBOL INI
└──────────────────────────────────────────────────────────────┘
```

**Tampilan Tombol:**
- Warna: Biru (indigo)
- Icon: ➕ (plus)
- Text: "Tarik Saldo RFID"

### 5️⃣ **Isi Form Penarikan**
Modal/dialog akan terbuka dengan form berikut:

```
┌────────────────────────────────────────────────┐
│  Ajukan Penarikan Saldo RFID              [X] │
├────────────────────────────────────────────────┤
│                                                │
│  Nominal (Rp)                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ (kosongkan untuk tarik semua)            │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Periode                                       │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ Dari Tanggal │  │ S/d Tanggal  │          │
│  └──────────────┘  └──────────────┘          │
│                                                │
│  Metode Penarikan                              │
│  ○ Transfer Bank                               │
│  ○ Tunai                                       │
│                                                │
│  [Jika Transfer Bank]                          │
│  Nama Bank: ________________________           │
│  No Rekening: ______________________           │
│  Nama Pemegang: ____________________           │
│                                                │
│  Catatan (opsional)                            │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│         [Batal]           [Ajukan]            │
└────────────────────────────────────────────────┘
```

### 6️⃣ **Klik "Ajukan"**
- Form akan divalidasi
- Request dikirim ke SIMPELS
- Modal akan tertutup
- Muncul notifikasi sukses
- Penarikan baru akan muncul di tabel riwayat

---

## 📊 Tampilan Setelah Pengajuan

Setelah berhasil mengajukan, Anda akan melihat di tabel:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Riwayat Penarikan Saldo RFID                                              │
├──────────┬──────────────┬────────────┬──────────┬────────────┬──────────┤
│ Tanggal  │ No. Penarikan│ Nominal    │ Metode   │ Status     │ Status   │
│          │              │            │          │ Internal   │ SIMPels  │
├──────────┼──────────────┼────────────┼──────────┼────────────┼──────────┤
│ 23/11/25 │ WD2025112301 │ Rp 500,000 │ Bank     │ Pending    │ Pending  │
│ 10:30    │              │            │ Transfer │            │          │
├──────────┼──────────────┼────────────┼──────────┼────────────┼──────────┤
│ ...      │ ...          │ ...        │ ...      │ ...        │ ...      │
└──────────┴──────────────┴────────────┴──────────┴────────────┴──────────┘
```

**Penjelasan Status:**
- **Status Internal**: Status di sistem ePOS lokal (pending/processing/completed/cancelled)
- **Status SIMPels**: Status dari sistem SIMPELS (pending/approved/rejected/completed)

---

## 💡 Tips

### ✅ Kapan Menggunakan Fitur Ini?
- Ketika ada saldo RFID yang terkumpul dari transaksi pembayaran santri
- Ingin menarik dana untuk operasional atau keperluan lain
- Perlu approval dari pihak SIMPELS

### 📈 Informasi Saldo
Di bagian atas halaman, Anda akan melihat card:

```
┌─────────────────────────────────┐
│ Saldo RFID Tersedia            │
│ Rp 1.250.000                    │
│ 💳 Siap ditarik                 │
└─────────────────────────────────┘
```

**Saldo ini adalah:**
- Total transaksi RFID yang sudah completed
- Belum pernah ditarik sebelumnya
- Siap untuk diajukan penarikan

### ⏱️ Waktu Proses
1. **Pengajuan di ePOS**: Instant
2. **Tampil di SIMPELS**: < 1 detik (jika koneksi lancar)
3. **Menunggu Approval**: Tergantung admin SIMPELS
4. **Update Status ke ePOS**: 
   - Otomatis via callback (instant)
   - Manual refresh jika callback gagal

### 🔄 Refresh Status
Jika status belum update otomatis:
- Klik tombol refresh di pojok kanan atas tabel
- Atau reload halaman (F5)

---

## ❓ FAQ

**Q: Berapa minimal nominal penarikan?**
A: Minimal Rp 1 (tapi disarankan minimal sesuai kebijakan internal)

**Q: Bisa tarik semua saldo sekaligus?**
A: Ya, kosongkan field "Nominal" atau isi dengan nominal = saldo tersedia

**Q: Kalau ditolak di SIMPELS, bagaimana?**
A: Status akan berubah menjadi "Rejected" dan Anda bisa mengajukan lagi dengan nominal/periode berbeda

**Q: Bisakah cancel penarikan yang sudah diajukan?**
A: Saat ini belum ada fitur cancel. Hubungi admin SIMPELS jika perlu membatalkan

**Q: Berapa lama proses approval?**
A: Tergantung admin SIMPELS, biasanya < 1 hari kerja

---

## 🆘 Troubleshooting

### Error: "Tidak ada transaksi yang tersedia untuk ditarik"
**Solusi:**
- Pastikan ada transaksi RFID completed
- Check saldo tersedia > 0
- Coba ubah periode tanggal

### Error: "Gagal mengirim request ke SIMPels"
**Solusi:**
1. Check koneksi internet
2. Pastikan SIMPELS backend running
3. Check `.env` setting `SIMPELS_API_URL`
4. Contact IT support

### Status tidak update setelah approval
**Solusi:**
1. Klik button refresh di tabel
2. Reload halaman (F5)
3. Check log: `storage/logs/laravel.log`

---

**Dibuat:** 23 November 2025
