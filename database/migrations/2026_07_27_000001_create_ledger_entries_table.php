<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One shared ledger for both workers and suppliers — same "party has a
 * running balance made of dated entries" shape either way, so one table
 * (via a polymorphic party) instead of duplicating it per party type.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->morphs('partyable');
            $table->decimal('amount', 10, 2);
            $table->string('description');
            $table->date('entry_date');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_entries');
    }
};
