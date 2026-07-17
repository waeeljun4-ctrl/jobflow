<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spec_fields', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label_ar');
            $table->string('label_en')->nullable();
            $table->string('field_type'); // text|number|textarea|select|boolean|date
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(false);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spec_fields');
    }
};
