# Sistem Pengumuman untuk Aplikasi PWA SIMPELS

## Overview

Sistem pengumuman telah berhasil diimplementasikan untuk mengirimkan pengumuman dari pondok kepada wali santri melalui aplikasi PWA. Sistem ini menggunakan **polling mechanism** yang mengecek pengumuman baru setiap 60 detik.

## Fitur

### Backend (Laravel)

1. **Database Tables:**
   - `announcements` - Menyimpan data pengumuman
   - `announcement_reads` - Tracking pengumuman yang sudah dibaca user

2. **Models:**
   - `Announcement` - Model untuk pengumuman
   - `AnnouncementRead` - Model untuk tracking pembacaan

3. **API Endpoints:**

   **Untuk Wali Santri (PWA):**
   - `GET /api/wali/announcements` - Ambil daftar pengumuman
     - Query params: `unread_only=true`, `limit=50`
   - `GET /api/wali/announcements/unread-count` - Ambil jumlah unread
   - `GET /api/wali/announcements/{id}` - Detail pengumuman
   - `POST /api/wali/announcements/{id}/mark-read` - Tandai sebagai dibaca

   **Untuk Admin:**
   - `POST /api/v1/announcements` - Buat pengumuman baru
   - `PUT /api/v1/announcements/{id}` - Update pengumuman
   - `DELETE /api/v1/announcements/{id}` - Hapus pengumuman
   - `GET /api/v1/announcements/options/kelas` - Ambil list kelas
   - `GET /api/v1/announcements/options/santri` - Ambil list santri

4. **Fitur Filter Target:**
   - **Semua Wali Santri**: `target_type = 'all'`
   - **Per Kelas**: `target_type = 'class'` + array `target_ids` berisi kelas ID
   - **Per Santri**: `target_type = 'santri'` + array `target_ids` berisi santri ID

5. **Prioritas Pengumuman:**
   - `normal` - Pengumuman biasa
   - `important` - Pengumuman penting
   - `urgent` - Pengumuman mendesak

6. **Push Notification Flag:**
   - Field `push_notification` (boolean) untuk menentukan apakah perlu dikirim sebagai push notification
   - Saat ini masih placeholder, implementasi push notification bisa ditambahkan nanti

### Frontend (PWA - React + TypeScript)

1. **API Client:**
   - File: `frontend/src/api/announcements.ts`
   - Berisi semua function untuk komunikasi dengan backend

2. **Polling Service:**
   - File: `frontend/src/utils/useAnnouncementPolling.ts`
   - Custom hook yang otomatis polling unread count setiap 60 detik
   - Usage: `const { unreadCount, refresh } = useAnnouncementPolling(60000)`

3. **Komponen Badge Notifikasi:**
   - File: `frontend/src/components/AnnouncementBadge.tsx`
   - Ditampilkan di Topbar
   - Menampilkan badge merah dengan angka unread count
   - Modal untuk menampilkan list dan detail pengumuman
   - Auto mark as read saat pengumuman dibuka

4. **Halaman Admin:**
   - File: `frontend/src/pages/Pengumuman.tsx`
   - Route: `/pengumuman`
   - Fitur:
     - Create pengumuman baru
     - Edit pengumuman existing
     - Delete pengumuman
     - Filter target: Semua / Per Kelas / Per Santri
     - Set prioritas
     - Toggle push notification

5. **UI Features:**
   - Badge icon di topbar dengan counter
   - Modal split view: list di kiri, detail di kanan
   - Badge biru untuk unread
   - Icon priority (🔴 urgent, 🟠 important, 🔵 normal)
   - Auto refresh setelah mark as read

## Cara Penggunaan

### Untuk Admin (Membuat Pengumuman):

1. Login ke aplikasi PWA sebagai admin
2. Klik menu **Pengumuman** di sidebar kiri
3. Klik tombol **+ Buat Pengumuman**
4. Isi form:
   - Judul Pengumuman
   - Isi Pengumuman
   - Pilih Prioritas (Normal/Penting/Mendesak)
   - Pilih Target:
     - **Semua Wali Santri**: Kirim ke semua
     - **Kelas Tertentu**: Pilih kelas yang diinginkan (bisa multiple)
     - **Santri Tertentu**: Pilih santri yang diinginkan (bisa multiple)
   - (Optional) Centang "Kirim sebagai Push Notification"
5. Klik **Simpan**

### Untuk Wali Santri (Melihat Pengumuman):

1. Login ke aplikasi PWA
2. Badge pengumuman akan muncul di topbar dengan angka unread
3. Klik icon megaphone 📢 di topbar
4. Modal akan muncul menampilkan list pengumuman
5. Klik salah satu pengumuman untuk melihat detail
6. Pengumuman otomatis ditandai sebagai sudah dibaca

## Struktur Database

### Table: announcements

| Column | Type | Description |
|--------|------|-------------|
| id | bigint (PK) | Primary key |
| title | varchar(255) | Judul pengumuman |
| content | text | Isi pengumuman |
| priority | enum | normal, important, urgent |
| target_type | enum | all, class, santri |
| target_ids | json | Array of kelas_id atau santri_id |
| push_notification | boolean | Flag untuk push notification |
| created_by | bigint (FK) | User ID yang membuat |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diupdate |

### Table: announcement_reads

| Column | Type | Description |
|--------|------|-------------|
| id | bigint (PK) | Primary key |
| announcement_id | bigint (FK) | Foreign key ke announcements |
| user_id | bigint (FK) | Foreign key ke users |
| read_at | timestamp | Waktu dibaca |
| created_at | timestamp | - |
| updated_at | timestamp | - |

**Unique Constraint:** (`announcement_id`, `user_id`) - Satu user hanya bisa membaca satu announcement sekali

## Mobile Flutter Implementation

### Files Created:

1. **Model:**
   - `mobile/lib/models/announcement.dart` - Model dengan fromJson/toJson

2. **Service:**
   - `mobile/lib/services/announcement_service.dart` - API calls untuk announcements

3. **Screen:**
   - `mobile/lib/screens/announcements_screen.dart` - List dan detail pengumuman dengan 2 tabs (Semua & Belum Dibaca)

4. **Widget:**
   - `mobile/lib/widgets/announcement_badge.dart` - Badge dengan counter dan polling

### Features:

✅ **Badge Notification:**
- Icon megaphone (📢) di app bar
- Badge merah dengan counter unread
- Auto-polling setiap 60 detik
- Terletak di HomeScreen dan UnifiedPaymentScreen

✅ **Announcements Screen:**
- Tab "Semua" - Menampilkan semua pengumuman
- Tab "Belum Dibaca" - Filter hanya yang belum dibaca
- Badge counter di setiap tab
- Pull-to-refresh untuk reload data
- Card berbeda untuk read/unread (border biru untuk unread)

✅ **Detail Modal:**
- Bottom sheet draggable
- Icon priority (🔴 🟠 🔵)
- Chip untuk priority label
- Tanggal dan pembuat pengumuman
- Auto mark as read saat dibuka
- Full content display

### UI/UX:

- Unread announcement: Border biru tebal + background biru muda
- Read announcement: Border abu-abu tipis + background putih
- Priority icons: Urgent (🔴), Important (🟠), Normal (🔵)
- Responsive card design
- Smooth navigation dengan material transitions

### Integration Points:

1. HomeScreen: Badge di app bar (sebelah notification bell)
2. UnifiedPaymentScreen: Badge di app bar
3. Navigation: MaterialPageRoute ke AnnouncementsScreen

### API Endpoints Used:

- `GET /api/wali/announcements` - List pengumuman
- `GET /api/wali/announcements/unread-count` - Counter badge
- `GET /api/wali/announcements/{id}` - Detail (tidak dipakai langsung)
- `POST /api/wali/announcements/{id}/mark-read` - Mark as read

## Future Enhancements

1. **Web Push Notifications:**
   - Implementasi service worker
   - VAPID keys setup
   - Subscribe mechanism
   - Background notification saat browser ditutup

2. **Rich Text Editor:**
   - Tambahkan editor seperti TinyMCE atau CKEditor
   - Support format text, gambar, link

3. **Scheduled Announcements:**
   - Field `publish_at` untuk schedule pengumuman
   - Cron job untuk auto-publish

4. **Analytics:**
   - Track berapa banyak yang sudah baca
   - Percentage read per pengumuman
   - Dashboard analytics

5. **Attachments:**
   - Support upload file/gambar
   - Download attachment

6. **Search & Filter:**
   - Search pengumuman by title/content
   - Filter by priority, date range, target

## Testing

### Test Backend API:

```bash
# Test get announcements (perlu login token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:801/api/wali/announcements

# Test unread count
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:801/api/wali/announcements/unread-count

# Test create announcement (admin only)
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Pengumuman",
    "content": "Ini adalah pengumuman test",
    "priority": "normal",
    "target_type": "all",
    "push_notification": false
  }' \
  http://localhost:801/api/v1/announcements
```

### Test Frontend:

1. Jalankan frontend: `cd frontend && npm run dev`
2. Login sebagai admin
3. Buka halaman Pengumuman
4. Buat pengumuman test
5. Logout dan login sebagai wali santri
6. Cek badge di topbar
7. Klik badge dan verifikasi pengumuman muncul

## Migration Guide

Jika database sudah ada, jalankan migration:

```bash
cd Backend
php artisan migrate
```

Migration akan membuat 2 tabel baru:
- `announcements`
- `announcement_reads`

## Rollback

Jika perlu rollback:

```bash
cd Backend
php artisan migrate:rollback --step=2
```

---

## Quick Start Guide

### 1. Backend (Laravel)

Migration sudah jalan otomatis. Untuk membuat pengumuman pertama via API:

```bash
# Login dulu untuk dapat token
curl -X POST http://localhost:801/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Buat pengumuman
curl -X POST http://localhost:801/api/v1/announcements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pengumuman Test",
    "content": "Ini adalah pengumuman test untuk semua wali santri",
    "priority": "normal",
    "target_type": "all",
    "push_notification": false
  }'
```

### 2. Frontend PWA (Admin)

1. Login sebagai admin
2. Klik menu **"Pengumuman"** di sidebar
3. Klik tombol **"+ Buat Pengumuman"**
4. Isi form dan klik **"Simpan"**

### 3. Frontend PWA (Wali Santri)

1. Login sebagai wali santri
2. Badge 📢 muncul di topbar dengan counter
3. Klik badge untuk melihat pengumuman
4. Klik pengumuman untuk detail (auto mark as read)

### 4. Mobile Flutter

1. Jalankan app Flutter
2. Login sebagai wali santri
3. Badge 📢 muncul di app bar (sebelah notification bell)
4. Tap badge untuk buka AnnouncementsScreen
5. Pilih tab "Semua" atau "Belum Dibaca"
6. Tap pengumuman untuk lihat detail (auto mark as read)

---

## Troubleshooting

### Badge tidak muncul di mobile:

1. Pastikan backend running di port 8001
2. Cek `ApiService.getBaseUrl()` sudah benar
3. Test API manual dengan curl
4. Check log console untuk error

### Polling tidak berjalan:

1. PWA: Cek browser console untuk error
2. Mobile: Cek debug console
3. Pastikan token valid (tidak 401)

### Pengumuman tidak tampil:

1. Pastikan target_type dan target_ids sesuai
2. Untuk testing, gunakan target_type = 'all'
3. Cek response API di Network tab

---

**Implementasi Selesai:** ✅
- ✅ Backend API
- ✅ Frontend PWA (Admin & Wali Santri)
- ✅ Mobile Flutter
- ✅ Polling Service (60 detik)
- ✅ Badge Notification
- ✅ CRUD Pengumuman
- ✅ Mark as Read
- ✅ Filter Target (All/Kelas/Santri)
- ✅ Priority System
