<?php

namespace App\Providers;

use App\Models\StageDefinition;
use App\Models\User;
use App\Observers\StageDefinitionObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::before(fn (User $user) => $user->isAdmin() ? true : null);

        StageDefinition::observe(StageDefinitionObserver::class);
    }
}
