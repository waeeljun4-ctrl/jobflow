<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExtendWorkerSessionLifetime
{
    /**
     * Workers stay logged in until they explicitly log out — only admins
     * keep the normal idle timeout, since their account carries more
     * sensitive access. Session::lifetime is read when the response cookie
     * is built (after this middleware runs), so overriding it here per
     * request is enough — nothing else needs to change.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->isAdmin()) {
            config(['session.lifetime' => 60 * 24 * 365 * 10]);
        }

        return $next($request);
    }
}
