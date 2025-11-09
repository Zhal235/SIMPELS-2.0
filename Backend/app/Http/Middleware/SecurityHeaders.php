<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Production Hardening: Security Headers Middleware
 * --------------------------------------------------
 * CHANGE LOG (UI/UX & Security Hardening):
 * - Adds common security headers without altering business logic or routes.
 * - Headers included:
 *   - X-Frame-Options: DENY
 *   - X-Content-Type-Options: nosniff
 *   - Referrer-Policy: no-referrer-when-downgrade
 *   - X-XSS-Protection: 1; mode=block (legacy header, kept per request requirement)
 * - Safe for both API and web responses.
 *
 * You may extend this with Content-Security-Policy (CSP) tailored to your
 * asset domains. CSP is intentionally omitted by default to avoid breaking
 * inline scripts/styles in existing views.
 */
class SecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Add security headers (non-breaking)
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'no-referrer-when-downgrade');
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        return $response;
    }
}