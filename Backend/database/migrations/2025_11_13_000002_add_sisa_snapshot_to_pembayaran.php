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
        Schema::table('pembayaran', function (Blueprint $table) {
            // Tambah field untuk menyimpan snapshot sisa tagihan
            $table->decimal('sisa_sebelum', 15, 2)->after('nominal_bayar')->default(0);
            $table->decimal('sisa_sesudah', 15, 2)->after('sisa_sebelum')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pembayaran', function (Blueprint $table) {
            $table->dropColumn(['sisa_sebelum', 'sisa_sesudah']);
        });
    }
};
