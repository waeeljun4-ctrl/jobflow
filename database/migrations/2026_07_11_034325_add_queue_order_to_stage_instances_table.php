<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lets the admin manually prioritize a stage's queue (e.g. an urgent
     * order that came in later should be designed first). Existing rows are
     * backfilled from their id so current queue order doesn't change until
     * an admin explicitly reorders it.
     */
    public function up(): void
    {
        Schema::table('stage_instances', function (Blueprint $table) {
            $table->unsignedBigInteger('queue_order')->default(0)->after('status');
        });

        DB::statement('UPDATE stage_instances SET queue_order = id');
    }

    public function down(): void
    {
        Schema::table('stage_instances', function (Blueprint $table) {
            $table->dropColumn('queue_order');
        });
    }
};
