<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_instance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('depends_on_stage_instance_id')->constrained('stage_instances')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['stage_instance_id', 'depends_on_stage_instance_id'], 'stage_deps_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_dependencies');
    }
};
