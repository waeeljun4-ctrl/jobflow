<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en')->nullable();
            $table->string('slug')->unique();
            $table->integer('sort_order')->default(0); // same value = parallel group
            $table->boolean('is_conditional')->default(true); // only created for an order if selected at intake
            $table->boolean('is_intake')->default(false); // exactly one protected row, auto-completed at order creation
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_definitions');
    }
};
