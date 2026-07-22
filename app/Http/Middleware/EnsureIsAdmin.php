<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        // Reaching an admin-only page while still "inside" a worker preview
        // (e.g. the admin hit the browser back button instead of the
        // explicit "stop previewing" action) doesn't mean access should be
        // denied — it means the preview should just end here, silently, so
        // the admin lands on the page they asked for instead of a 403.
        if (! $request->user()?->isAdmin() && $request->session()->has('impersonator_id')) {
            $adminId = $request->session()->pull('impersonator_id');
            Auth::loginUsingId($adminId);
            $request->session()->regenerate();
        }

        abort_unless($request->user()?->isAdmin(), 403);

        return $next($request);
    }
}
