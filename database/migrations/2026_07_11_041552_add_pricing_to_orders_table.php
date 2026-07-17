<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pricing is admin-only information — captured at intake (often in the
     * field, right after quoting the customer) but never shown to workers.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->nullable()->after('due_date');
            $table->decimal('deposit_amount', 10, 2)->default(0)->after('price');
            $table->string('deposit_payment_method')->nullable()->after('deposit_amount'); // cash|bank_transfer|check
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['price', 'deposit_amount', 'deposit_payment_method']);
        });
    }
};
