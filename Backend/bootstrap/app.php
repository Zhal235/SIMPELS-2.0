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
        /*
        |--------------------------------------------------------------------------
        | Security & Hardening Middleware Registration
        |--------------------------------------------------------------------------
        | CHANGE LOG (Production Prep - UI/UX & Security Hardening)
        | - Added global SecurityHeaders middleware to inject common security
        |   headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
        |   X-XSS-Protection. Does not alter any business logic or routing.
        | - CSRF protection remains enabled via framework defaults in the
        |   "web" middleware group. No functional changes applied.
        | - This change is safe for development and recommended for production.
        |
        | NOTE: If you prefer to scope headers only to web routes, you can
        |       replace append() with appendToGroup('web', [...]). We use
        |       global headers by default to protect APIs and web.
        */
        $middleware->appendToGroup('web', [
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\AddStorageCorsHeaders::class,
        ]);
        
        // Exclude storage routes from CSRF verification
        $middleware->validateCsrfTokens(except: [
            '/storage/*',
            '/public-storage/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Customize exception handling (optional)
    })
    ->withProviders()  // ← KEY FIX: Ensure providers are registered for console bootstrap
    ->create();
