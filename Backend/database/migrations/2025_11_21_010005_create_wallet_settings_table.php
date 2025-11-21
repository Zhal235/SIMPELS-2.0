<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('scope')->default('global');
            $table->timestamps();
        });

        // Seed sensible defaults
        if (Schema::hasTable('wallet_settings')) {
            \Illuminate\Support\Facades\DB::table('wallet_settings')->insert([
                ['key' => 'daily_limit_jajan', 'value' => json_encode(['amount' => 50000]), 'scope' => 'global', 'created_at' => now(), 'updated_at' => now()],
                ['key' => 'min_balance_jajan', 'value' => json_encode(['amount' => 5000]), 'scope' => 'global', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_settings');
    }
};
