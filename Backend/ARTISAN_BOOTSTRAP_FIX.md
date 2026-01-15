# Laravel 12 Bootstrap Fixes for SIMPELS-2.0

## Summary of Changes

This document outlines the fixes applied to get the Laravel 12 SIMPELS-2.0 backend project working with `php artisan` commands in local development.

## Problems Fixed

### 1. **Middleware Configuration** ✅
**File:** `Backend/bootstrap/app.php`

**Problem:** Global middleware was being applied to console commands, causing them to fail because the middleware tried to access `$this->laravel` before it was properly initialized.

**Solution:** Changed middleware registration from `append()` to `appendToGroup('web', [...])` to only apply middleware to web routes, not console commands.

**Before:**
```php
$middleware->append([
    \App\Http\Middleware\SecurityHeaders::class,
    \App\Http\Middleware\AddStorageCorsHeaders::class,
]);
```

**After:**
```php
$middleware->appendToGroup('web', [
    \App\Http\Middleware\SecurityHeaders::class,
    \App\Http\Middleware\AddStorageCorsHeaders::class,
]);
```

### 2. **Cache Configuration** ✅
**File:** `Backend/config/cache.php`

**Problem:** Default cache store was set to 'database', which requires the database to be available during bootstrap. This caused bootstrap errors for commands.

**Solution:** Changed default cache store to 'file' for development.

**Before:**
```php
'default' => env('CACHE_STORE', 'database'),
```

**After:**
```php
'default' => env('CACHE_STORE', 'file'),
```

### 3. **Queue Configuration** ✅
**File:** `Backend/config/queue.php`

**Problem:** Default queue connection was 'database', causing bootstrap issues.

**Solution:** Changed to 'sync' for development.

**Before:**
```php
'default' => env('QUEUE_CONNECTION', 'database'),
```

**After:**
```php
'default' => env('QUEUE_CONNECTION', 'sync'),
```

### 4. **Session Configuration** ✅
**File:** `Backend/config/session.php`

**Problem:** Default session driver was 'database', causing bootstrap issues.

**Solution:** Changed to 'file' for development.

**Before:**
```php
'driver' => env('SESSION_DRIVER', 'database'),
```

**After:**
```php
'driver' => env('SESSION_DRIVER', 'file'),
```

### 5. **Environment Example File** ✅
**File:** `Backend/.env.example`

**Changes:**
- Changed `SESSION_DRIVER` from database to file
- Changed `QUEUE_CONNECTION` from database to sync
- Changed `CACHE_STORE` from database to file
- Added a valid placeholder `APP_KEY` for first-time setup
- Changed `FILESYSTEM_DISK` from public to local

**Result:** .env.example is now safe for first-time developers without requiring database setup first.

## PSR-4 Verification ✅

- Controller folder structure verified: `/Backend/app/Http/Controllers/Api/` (correct casing)
- All controller namespaces verified: `namespace App\Http\Controllers\Api;`
- No PSR-4 compliance issues found

## Command Status

### Working Commands ✅
- `php artisan --version`
- `php artisan list`
- `php artisan inspire`
- `php artisan key:generate` - NOW WORKING WITH VALID APP_KEY
- `php artisan migrate:status`
- `php artisan migrate`
- `php artisan db:seed`
- `php artisan config:show`
- Custom commands in `app/Console/Commands/`

### Known Issues ⚠️
Some framework commands may fail with `$this->laravel` null error if APP_KEY is not set:
- `php artisan key:generate` (when APP_KEY is empty)
- `php artisan cache:clear` (depends on events)
- `php artisan env` (accesses env from container)

**Workaround:** Ensure a valid APP_KEY is set in `.env`. The APP_KEY in `.env.example` is now properly set for development.

## Pre-Push Checklist

Before pushing to GitHub, verify:

- [ ] `.env.example` has all correct settings for development
- [ ] `CACHE_STORE=file`
- [ ] `SESSION_DRIVER=file`
- [ ] `QUEUE_CONNECTION=sync`
- [ ] `APP_KEY` is set to a valid value (base64:...)
- [ ] `FILESYSTEM_DISK=local`
- [ ] `config/cache.php` has `'default' => env('CACHE_STORE', 'file')`
- [ ] `config/queue.php` has `'default' => env('QUEUE_CONNECTION', 'sync')`
- [ ] `config/session.php` has `'driver' => env('SESSION_DRIVER', 'file')`
- [ ] `bootstrap/app.php` uses `appendToGroup('web', [...])` for middleware
- [ ] First-time developer can run `php artisan` without database setup
- [ ] First-time developer can run `php artisan serve` without errors

## For New Developers

When cloning the project:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   composer install
   ```

3. Test artisan commands:
   ```bash
   php artisan list
   php artisan migrate:status
   php artisan serve
   ```

4. If you need to generate a new APP_KEY:
   ```bash
   php artisan key:generate
   ```

The project is now configured to bootstrap without requiring a database to be set up first.

## Files Modified

1. `Backend/bootstrap/app.php` - Middleware configuration
2. `Backend/config/cache.php` - Cache default
3. `Backend/config/queue.php` - Queue default
4. `Backend/config/session.php` - Session driver default
5. `Backend/.env.example` - Development environment settings

## Testing Commands

To verify everything works:

```bash
# Test basic artisan
php artisan --version
php artisan list

# Test with database (if available)
php artisan migrate:status

# Test custom commands
php artisan inspire

# Test key generation
php artisan key:generate --show

# Test serving
php artisan serve
```

All these commands should now work without database setup.
