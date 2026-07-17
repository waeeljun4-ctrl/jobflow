<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lets intake optionally attach an existing price quote to an order and
     * hold it (no stage graph yet) until the customer approves the price —
     * the admin releases it to design manually afterward.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('quote_id')->nullable()->after('customer_id')->constrained('quotes')->nullOnDelete();
            $table->boolean('on_hold')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quote_id');
            $table->dropColumn('on_hold');
        });
    }
};
