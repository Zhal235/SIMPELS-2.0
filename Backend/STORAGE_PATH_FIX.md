# Fix: Doubled Storage Path in Student Photos

## Problem
Student photos were being requested with a doubled `storage/` path:
```
localhost:8000/storage/storage/foto-santri/filename.jpg  ❌
```

Should be:
```
localhost:8000/storage/foto-santri/filename.jpg  ✅
```

## Root Cause
When storing photos, the code was prepending `'storage/'` to the path returned by Laravel's `store()` method:

```php
// WRONG - causes doubled storage path
$path = $request->file('foto')->store('foto-santri', 'public');
$validated['foto'] = 'storage/' . $path;  // Stores: storage/foto-santri/filename.jpg

// Then when retrieved:
asset('storage/' . $this->foto);  // Results in: /storage/storage/foto-santri/filename.jpg
```

The `store()` method already returns the relative path (`foto-santri/filename.jpg`). When wrapped with `'storage/'`, it becomes `storage/foto-santri/filename.jpg` in the database.

## Solutions Applied

### 1. Fixed SantriController (create method)
**File:** `Backend/app/Http/Controllers/Kesantrian/SantriController.php` (line 113)

```php
// BEFORE
$validated['foto'] = 'storage/' . $path;

// AFTER
$validated['foto'] = $path;  // store relative path only
```

### 2. Fixed SantriController (update method)
**File:** `Backend/app/Http/Controllers/Kesantrian/SantriController.php` (line 222)

```php
// BEFORE
$validated['foto'] = 'storage/' . $path;

// AFTER
$validated['foto'] = $path;  // store relative path only
```

### 3. Updated SantriResource
**File:** `Backend/app/Http/Resources/SantriResource.php`

```php
// BEFORE
'foto_url' => $this->foto ? asset('storage/'.$this->foto) : null,

// AFTER
'foto_url' => $this->foto ? Storage::url($this->foto) : null,
```

Changed from `asset()` to `Storage::url()` for consistency and proper handling of storage disk URLs.

## How It Works Now

```
1. File stored: foto-santri/filename.jpg
   ↓
2. Database saves: foto-santri/filename.jpg (without storage/ prefix)
   ↓
3. Retrieved and processed:
   Storage::url('foto-santri/filename.jpg')
   ↓
4. Result: /storage/foto-santri/filename.jpg ✅
   ↓
5. Full URL: localhost:8000/storage/foto-santri/filename.jpg ✅
```

## Files Modified
1. ✅ `Backend/app/Http/Controllers/Kesantrian/SantriController.php`
2. ✅ `Backend/app/Http/Resources/SantriResource.php`

## Testing
After these changes:
- New student photos will be stored and retrieved correctly
- Existing photos in the database with `storage/` prefix may still have issues
- To fix existing data, you may need to run a migration to remove the `storage/` prefix from the foto column

```php
// Optional: Migration to fix existing data
DB::table('santris')->whereNotNull('foto')
    ->where('foto', 'like', 'storage/%')
    ->update([
        'foto' => DB::raw("SUBSTRING(foto, 9)")  // Remove first 8 chars ('storage/')
    ]);
```
