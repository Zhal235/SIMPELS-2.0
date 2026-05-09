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
        Schema::table('buku_kas', function (Blueprint $table) {
            // Saldo awal tidak diperlukan lagi, dihitung otomatis dari transaksi
            if (Schema::hasColumn('buku_kas', 'saldo_cash_awal')) {
                $table->dropColumn('saldo_cash_awal');
            }
            if (Schema::hasColumn('buku_kas', 'saldo_bank_awal')) {
                $table->dropColumn('saldo_bank_awal');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buku_kas', function (Blueprint $table) {
            $table->decimal('saldo_cash_awal', 15, 2)->default(0)->after('keterangan');
            $table->decimal('saldo_bank_awal', 15, 2)->default(0)->after('saldo_cash_awal');
        });
    }
};
