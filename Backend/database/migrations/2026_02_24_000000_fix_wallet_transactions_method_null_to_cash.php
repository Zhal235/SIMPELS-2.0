<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix data yang terlanjur tersimpan dengan method kosong/NULL/migration
        // akibat ENUM truncation saat import Excel sebelumnya.
        // Semua transaksi credit tanpa method yang jelas → set ke 'cash'
        DB::table('wallet_transactions')
            ->where('type', 'credit')
            ->where(function ($q) {
                $q->whereNull('method')
                  ->orWhere('method', '')
                  ->orWhere('method', 'migration');
            })
            ->update(['method' => 'cash']);
    }

    public function down(): void
    {
        // Tidak perlu rollback — tidak ada cara tahu data aslinya apa
    }
};
