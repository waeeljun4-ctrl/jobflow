<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

/**
 * Lets the admin grant/revoke "edit order details" to specific workers,
 * independent of their stage assignments, same pattern as order.complete.
 */
return new class extends Migration
{
    public function up(): void
    {
        Permission::findOrCreate('order.edit', 'web');
    }

    public function down(): void
    {
        Permission::where('name', 'order.edit')->delete();
    }
};
