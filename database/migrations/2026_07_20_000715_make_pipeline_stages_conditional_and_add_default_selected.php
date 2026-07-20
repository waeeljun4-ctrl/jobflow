<?php

use App\Models\StageDefinition;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every non-intake stage is now selectable per order (not just cnc/printing/
 * iron) — some orders skip installation entirely (picked up or delivered),
 * others might not need design (customer already sent a ready file). Design
 * and assembly default to pre-checked at intake since most orders need them;
 * the admin can still uncheck them per order.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stage_definitions', function (Blueprint $table) {
            $table->boolean('default_selected')->default(false)->after('is_conditional');
        });

        StageDefinition::whereIn('slug', ['design', 'assembly', 'installation'])
            ->update(['is_conditional' => true]);

        StageDefinition::whereIn('slug', ['design', 'assembly'])
            ->update(['default_selected' => true]);
    }

    public function down(): void
    {
        StageDefinition::whereIn('slug', ['design', 'assembly', 'installation'])
            ->update(['is_conditional' => false, 'default_selected' => false]);

        Schema::table('stage_definitions', function (Blueprint $table) {
            $table->dropColumn('default_selected');
        });
    }
};
