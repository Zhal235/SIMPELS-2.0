<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration will insert wallets (balance=0) for all existing santri if not present.
     */
    public function up(): void
    {
        if (!Schema::hasTable('wallets') || !Schema::hasTable('santri')) return;

        $santriList = \Illuminate\Support\Facades\DB::table('santri')->select('id')->get();

        foreach ($santriList as $s) {
            $exists = \Illuminate\Support\Facades\DB::table('wallets')->where('santri_id', $s->id)->exists();
            if (!$exists) {
                \Illuminate\Support\Facades\DB::table('wallets')->insert([
                    'santri_id' => $s->id,
                    'balance' => 0,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     * This will remove wallets that have zero balance and were created for this migration.
     */
    public function down(): void
    {
        if (!Schema::hasTable('wallets')) return;

        \Illuminate\Support\Facades\DB::table('wallets')->where('balance', 0)->delete();
    }
};
