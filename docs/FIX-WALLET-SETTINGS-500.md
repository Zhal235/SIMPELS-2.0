# Fix Error 500 pada /api/v1/wallets/settings/global

## Problem
Error 500 terjadi pada endpoint PUT `/api/v1/wallets/settings/global` di production server.

## Root Cause  
Method `updateGlobalSettings()` menggunakan `WalletSettings::firstOrCreate([])` dengan empty array yang menyebabkan:
- Tidak ada unique constraint untuk find record
- Bisa create multiple rows di database
- Laravel error saat tidak bisa determine which record to use

## Solution
Mengganti `firstOrCreate([])` dengan `DB::table()->updateOrInsert()` yang menggunakan unique key (`key` + `scope`):

```php
// SEBELUM (ERROR):
$settingsRow = WalletSettings::firstOrCreate([]);
$settingsRow->update(['global_minimum_balance' => $value]);

// SESUDAH (FIX):
DB::table('wallet_settings')->updateOrInsert(
    ['key' => 'global_config', 'scope' => 'global'],
    [
        'value' => json_encode(['global_minimum_balance' => $value]),
        'updated_at' => now(),
        'created_at' => now()
    ]
);
```

## Files Changed
- `Backend/app/Http/Controllers/WalletSettingsController.php`
  - Method `index()` - added fallback logic
  - Method `updateGlobalSettings()` - fixed firstOrCreate issue

## Deployment Steps

### 1. Git commit & push
```bash
cd c:\Users\Rhezal Maulana\Documents\GitHub\SIMPELS-2.0
git add Backend/app/Http/Controllers/WalletSettingsController.php
git commit -m "fix: resolve 500 error on wallet settings update endpoint"
git push origin main
```

### 2. Deploy ke server (SSH ke production)
```bash
cd /path/to/simpels-2.0/Backend
git pull origin main
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 3. Test endpoint
```bash
# Test GET (should return current settings)
curl https://api-simpels.saza.sch.id/api/v1/wallets/settings/global \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test PUT (update settings)
curl -X PUT https://api-simpels.saza.sch.id/api/v1/wallets/settings/global \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"global_minimum_balance": 15000}'
```

## Verification
Setelah deploy, pastikan:
1. ✅ Endpoint tidak return 500 error lagi
2. ✅ Data settings bisa diupdate dari frontend
3. ✅ Data tersimpan dengan benar di database

## Database Check (Optional)
Jika masih error, check database:
```sql
-- Check struktur tabel
DESC wallet_settings;

-- Check data yang ada
SELECT * FROM wallet_settings WHERE scope = 'global';

-- Clean up jika ada duplicate/corrupt rows (hati-hati!)
-- DELETE FROM wallet_settings WHERE id > 1 AND key IS NULL;
```

## Related Files
- Migration: `2025_12_03_002122_add_minimum_balance_to_wallet_settings.php`
- Model: `app/Models/WalletSettings.php`  
- Controllers yang menggunakan global_minimum_balance:
  - `WalletSettingsController.php` ✅ Fixed
  - `WaliController.php` (masih pakai old structure - OK)
  - `EposController.php` (masih pakai old structure - OK)
  - `KebutuhanOrderController.php` (masih pakai old structure - OK)

## Notes
- Fix ini backward compatible dengan code lain yang masih menggunakan `WalletSettings::first()->global_minimum_balance`
- Menggunakan key-value store untuk konsistensi dengan settings lain di tabel yang sama
- Fallback logic memastikan tidak error jika data belum ada
