<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Tangani semua variasi penulisan typo: OPERAIONAL, Operaional, operaional
        DB::statement("UPDATE transaksi_kas SET kategori = REPLACE(REPLACE(REPLACE(kategori, 'OPERAIONAL', 'OPERASIONAL'), 'Operaional', 'Operasional'), 'operaional', 'operasional') WHERE kategori LIKE '%peraional%'");
    }

    public function down(): void
    {
        DB::table('transaksi_kas')
            ->where('kategori', 'like', '%perasional%')
            ->update([
                'kategori' => DB::raw("REPLACE(REPLACE(REPLACE(kategori, 'OPERASIONAL', 'OPERAIONAL'), 'Operasional', 'Operaional'), 'operasional', 'operaional')")
            ]);
    }
};
