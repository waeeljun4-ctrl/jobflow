<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_stage_selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stage_definition_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['order_id', 'stage_definition_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_stage_selections');
    }
};
