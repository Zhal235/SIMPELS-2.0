<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddStorageCorsHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');
        $allowedOrigins = [
            'https://simpels.saza.sch.id',
            'https://api.saza.sch.id',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ];
        
        // Check if origin matches allowed patterns
        $isAllowed = in_array($origin, $allowedOrigins) || 
                     preg_match('/^http:\/\/localhost:\d+$/', $origin) ||
                     preg_match('/^http:\/\/127\.0\.0\.1:\d+$/', $origin) ||
                     preg_match('/^https:\/\/.*\.saza\.sch\.id$/', $origin);
        
        $allowOrigin = $isAllowed ? $origin : 'https://simpels.saza.sch.id';

        // Handle preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $allowOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', '*')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        $response = $next($request);

        // Add CORS headers to ALL responses (not just storage)
        // This ensures static files also get CORS headers
        $response->headers->set('Access-Control-Allow-Origin', $allowOrigin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', '*');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
}
