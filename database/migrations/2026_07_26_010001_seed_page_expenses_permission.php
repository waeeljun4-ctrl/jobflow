<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

/**
 * Same pattern as the other page.* permissions — admin-only by default,
 * grantable to a specific worker later if the admin ever wants to.
 */
return new class extends Migration
{
    public function up(): void
    {
        Permission::findOrCreate('page.expenses', 'web');
    }

    public function down(): void
    {
        Permission::where('name', 'page.expenses')->delete();
    }
};
