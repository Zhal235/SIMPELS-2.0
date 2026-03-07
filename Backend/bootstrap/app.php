<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // CORS harus jalan sebelum semua middleware lain (termasuk auth:sanctum)
        // supaya OPTIONS preflight bisa dibalas meskipun tidak ada token
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);

        $middleware->appendToGroup('web', [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\AddStorageCorsHeaders::class,
        ]);
        
        // Register custom middleware aliases
        $middleware->alias([
            'permission' => \App\Http\Middleware\CheckPermission::class,
            'role'       => \App\Http\Middleware\CheckRole::class,
        ]);
        
        // Exclude storage routes and API routes from CSRF verification
        // API routes use Bearer token authentication, not CSRF tokens
        $middleware->validateCsrfTokens(except: [
            '/api/*',
            '/storage/*',
            '/public-storage/*',
        ]);
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {
        // Daily DB backup at 02:00 WIB
        $schedule->command('db:backup')->dailyAt('19:00')->timezone('UTC');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Customize exception handling (optional)
    })
    ->withProviders()  // ← KEY FIX: Ensure providers are registered for console bootstrap
    ->create();
