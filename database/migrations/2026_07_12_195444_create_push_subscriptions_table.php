<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['expo', 'webpush']);
            // Expo (mobile): one token identifies the device.
            $table->string('expo_token')->nullable()->unique();
            // Web Push (browser): the standard PushSubscription triple.
            $table->string('endpoint', 500)->nullable()->unique();
            $table->string('p256dh')->nullable();
            $table->string('auth_key')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
