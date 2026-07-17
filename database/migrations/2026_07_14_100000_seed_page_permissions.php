<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

/**
 * Static, admin-grantable "which admin sections can this worker see"
 * permissions — separate from the dynamic per-work-type `stage.*`
 * permissions, which gate production stages instead of admin pages.
 * Deliberately excludes users/customers/company-settings, which stay
 * admin-only regardless of grants.
 */
return new class extends Migration
{
    private const PAGES = [
        'page.dashboard',
        'page.execution',
        'page.orders_pending',
        'page.orders',
        'page.quotes',
        'page.stages',
        'page.spec_fields',
        'page.inventory',
    ];

    public function up(): void
    {
        foreach (self::PAGES as $name) {
            Permission::findOrCreate($name, 'web');
        }
    }

    public function down(): void
    {
        Permission::whereIn('name', self::PAGES)->delete();
    }
};
