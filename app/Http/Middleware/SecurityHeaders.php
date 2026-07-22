<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // Signed-in pages must never come back from the browser's
        // back-forward cache: a cached page can hold a stale CSRF token
        // (e.g. after the impersonation session swap) or stale auth state,
        // and re-submitting from it fails in a way the SPA can't recover
        // from. Forcing a fresh fetch on every back/forward navigation
        // avoids that entirely.
        if ($request->user()) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        }

        // Fonts load from Google Fonts (see resources/views/app.blade.php);
        // everything else — scripts, styles, images, connections — is
        // same-origin only. No inline-script allowance needed since Vite
        // ships everything as external bundles.
        $response->headers->set('Content-Security-Policy', implode('; ', [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
        ]));

        return $response;
    }
}
