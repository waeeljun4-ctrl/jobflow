<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Measurement rows now come in three flavors: area (length x width, the
     * original behavior), linear (length only — e.g. shade cloth sold by
     * the running meter at a fixed roll width), and piece (a plain count,
     * no dimensions at all).
     */
    public function up(): void
    {
        Schema::table('quote_item_measurements', function (Blueprint $table) {
            $table->string('type')->default('area')->after('quote_item_id');
        });

        Schema::table('quote_item_measurements', function (Blueprint $table) {
            $table->decimal('length_cm', 8, 2)->nullable()->change();
            $table->decimal('width_cm', 8, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('quote_item_measurements', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
