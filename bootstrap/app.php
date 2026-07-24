<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\ExtendWorkerSessionLifetime::class,
        ]);

        $middleware->api(append: [
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureIsAdmin::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // A 403 hit while still "inside" a worker preview (impersonation)
        // doesn't mean access should be denied — it means the preview
        // should just end here, silently, so the admin lands on the page
        // they asked for. This catches every source of a 403 (route
        // middleware like EnsureIsAdmin, Gate::authorize(), a raw
        // abort(403) in a controller — e.g. OrderController@show's policy
        // check), not just the admin-only route group.
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if ($e->getStatusCode() !== 403 || ! $request->session()->has('impersonator_id')) {
                return null;
            }

            $adminId = $request->session()->pull('impersonator_id');
            Auth::loginUsingId($adminId);
            $request->session()->regenerate();

            return redirect($request->fullUrl());
        });
    })->create();
