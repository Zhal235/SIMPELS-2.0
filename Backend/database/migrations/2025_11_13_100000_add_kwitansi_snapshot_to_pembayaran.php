<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Menambahkan field untuk menyimpan snapshot data kwitansi
     * saat pembayaran dilakukan, sehingga kwitansi yang dicetak ulang
     * akan sama persis dengan kwitansi saat pembayaran.
     */
    public function up(): void
    {
        Schema::table('pembayaran', function (Blueprint $table) {
            // Snapshot data kwitansi dalam format JSON
            $table->json('kwitansi_snapshot')->nullable()->after('bukti_pembayaran');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pembayaran', function (Blueprint $table) {
            $table->dropColumn('kwitansi_snapshot');
        });
    }
};
