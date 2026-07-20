# SIMPELS Agent Playbook

Dokumen ini adalah panduan utama agent untuk bekerja di proyek SIMPELS tanpa perlu briefing ulang dari user.

## 1) Tujuan Dokumen

- Menjadi onboarding cepat untuk agent baru.
- Menjelaskan arsitektur, lingkungan jalan aplikasi, dan aturan kerja.
- Menjadi standar handover lintas agent agar progres tidak putus.

## 2) Konteks Penting Proyek

- Repository ini terhubung ke deployment Dokploy.
- Push ke branch utama harus dianggap berdampak ke environment production.
- Prioritas utama: perubahan aman, minim risiko down, dan tervalidasi.

## 3) Struktur Monorepo

- Backend: `Backend/` (Laravel API)
- Frontend: `frontend/` (React + Vite + TypeScript)
- Mobile: `mobile/` (Flutter)
- WA Gateway: `wa-gateway/`
- Dokumentasi: `docs/`

## 4) Aplikasi Berjalan di Mana

Setup lokal utama menggunakan Docker Compose di root repo.

Service dan port penting:
- Frontend dev (Vite): `http://localhost:5173`
- Backend via Nginx gateway: `http://localhost:8001`
- Backend API base (untuk frontend): `http://localhost:8001/api`
- Mobile web app container: `http://localhost:8080`
- Redis Commander: `http://localhost:8081`
- MariaDB: `localhost:3306`
- WA Gateway: `http://localhost:3100`

Catatan operasional:
- Frontend lokal sering dijalankan dari container `simpels_frontend`.
- Jika UI terasa tidak update, restart service frontend di Docker lalu reload page.

## 5) Database dan Data

- Engine: MariaDB (container `simpels_db`).
- Nama schema aktif bisa berbeda antar environment.
- Untuk environment yang sedang dipakai tim saat ini, schema operasional yang sering dipakai adalah `simpels_db`.
- Validasi schema aktif sebelum query manual:
  - cek daftar database
  - cek tabel target

## 6) Alur Menjalankan dan Memverifikasi

### Backend
- Jalankan migration saat startup container (sudah di entrypoint backend).
- Untuk perubahan backend:
  - cek route terdaftar
  - cek error/lint minimal
  - cek endpoint dengan sampel data nyata

### Frontend
- Untuk perubahan frontend:
  - jalankan build check
  - verifikasi UI di halaman target
  - jika container dev stale, restart frontend container

### Build checks minimum
- Frontend: `npm run build` di folder `frontend`
- Backend: minimal route check dan endpoint smoke check

## 7) Aturan Kritis Kode dan File

- Jangan revert perubahan user yang tidak diminta.
- Hindari command destruktif git.
- Fokus perubahan minimal, presisi, dan bisa dilacak.

Batas panjang file wajib:
- `frontend/src/*.ts` dan `frontend/src/*.tsx`: maksimal 300 baris
- `mobile/lib/*.dart`: maksimal 400 baris

Jika melebihi batas:
- Wajib ekstrak ke file/komponen/hook terpisah.

## 8) Area Domain Penting SIMPELS

- Santri aktif vs status exit/nonaktif (`mutasi`, `mutasi_keluar`, `keluar`, `alumni`, `lulus`)
- Dompet santri dan histori transaksi
- Tagihan, pembayaran, tunggakan
- Wizard transisi tahun ajaran
- Integrasi WA gateway dan ePOS

Prinsip data:
- Jangan hard-delete data histori keuangan tanpa alasan kuat.
- Untuk dompet exit, prefer nonaktifkan dompet daripada hapus histori transaksi.

## 9) Risiko Operasional yang Harus Diwaspadai

- Query besar tanpa pagination/index dapat memicu latency tinggi dan potensi down.
- Endpoint report/summary perlu cache dan agregasi DB yang efisien.
- Proses berat sinkron (import/export/blast) sebaiknya diarahkan ke queue.

## 10) SOP Wajib Saat Mulai Kerja

1. Baca dokumen ini.
2. Baca tracker progres: `docs/AGENT_PROGRESS_TRACKER.md`.
3. Ambil task dari bagian Next Action/Task Board.
4. Ubah status task ke IN_PROGRESS sebelum coding.

## 11) SOP Wajib Saat Selesai Kerja

Agent WAJIB update `docs/AGENT_PROGRESS_TRACKER.md` setiap selesai task.

Checklist update minimal:
1. Ubah status task (IN_PROGRESS -> DONE/BLOCKED).
2. Tambah ringkasan perubahan.
3. Cantumkan daftar file yang diubah.
4. Cantumkan validasi yang dijalankan dan hasilnya.
5. Update Next Action.
6. Tambah entri Work Log + timestamp.
7. Update bagian Last Updated.

Tanpa update tracker, pekerjaan dianggap belum handover-ready.

## 12) Template Update Cepat (Copy-Paste)

### Entry Work Log
- Tanggal:
- Agent:
- Scope:
- Files changed:
- Validation:
- Result:
- Risks/Follow-up:

### Update Task Board
- Task ID:
- Status:
- Owner:
- Catatan hasil:

## 13) Protokol Handover Antar Agent

Saat agent selesai sesi:
- Pastikan tracker sudah terbarui.
- Pastikan task lanjutan tertulis jelas di Next Action.
- Hindari asumsi implicit; tulis keputusan penting eksplisit.

Saat agent baru masuk:
- Jangan langsung coding sebelum baca tracker + playbook.
- Validasi konteks runtime (docker/service/path) sebelum debugging.

## 14) Referensi Dokumen Wajib Baca

- `docs/AGENT_PROGRESS_TRACKER.md`
- `docker-compose.yml`
- `README.md`
- `Backend/README.md`
- Instruksi agent/coding di `.github/copilot-instructions.md`

## 15) Status Dokumen

Dokumen ini hidup dan wajib diperbarui ketika ada perubahan arsitektur, alur deploy, SOP, atau aturan kerja.

Last Updated: 2026-07-19 21:45 WIB
