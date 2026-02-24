<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix 1: method NULL/empty/migration → cash
        DB::table('wallet_transactions')
            ->where('type', 'credit')
            ->where(function ($q) {
                $q->whereNull('method')
                  ->orWhere('method', '')
                  ->orWhere('method', 'migration');
            })
            ->update(['method' => 'cash']);

        // Fix 2: MIGRATION transactions with amount=0 (hasil bug delta saldo)
        // Update amount menggunakan balance_after (yang selalu tersimpan benar)
        DB::table('wallet_transactions')
            ->where('reference', 'like', 'MIGRATION-%')
            ->where('amount', 0)
            ->where('balance_after', '>', 0)
            ->update([
                'amount' => DB::raw('balance_after'),
                'method' => 'cash',
            ]);
    }

    public function down(): void
    {
        // Tidak perlu rollback
    }
};
