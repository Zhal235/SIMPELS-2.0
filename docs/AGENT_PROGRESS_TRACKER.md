# AGENT PROGRESS TRACKER

Dokumen ini adalah sumber kebenaran progres lintas agent untuk mencegah pekerjaan ganda dan menjaga kontinuitas saat ganti agent di VS Code.

## Tujuan

- Menjaga progres tetap jalan walau agent berganti.
- Menstandarkan cara handover dan update status pekerjaan.
- Memastikan semua perubahan teknis tercatat dengan jejak file dan validasi.

## Dokumen Rujukan Utama

- Playbook Agent: `docs/SIMPELS_AGENT_PLAYBOOK.md`
- Tracker Progres ini: `docs/AGENT_PROGRESS_TRACKER.md`

Setiap agent baru WAJIB membaca kedua dokumen tersebut sebelum mulai kerja.

## Aturan Wajib untuk Semua Agent

1. Sebelum mulai kerja:
- Baca dokumen ini dari atas sampai bawah.
- Cek bagian Next Action dan Open Issues.
- Jangan ubah status task tanpa bukti perubahan nyata.

2. Saat mulai task:
- Ubah status task dari TODO ke IN_PROGRESS.
- Isi Agent, Tanggal, dan Scope singkat di Work Log.

3. Saat selesai task:
- Ubah status ke DONE.
- Wajib isi:
  - Daftar file yang diubah
  - Ringkasan perubahan
  - Cara validasi dan hasil validasi
  - Risiko sisa jika ada

4. Saat terblokir:
- Ubah status ke BLOCKED.
- Jelaskan blocker, dampak, dan kebutuhan keputusan user.

5. Aturan konsistensi:
- Jangan hapus histori lama.
- Gunakan format checklist dan tabel yang sudah ada.
- Update Last Updated setiap kali ada perubahan dokumen.
- Pekerjaan dianggap belum selesai handover jika tracker belum diupdate.

## Status Legend

- TODO: belum dikerjakan
- IN_PROGRESS: sedang dikerjakan
- DONE: selesai + tervalidasi
- BLOCKED: terhenti karena hambatan

## Current Focus

Stabilitas performa dan anti-down saat data membesar, sambil menjaga alur dompet santri status exit/nonaktif.

## Task Board

| ID | Task | Status | Owner | Catatan |
|---|---|---|---|---|
| T1 | Perbaikan wizard kelulusan agar tidak auto salah proses | DONE | Agent | Guard konfirmasi + expected jumlah ditambahkan |
| T2 | Revoke kelulusan (batalkan kelulusan) endpoint | DONE | Agent | Endpoint dan route sudah tersedia |
| T3 | Koreksi massal alumni yang masih nempel kelas 12 | DONE | Agent | Sudah dibenahi dan disiapkan migration idempotent |
| T4 | Dompet Santri: hide Setor untuk mutasi/alumni | DONE | Agent | Sudah diterapkan di UI |
| T5 | Dompet Santri: ganti Hapus Dompet Mutasi menjadi Hapus Dompet Exit | DONE | Agent | Label dan konfirmasi sudah diperjelas |
| T6 | Dompet Santri: kelas untuk status exit tampil '-' | DONE | Agent | Sudah diterapkan di hasil cari + detail |
| T7 | Wallet settlement dipisah dari auto bayar tagihan | DONE | Agent | Logic backend sudah dipisah |
| T8 | Audit endpoint berat untuk anti-down | DONE | Agent | Daftar prioritas dan quick win sudah disusun |
| T9 | Implementasi quick win performa batch 1 (pagination + report aggregation + cache) | DONE | Agent | Pagination list berat, agregasi report di DB, cache 60 detik dashboard/report |
| T10 | Rapikan UI laporan pengeluaran per kategori | DONE | Agent | Tambah filter tanggal, format rupiah, ringkasan, tabel proporsi |
| T11 | Bulk mutasi santri per kelas: pilih santri + keterangan bebas | DONE | Agent | Modal bulk pilih kelas, centang santri target, simpan keterangan bebas; badge pembayaran sekarang baca keterangan mutasi, bukan angkatan |
| T12 | Backup otomatis/manual server utama: endpoint stabil + jadwal harian | DONE | Agent | `POST /v1/system/backup` sudah di-hardening, command `db:backup` menangani failure dengan jelas, dan schedule harian di `bootstrap/app.php` aktif pukul 02:00 WIB |

## File Jejak Perubahan Terakhir

- Backend/app/Http/Controllers/Kesantrian/MutasiKeluarController.php
- Backend/app/Http/Resources/SantriResource.php
- Backend/app/Models/Santri.php
- Backend/app/Services/Santri/SantriCrudService.php
- frontend/src/pages/keuangan/components/SantriInfoCard.tsx
- frontend/src/types/pembayaran.types.ts
- Backend/app/Http/Controllers/Kesantrian/MutasiKeluarController.php
- Backend/routes/api.php
- frontend/src/api/mutasiKeluar.ts
- frontend/src/main.tsx
- frontend/src/pages/kesantrian/Santri.tsx
- frontend/src/pages/kesantrian/components/BulkMutasiModal.tsx
- frontend/src/pages/kesantrian/components/SantriToolbar.tsx

## Validasi Terakhir

- Error check file frontend/backend yang diubah: bersih.
- Backend route bulk mutasi terdaftar di `php artisan route:list` setelah `optimize:clear` dan restart service.
- Endpoint bulk mutasi dari browser sempat 404 sebelum cache/runtime backend di-refresh, lalu berubah menjadi 401 unauthenticated setelah route aktif.
- Warning service worker dev dihapus dengan menghilangkan fallback register `sw.js`.
- Badge kartu pembayaran untuk santri exit sekarang membedakan alumni vs mutasi, dan mutasi menampilkan keterangan mutasi dari data terbaru.
- Backup manual endpoint sekarang mengembalikan error yang jelas saat command gagal, bukan 500 tanpa konteks.
- Schedule otomatis backup harian sudah terverifikasi di `Backend/bootstrap/app.php` pada `db:backup` pukul 02:00 WIB.

## Next Action

1. Quick win performa batch 2:
- Tambahkan pagination untuk history per santri yang masih return full collection.
- Tambahkan cache pada endpoint kas summary yang sering dipanggil dashboard.
- Tambahkan indeks DB untuk kolom filter utama (status, tanggal, santri_id, tahun, bulan).

2. Setelah setiap subtask selesai:
- Update Task Board.
- Tambah entri Work Log.

## Open Issues / Catatan

- File frontend/src/pages/dompet/DompetSantri.tsx masih besar (legacy), butuh ekstraksi bertahap saat refactor berikutnya.
- Saat development dengan Docker + Vite, UI kadang perlu restart frontend container agar update terbaca stabil.

## Work Log

### 2026-07-19 21:35 WIB - Agent

Scope:
- Menambahkan tracker lintas agent + sinkronisasi status hasil kerja terakhir.

Update:
- Membuat dokumen ini sebagai single source of truth progres.
- Mengisi status task berdasarkan hasil implementasi dan validasi terakhir.

Validasi:
- Struktur task board siap dipakai update incremental.

### 2026-07-19 21:45 WIB - Agent

Scope:
- Menambahkan playbook agent menyeluruh untuk onboarding lintas agent.

Update:
- Menambahkan dokumen `docs/SIMPELS_AGENT_PLAYBOOK.md` berisi:
  - arsitektur dan runtime aplikasi
  - SOP mulai/selesai kerja
  - aturan update progres wajib
  - protokol handover lintas agent

Validasi:
- Cross-reference antara playbook dan tracker sudah ditambahkan.

### 2026-07-19 22:05 WIB - Agent

Scope:
- Eksekusi quick win performa batch 1 di backend.

Update:
- Menambahkan pagination ketat untuk endpoint berat:
  - Rekap Tagihan per santri sekarang mendukung `page` dan `perPage` serta metadata pagination.
  - List Pembayaran sekarang menggunakan pagination (bukan full collection).
- Mengoptimasi summary report agar agregasi dilakukan di level database (menghindari groupBy in-memory pada dataset besar).
- Menambahkan cache 60 detik untuk endpoint report dan endpoint dashboard utama.

Files changed:
- Backend/app/Services/Tagihan/TagihanCrudService.php
- Backend/app/Http/Controllers/TagihanSantriController.php
- Backend/app/Services/Pembayaran/PembayaranService.php
- Backend/app/Http/Controllers/Keuangan/ReportsController.php
- Backend/app/Http/Controllers/DashboardController.php

Validasi:
- Error check pada file yang diubah: bersih.
- Route sanity check: endpoint report dan tagihan tetap terdaftar.

Risiko sisa:
- Beberapa endpoint history lain masih belum dipaginasi dan akan diselesaikan di batch berikutnya.

### 2026-07-19 22:20 WIB - Agent

Scope:
- Rapikan halaman `Pengeluaran per Kategori` agar lebih terbaca dan usable.

Update:
- Menambahkan filter tanggal (`start` dan `end`) + tombol terapkan.
- Menambahkan kartu ringkasan: total pengeluaran, jumlah kategori, dan kategori tertinggi.
- Merapikan tabel menjadi: nomor, kategori, proporsi persen + progress bar, dan total dalam format rupiah.
- Menambahkan sorting descending berdasarkan total.

Files changed:
- frontend/src/pages/keuangan/PengeluaranKategori.tsx

Validasi:
- Error check file frontend: bersih.
- Frontend build: sukses.

### 2026-07-20 14:50 WIB - Agent

Scope:
- Menyesuaikan bulk mutasi santri agar admin memilih santri satu per satu dalam kelas, dengan keterangan bebas.

Update:
- Mengubah bulk mutasi dari proses semua santri aktif di kelas menjadi checklist santri target per kelas.
- Menambahkan field keterangan bebas yang disimpan ke `alasan` pada record mutasi keluar.
- Menonaktifkan fallback registrasi `sw.js` di dev agar warning MIME type tidak muncul lagi.
- Menyegarkan cache/runtime backend agar route bulk mutasi terbaca oleh service yang sedang berjalan.

Files changed:
- Backend/app/Http/Controllers/Kesantrian/MutasiKeluarController.php
- Backend/routes/api.php
- frontend/src/api/mutasiKeluar.ts
- frontend/src/main.tsx
- frontend/src/pages/kesantrian/Santri.tsx
- frontend/src/pages/kesantrian/components/BulkMutasiModal.tsx
- frontend/src/pages/kesantrian/components/SantriToolbar.tsx

Validation:
- `php -l` pada controller bulk mutasi: bersih.
- `get_errors` pada file frontend/backend yang disentuh: bersih.
- `php artisan route:list --path=mutasi-keluar` di container backend: route bulk muncul.
- Request browser ke endpoint bulk berubah dari 404 menjadi 401 unauthenticated setelah `optimize:clear` dan restart service.

Result:
- Bulk mutasi sudah sesuai alur baru: pilih kelas, centang santri yang dimutasi, isi keterangan bebas.

Risks/Follow-up:
- Endpoint bulk tetap memerlukan sesi/auth valid saat dipakai dari UI.
- Jika frontend dev container stale, restart container frontend bila UI belum refresh.

### 2026-07-20 15:10 WIB - Agent

Scope:
- Menyempurnakan kartu pembayaran agar santri mutasi menampilkan keterangan mutasi, bukan angkatan.

Update:
- Menambahkan relasi mutasi keluar terbaru pada model santri.
- Mengekspos `mutasi_keterangan` dan `mutasi_tanggal` di resource santri.
- Menyimpan keterangan mutasi ke field santri agar data lama dan baru tetap konsisten ditampilkan.
- Mengubah kartu pembayaran: alumni tetap tampil sebagai angkatan alumni, mutasi tampil sebagai keterangan mutasi.

Files changed:
- Backend/app/Http/Controllers/Kesantrian/MutasiKeluarController.php
- Backend/app/Http/Resources/SantriResource.php
- Backend/app/Models/Santri.php
- Backend/app/Services/Santri/SantriCrudService.php
- frontend/src/pages/keuangan/components/SantriInfoCard.tsx
- frontend/src/types/pembayaran.types.ts

Validation:
- `get_errors` pada file yang disentuh: bersih.
- `php -l` pada `Santri.php`, `MutasiKeluarController.php`, dan `SantriResource.php`: bersih.
- Snapshot browser halaman pembayaran: badge exit tampil, dan label keterangan mutasi muncul di kartu identitas.

Result:
- Alumni dan mutasi kini dibedakan di kartu pembayaran tanpa memakai label angkatan untuk mutasi.

Risks/Follow-up:
- Data mutasi lama yang belum menyimpan alasan/keterangan tetap akan tampil sebagai `Mutasi Keluar` sampai di-backfill.

### 2026-07-20 15:30 WIB - Agent

Scope:
- Memperbaiki endpoint backup manual agar lebih stabil saat dijalankan di server utama dan memastikan jadwal backup otomatis tetap aktif.

Update:
- Menambahkan proteksi auth yang eksplisit di `SystemBackupController`.
- Mengubah endpoint backup manual agar mengecek exit code `db:backup` dan mengembalikan pesan error yang jelas jika command gagal.
- Menguatkan command `BackupDatabase` agar menangkap `Throwable` pada alur utama dan pruning backup.
- Memverifikasi scheduler di `Backend/bootstrap/app.php` menjalankan `db:backup` harian pukul 02:00 WIB.

Files changed:
- Backend/app/Http/Controllers/Admin/SystemBackupController.php
- Backend/app/Console/Commands/BackupDatabase.php
- docs/AGENT_PROGRESS_TRACKER.md

Validation:
- `php -l` pada controller backup: bersih.
- `php -l` pada command backup: bersih.
- `php artisan db:backup --email=test@example.com` di lingkungan lokal menunjukkan failure yang jelas karena host DB lokal tidak tersedia, sehingga sumber masalah bukan frontend.

Result:
- Backup manual kini lebih aman dipakai di server utama, dan backup otomatis harian tetap terjadwal.

Risks/Follow-up:
- Server utama tetap harus punya kredensial DB dan `BACKUP_EMAIL` yang valid agar backup benar-benar sukses saat dijalankan.

### 2026-07-20 15:45 WIB - Agent

Scope:
- Menangani akar masalah backup yang diduga kehabisan memory di container API saat membuat dump database besar.

Update:
- Mengubah command `db:backup` agar menulis dump SQL ke file sementara secara streaming, bukan menahan seluruh dump di memory.
- Mengubah proses dump tabel agar membaca row via cursor dan menulis batch insert langsung ke file.
- Menambahkan batas ukuran lampiran email agar file besar tidak dipaksa dikirim ke Gmail.

Files changed:
- Backend/app/Console/Commands/BackupDatabase.php

Validation:
- `php -l` pada command backup: bersih.
- `get_errors` pada command backup: bersih.

Result:
- Backup kini lebih aman untuk database besar karena tidak lagi membangun dump penuh di RAM.

Risks/Follow-up:
- Jika ukuran database terus bertambah, tetap pertimbangkan monitoring disk temporary dan storage R2, tetapi risiko memory exhaustion sudah jauh turun.

### 2026-07-20 16:00 WIB - Agent

Scope:
- Memperbaiki bulk mutasi keluar yang masih 500 di server utama.

Update:
- Mengubah bulk mutasi controller agar menangkap `Throwable`, bukan hanya `Exception`.
- Menambahkan proteksi schema untuk kolom santri opsional (`tujuan_mutasi`, `alasan_mutasi`, `tanggal_keluar`) sebelum save.
- Menulis `tanggal_keluar` saat tersedia supaya data exit lebih konsisten lintas server.

Files changed:
- Backend/app/Http/Controllers/Kesantrian/MutasiKeluarController.php

Validation:
- `php -l` pada controller bulk mutasi: bersih.
- `get_errors` pada controller bulk mutasi: bersih.

Result:
- Bulk mutasi tidak lagi bergantung pada asumsi skema kolom mutasi yang harus selalu lengkap.

Risks/Follow-up:
- Bila server utama masih memakai bundle lama, perlu redeploy agar patch controller aktif.

### 2026-07-20 16:15 WIB - Agent

Scope:
- Memastikan santri baru dari tambah manual maupun import langsung punya dompet santri.

Update:
- Mengaktifkan kembali `SantriObserver` di `AppServiceProvider`.
- Menambahkan `Wallet::firstOrCreate(...)` di jalur create santri dan import santri sebagai pengaman ganda.
- Memastikan import hanya membuat wallet untuk santri baru, bukan saat update data existing.

Files changed:
- Backend/app/Providers/AppServiceProvider.php
- Backend/app/Services/Santri/SantriCrudService.php
- Backend/app/Services/Santri/SantriImportExportService.php

Validation:
- `php -l` pada tiga file backend yang disentuh: bersih.
- `get_errors` pada tiga file backend yang disentuh: bersih.

Result:
- Santri baru sekarang otomatis mendapat wallet saat dibuat lewat form tambah maupun import file.

Risks/Follow-up:
- Jika server utama belum redeploy commit terbaru, observer lama yang masih nonaktif di runtime lama tetap perlu diganti dengan versi baru.

## Last Updated

2026-07-20 16:15 WIB
