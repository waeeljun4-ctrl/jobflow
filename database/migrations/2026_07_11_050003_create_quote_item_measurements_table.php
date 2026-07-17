<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Optional per-item dimension rows (length x width x piece count) so
     * the square-meter quantity of a quote line is calculated automatically
     * instead of typed by hand — e.g. 80cm x 400cm = 3.2 m2.
     */
    public function up(): void
    {
        Schema::create('quote_item_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_item_id')->constrained()->cascadeOnDelete();
            $table->decimal('length_cm', 8, 2);
            $table->decimal('width_cm', 8, 2);
            $table->unsignedInteger('pieces')->default(1);
            $table->decimal('area_m2', 8, 2);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_item_measurements');
    }
};
