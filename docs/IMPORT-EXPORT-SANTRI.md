# Import/Export Data Santri - SIMPELS 2.0

## Overview
Fitur untuk import dan export data santri menggunakan format Excel (.xlsx/.xls) dengan template yang sudah dilengkapi keterangan kolom wajib dan opsional.

---

## 📥 Download Template Excel

### Cara Download:
1. Login ke sistem sebagai Admin
2. Buka menu **Kesantrian** → **Data Santri**
3. Klik tombol **"Download Template"** (ikon biru dengan panah ke bawah)
4. File `template-import-santri.xlsx` akan terdownload otomatis

### Isi Template:
Template Excel sudah dilengkapi dengan:
- **Header Berwarna MERAH** = Kolom **WAJIB** diisi (ditandai dengan tanda *)
- **Header Berwarna ABU-ABU** = Kolom **OPSIONAL**
- **Baris 2**: Contoh format data untuk setiap kolom
- **Baris 3**: Keterangan lengkap tentang kolom wajib dan opsional
- **Baris 4 ke bawah**: Area untuk mengisi data santri

---

## ✅ Kolom yang WAJIB Diisi

Berikut kolom yang **HARUS** diisi (ditandai dengan tanda * dan background merah):

| Kolom | Keterangan | Format/Contoh |
|-------|------------|---------------|
| **NIS** * | Nomor Induk Santri (UNIK) | `2024001` |
| **Nama Santri** * | Nama lengkap santri | `Ahmad Fauzi` |
| **Jenis Kelamin** * | Jenis kelamin | `L` atau `P` (bisa juga `Laki-laki`/`Perempuan`) |
| **Tempat Lahir** * | Tempat lahir santri | `Jakarta` |
| **Tanggal Lahir** * | Tanggal lahir | `2010-05-15` (format: YYYY-MM-DD) |
| **Alamat** * | Alamat lengkap | `Jl. Raya No. 123, RT 01/RW 05` |
| **Nama Ayah** * | Nama lengkap ayah | `Budi Santoso` |
| **Nama Ibu** * | Nama lengkap ibu | `Siti Nurhaliza` |

**⚠️ PENTING:**
- Kolom dengan tanda * WAJIB diisi, sistem akan menolak data jika kosong
- NIS harus UNIK (tidak boleh sama dengan santri lain)
- Jenis Kelamin: gunakan `L` untuk Laki-laki atau `P` untuk Perempuan
- Tanggal Lahir: gunakan format YYYY-MM-DD (contoh: 2010-05-15)

---

## 📋 Kolom yang OPSIONAL (Boleh Dikosongkan)

| Kolom | Keterangan | Format/Contoh |
|-------|------------|---------------|
| NISN | Nomor Induk Siswa Nasional | `1234567890` |
| NIK Santri | Nomor Induk Kependudukan | `3201012345678901` |
| Provinsi | Provinsi tempat tinggal | `DKI Jakarta` |
| Kabupaten | Kabupaten/Kota | `Jakarta Selatan` |
| Kecamatan | Kecamatan | `Kebayoran Baru` |
| Desa | Kelurahan/Desa | `Melawai` |
| Kode Pos | Kode pos wilayah | `12130` |
| Kelas | Nama kelas santri | `7A` |
| Asrama | Nama asrama (jika ada) | `Asrama Putra 1` |
| Asal Sekolah | Sekolah sebelumnya | `SDN 01 Jakarta` |
| Hobi | Hobi santri | `Membaca, Olahraga` |
| Cita-cita | Cita-cita santri | `Dokter` |
| Jumlah Saudara | Jumlah saudara kandung | `3` (angka) |
| No KK | Nomor Kartu Keluarga | `3201011234567890` |
| NIK Ayah | NIK ayah | `3201011234567891` |
| Pendidikan Ayah | Pendidikan terakhir ayah | `S1` |
| Pekerjaan Ayah | Pekerjaan ayah | `Wiraswasta` |
| HP Ayah | Nomor HP ayah | `081234567890` |
| NIK Ibu | NIK ibu | `3201011234567892` |
| Pendidikan Ibu | Pendidikan terakhir ibu | `SMA` |
| Pekerjaan Ibu | Pekerjaan ibu | `Ibu Rumah Tangga` |
| HP Ibu | Nomor HP ibu | `081234567891` |

---

## 📤 Cara Import Data Santri

### Langkah-langkah:

1. **Download dan Isi Template**
   - Download template Excel dari sistem
   - Isi data santri mulai dari baris ke-4
   - Pastikan kolom wajib terisi semua
   - Simpan file Excel

2. **Upload dan Validasi File**
   - Klik tombol **"Import Excel"** di halaman Data Santri
   - Pilih file Excel yang sudah diisi (.xlsx atau .xls)
   - Sistem akan **otomatis menganalisis dan memvalidasi** file
   - Modal preview akan muncul menampilkan hasil validasi

3. **Review Hasil Validasi**
   
   Modal validasi menampilkan:
   
   **📊 Ringkasan:**
   - 🟢 **Data Valid**: Jumlah baris yang siap diimport
   - 🔴 **Data Error**: Jumlah baris yang bermasalah (WAJIB diperbaiki)
   - 🟡 **Peringatan**: Warning untuk data opsional yang kosong
   
   **❌ Daftar Error (Jika Ada):**
   - Menampilkan baris mana yang error
   - Detail error apa saja (NIS kosong, format tanggal salah, dll)
   - **TIDAK BISA** import jika ada error
   
   **⚠️ Daftar Warning:**
   - Data opsional yang kosong (NISN, HP, dll)
   - NIS yang sudah terdaftar (akan diupdate)
   - TETAP BISA import meski ada warning
   
   **✅ Preview Data Valid:**
   - Menampilkan 10 data pertama yang valid
   - Untuk memastikan data sudah benar

4. **Perbaiki Error (Jika Ada)**
   
   Jika ada error:
   - Klik tombol **"Batal"**
   - Buka file Excel
   - Perbaiki baris yang bermasalah sesuai keterangan error
   - Simpan dan upload ulang
   
   Contoh error yang sering terjadi:
   - ❌ "NIS tidak boleh kosong" → Isi kolom NIS
   - ❌ "Format Tanggal Lahir tidak valid" → Gunakan format YYYY-MM-DD
   - ❌ "Jenis Kelamin harus L/P" → Isi dengan L atau P
   - ❌ "NIS duplikat dengan baris X" → Setiap NIS harus unik

5. **Konfirmasi Import**
   
   Jika semua data valid:
   - Tombol **"Import X Data"** akan aktif (warna biru)
   - Klik tombol tersebut untuk konfirmasi
   - Sistem akan mengimport data ke database
   - Progress akan ditampilkan
   - Selesai! Data langsung muncul di tabel

6. **Hasil Import**
   Sistem akan:
   - ✅ Membaca data dari file Excel
   - ✅ Validasi setiap baris data
   - ✅ **Membuat data baru** jika NIS belum terdaftar
   - ✅ **Update data existing** jika NIS sudah ada
   - ✅ Menampilkan notifikasi hasil import

### Contoh Notifikasi:
- ✅ **Sukses Validasi**: "File valid: 50 data siap diimport"
- ⚠️ **Ada Warning**: "Ditemukan 5 baris dengan peringatan (tetap bisa diimport)"
- ❌ **Ada Error**: "Ditemukan 3 baris dengan error (perbaiki dulu sebelum import)"
- ✅ **Sukses Import**: "Berhasil import 50 data baru dan update 10 data"
- ❌ **Error File**: "File harus berformat Excel (.xlsx atau .xls)"

---

## 🔍 Fitur Validasi & Preview Import

### Validasi Otomatis

Setiap kali Anda upload file Excel, sistem akan **otomatis menganalisis** file dan menampilkan:

1. **Analisis Data**
   - Total baris yang akan diproses
   - Jumlah data yang valid
   - Jumlah data yang error
   - Jumlah warning/peringatan

2. **Deteksi Error**
   
   Sistem mengecek:
   - ✓ Kolom wajib terisi semua
   - ✓ Format tanggal benar (YYYY-MM-DD)
   - ✓ Jenis kelamin valid (L/P)
   - ✓ NIS tidak duplikat dalam file
   - ✓ Format data sesuai
   
3. **Deteksi Warning**
   
   Sistem memberi peringatan jika:
   - ⚠️ NISN kosong (opsional)
   - ⚠️ HP Ayah dan HP Ibu kosong (disarankan diisi)
   - ⚠️ NIS sudah terdaftar (akan diupdate)
   - ⚠️ Data opsional lainnya kosong

4. **Preview Data**
   - Menampilkan 10 data valid pertama
   - Untuk memastikan format sudah benar
   - Cek nama, NIS, jenis kelamin, dll

### Keuntungan Fitur Validasi:

✅ **Mencegah Error**: Deteksi masalah sebelum import
✅ **Hemat Waktu**: Tidak perlu upload berulang kali
✅ **Lebih Aman**: Tahu persis data apa yang akan masuk
✅ **Transparan**: Lihat semua error dan warning sebelum confirm
✅ **User Friendly**: Modal yang jelas dan mudah dipahami

---

## 📥 Cara Export Data Santri

### Langkah-langkah:

1. Buka halaman **Kesantrian** → **Data Santri**
2. Klik tombol **"Export Excel"**
3. File akan terdownload dengan nama: `data-santri-YYYY-MM-DD-HHMMSS.xlsx`
4. Buka file Excel untuk melihat semua data santri

### Isi File Export:
File Excel hasil export berisi:
- Header dengan background biru
- Semua data santri yang ada di database
- Kolom: NIS, NISN, NIK, Nama, Jenis Kelamin, dll (30 kolom)
- Format Excel yang rapi dan siap diedit

### Kegunaan Export:
- 📊 Backup data santri
- 📝 Edit data massal di Excel lalu import kembali
- 📈 Analisis data menggunakan Excel
- 🖨️ Print data santri

---

## 🔄 Update Data Existing

Jika Anda ingin **update data santri yang sudah ada**:

1. Export data santri yang ada
2. Edit data di file Excel hasil export
3. **JANGAN ubah kolom NIS** (NIS digunakan sebagai identifier)
4. Edit kolom lain yang ingin diupdate
5. Import file Excel yang sudah diedit
6. Sistem akan otomatis update data berdasarkan NIS

**Contoh:**
- Ada santri dengan NIS `2024001` bernama "Ahmad"
- Export data, edit nama menjadi "Ahmad Fauzi"
- Import kembali → Data santri NIS `2024001` akan terupdate

---

## ❗ Troubleshooting

### Problem: "File tidak valid"
**Solusi:**
- Pastikan file berformat .xlsx atau .xls
- Jangan hapus baris header (baris 1-3 di template)
- Pastikan struktur kolom tidak berubah

### Problem: "NIS tidak boleh kosong"
**Solusi:**
- Isi kolom NIS di setiap baris data
- NIS tidak boleh kosong atau berisi spasi saja

### Problem: "Baris X: Error validasi"
**Solusi:**
- Cek data di baris tersebut
- Pastikan format tanggal benar (YYYY-MM-DD)
- Pastikan jenis kelamin diisi L atau P
- Pastikan kolom wajib tidak kosong

### Problem: "Import selesai tapi data tidak muncul"
**Solusi:**
- Refresh halaman (tekan F5)
- Cek di search bar apakah data sudah masuk
- Cek notifikasi: berapa data yang berhasil diimport

---

## 📝 Tips & Best Practices

1. **Gunakan Template**: Selalu mulai dari template yang disediakan sistem
2. **Backup Data**: Export data existing sebelum import data baru
3. **Test dengan Data Kecil**: Import 1-2 data dulu untuk test
4. **Format Tanggal**: Gunakan format YYYY-MM-DD (2010-05-15)
5. **NIS Unik**: Pastikan setiap santri punya NIS yang berbeda
6. **Jenis Kelamin**: Gunakan L/P atau Laki-laki/Perempuan
7. **Nomor HP**: Format bebas (sistem akan normalisasi otomatis)
8. **Data Kosong**: Kolom opsional boleh dikosongkan
9. **Update Data**: Gunakan NIS yang sama untuk update data existing
10. **Cek Error**: Perhatikan notifikasi setelah import untuk deteksi error

---

## 🎯 Contoh Penggunaan

### Skenario 1: Import Data Santri Baru (Awal Tahun Ajaran)
```
1. Download template
2. Isi data 100 santri baru di Excel
3. Import file Excel
4. Hasil: "Berhasil import 100 data baru"
```

### Skenario 2: Update Data Santri Existing
```
1. Export data santri existing
2. Edit data yang perlu diupdate (misal: nomor HP orang tua)
3. Import file Excel yang sudah diedit
4. Hasil: "Berhasil update 50 data"
```

### Skenario 3: Import Campuran (Baru + Update)
```
1. Export data existing (misal: 200 santri)
2. Edit beberapa data + tambah 50 santri baru
3. Import file Excel
4. Hasil: "Berhasil import 50 data baru dan update 200 data"
```

---

## 📞 Bantuan

Jika mengalami kesulitan:
1. Pastikan mengikuti format template
2. Cek kolom wajib sudah terisi semua
3. Perhatikan notifikasi error untuk tahu baris mana yang bermasalah
4. Export data existing sebagai referensi format yang benar

---

**Last Updated:** December 1, 2025
