# Bukti Transfer Component Updates

## New Features Added

### 1. Tab Navigation
- **Pending Tab**: Shows only pending bukti transfer that need approval
- **Histori Tab**: Shows all processed bukti transfer (approved/rejected)

### 2. History Filter (in Histori tab)
Filter buttons to organize processed bukti transfer:
- **Semua**: Shows all processed bukti transfer (approved + rejected)
- **Disetujui**: Shows only approved bukti transfer
- **Ditolak**: Shows only rejected bukti transfer

### 3. Enhanced Display Information

#### Pending Tab
- Upload date and time
- Student info (NIS, Name, Class)
- Total nominal
- Bills breakdown
- Notes from guardian and admin
- Action buttons (Setujui/Tolak)

#### History Tab
- Processing date and time instead of upload date
- Admin who processed it (Oleh: Admin Name)
- Status badge (Disetujui/Ditolak)
- All other information same as pending
- No action buttons (read-only view)

### 4. Smart Rendering
- Action buttons (Approve/Reject) only show in:
  - Pending tab
  - When status is 'pending'
- History tab is read-only and shows processed information

## State Management
```typescript
activeTab: 'pending' | 'history'        // Current tab view
historyFilter: 'all' | 'approved' | 'rejected'  // Filter in history tab
```

## API Integration
The component loads data based on:
- **Pending view**: `GET /admin/bukti-transfer?status=pending`
- **History - All**: `GET /admin/bukti-transfer` (no status filter)
- **History - Approved**: `GET /admin/bukti-transfer?status=approved`
- **History - Rejected**: `GET /admin/bukti-transfer?status=rejected`

## Data Fields Used from API
- `id`, `total_nominal`, `status`
- `santri` (id, nis, nama, kelas)
- `tagihan` (array of bills)
- `uploaded_at`, `processed_at`, `processed_by`
- `catatan_wali`, `catatan_admin`
- `bukti_url`

## UI Components
- Tab buttons with active states
- Filter buttons (only visible in history tab)
- Status badges (pending/approved/rejected with color coding)
- Modal for approve/reject confirmation
- Image modal for viewing proof images

## Color Scheme
- Pending: Yellow
- Approved: Green
- Rejected: Red
- Blue: Tabs and filters
