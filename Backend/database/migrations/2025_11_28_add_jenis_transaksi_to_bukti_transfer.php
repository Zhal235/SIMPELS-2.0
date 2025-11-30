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
        Schema::table('bukti_transfer', function (Blueprint $table) {
            // Add jenis_transaksi column to differentiate between pembayaran, topup, and combined
            $table->enum('jenis_transaksi', ['pembayaran', 'topup', 'pembayaran_topup'])->default('pembayaran')->after('santri_id');
            
            // Make tagihan_ids nullable for topup transactions
            $table->json('tagihan_ids')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bukti_transfer', function (Blueprint $table) {
            $table->dropColumn('jenis_transaksi');
        });
    }
};
