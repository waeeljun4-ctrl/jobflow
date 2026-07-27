<?php

namespace App\Providers;

use App\Models\StageDefinition;
use App\Models\Supplier;
use App\Models\User;
use App\Observers\StageDefinitionObserver;
use Illuminate\Database\Eloquent\Relations\Relation;
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

        // Ledger parties are polymorphic (worker or supplier) — clean type
        // strings instead of leaking full class names into the DB/URLs.
        Relation::morphMap([
            'worker' => User::class,
            'supplier' => Supplier::class,
        ]);
    }
}
