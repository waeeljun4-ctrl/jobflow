<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stage_instances', function (Blueprint $table) {
            // Admin override for a task's worked hours — set when a worker
            // forgot to close a task and elapsed time kept counting against
            // started_at/completed_at. When present, this replaces the
            // timestamp-based calculation everywhere hours are shown.
            $table->decimal('manual_hours', 5, 2)->nullable()->after('completed_by');
        });
    }

    public function down(): void
    {
        Schema::table('stage_instances', function (Blueprint $table) {
            $table->dropColumn('manual_hours');
        });
    }
};
