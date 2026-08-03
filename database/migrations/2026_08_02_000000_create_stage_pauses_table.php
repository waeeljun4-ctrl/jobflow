<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stage_pauses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stage_instance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('paused_by')->nullable()->constrained('users')->nullOnDelete();
            // 'shortage': worker is blocked by something (missing material) —
            // requires a reason, surfaces on the admin's dedicated page as a
            // problem to solve.
            // 'end_of_day': worker just went home — no reason needed, not a
            // problem, just excluded from worked-hours the same way.
            // Both exist so elapsed/worked-hours math has one uniform way to
            // subtract "the clock wasn't really running" — a full history
            // (not just "paused: yes/no") is what lets us compute accurate
            // worked hours after the fact, including for already-completed
            // stages.
            $table->string('type');
            $table->string('reason')->nullable();
            $table->timestamp('paused_at');
            $table->timestamp('resumed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stage_pauses');
    }
};
