<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

/**
 * Lets the admin grant/revoke "see and edit price/deposit" to specific
 * workers at will, independent of their stage assignments — same pattern
 * as order.complete/order.edit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Permission::findOrCreate('order.pricing', 'web');
    }

    public function down(): void
    {
        Permission::where('name', 'order.pricing')->delete();
    }
};
