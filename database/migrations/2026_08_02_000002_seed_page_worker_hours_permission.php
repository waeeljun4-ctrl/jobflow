<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    public function up(): void
    {
        Permission::findOrCreate('page.worker_hours', 'web');
    }

    public function down(): void
    {
        Permission::where('name', 'page.worker_hours')->delete();
    }
};
