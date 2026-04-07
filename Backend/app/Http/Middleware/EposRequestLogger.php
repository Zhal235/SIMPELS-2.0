<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * EPOS Request Logger Middleware
 * 
 * Logs all requests from EPOS terminals for monitoring and debugging.
 * This helps track EPOS integration issues during refactoring.
 */
class EposRequestLogger
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if this is an EPOS-related endpoint
        $isEposEndpoint = $this->isEposEndpoint($request->path());
        
        if ($isEposEndpoint) {
            // Log request details
            Log::channel('epos')->info('EPOS Request', [
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'body' => $request->except(['password', 'api_key']), // Exclude sensitive data
                'timestamp' => now()->toDateTimeString()
            ]);
        }

        // Process the request
        $response = $next($request);

        if ($isEposEndpoint) {
            // Log response status and time
            $statusCode = $response->status();
            $logLevel = $statusCode >= 400 ? 'error' : 'info';
            
            Log::channel('epos')->{$logLevel}('EPOS Response', [
                'method' => $request->method(),
                'path' => $request->path(),
                'status' => $statusCode,
                'response_time_ms' => round((microtime(true) - LARAVEL_START) * 1000, 2),
                'timestamp' => now()->toDateTimeString()
            ]);

            // Log error details if response is error
            if ($statusCode >= 400) {
                Log::channel('epos')->error('EPOS Error Details', [
                    'path' => $request->path(),
                    'status' => $statusCode,
                    'response_body' => $response->content(),
                    'request_body' => $request->all()
                ]);
            }
        }

        return $response;
    }

    /**
     * Check if the request path is an EPOS endpoint
     */
    private function isEposEndpoint(string $path): bool
    {
        $eposPatterns = [
            'api/v1/wallets/epos',
            'api/v1/wallets/rfid',
            'api/v1/wallets/ping',
            'api/v1/epos',
            'api/epos'
        ];

        foreach ($eposPatterns as $pattern) {
            if (str_contains($path, $pattern)) {
                return true;
            }
        }

        return false;
    }
}
