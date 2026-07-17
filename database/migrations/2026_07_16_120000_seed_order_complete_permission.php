<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

/**
 * Lets the admin grant/revoke "mark order as completed" to specific
 * workers, same pattern as the page.* admin-page grants.
 */
return new class extends Migration
{
    public function up(): void
    {
        Permission::findOrCreate('order.complete', 'web');
    }

    public function down(): void
    {
        Permission::where('name', 'order.complete')->delete();
    }
};
