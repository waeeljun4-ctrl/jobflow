<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    public function up(): void
    {
        Permission::findOrCreate('page.ledger', 'web');
    }

    public function down(): void
    {
        Permission::where('name', 'page.ledger')->delete();
    }
};
