# Laravel 12 Bootstrap Patches

## Problem
Some artisan commands fail because they access `$this->laravel` container before it's initialized in console context, causing:
- `Call to a member function make() on null`
- `Call to a member function getCachedConfigPath() on null`
- Other similar errors

## Files That Need Patching

### 1. ClearCommand.php - cache:clear
**File:** `vendor/laravel/framework/src/Illuminate/Cache/Console/ClearCommand.php`

Add null check for `$this->laravel` before accessing `$this->laravel['events']`:
```php
if ($this->laravel) {
    $this->laravel['events']->dispatch(...);
}
```

### 2. ConfigClearCommand.php - config:clear
**File:** `vendor/laravel/framework/src/Illuminate/Foundation/Console/ConfigClearCommand.php`

Add null check:
```php
if ($this->laravel) {
    $this->files->delete($this->laravel->getCachedConfigPath());
}
```

### 3. ConfigCacheCommand.php - config:cache
**File:** `vendor/laravel/framework/src/Illuminate/Foundation/Console/ConfigCacheCommand.php`

Add null check in `handle()` method:
```php
if (! $this->laravel) {
    $this->components->warn('Laravel container not initialized, skipping config cache.');
    return;
}
```

## Status
- ✅ ClearCommand patched
- ✅ ConfigClearCommand patched
- ✅ ConfigCacheCommand patched (partial - getFreshConfiguration() still needs work)

## Recommendation
For production, these patches should be submitted as pull requests to Laravel framework.
For now, they're applied as vendor patches for local development.
