<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    public function up(): void
    {
        Permission::findOrCreate('page.paused', 'web');
    }

    public function down(): void
    {
        Permission::where('name', 'page.paused')->delete();
    }
};
