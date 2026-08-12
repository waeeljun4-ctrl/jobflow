<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_hour_archives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Snapshot of the total hours that were wiped, so a full reset
            // never silently loses the record — it just moves it here.
            $table->decimal('total_hours', 8, 2);
            $table->foreignId('archived_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('archived_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_hour_archives');
    }
};
