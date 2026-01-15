<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing pembayaran records yang tanggal_bayar-nya hanya berisi date (00:00:00)
        // Set waktu default ke 10:00:00 WIB untuk data historis
        // MySQL compatible: menggunakan DATE_ADD dan TIME functions
        DB::statement("
            UPDATE pembayaran 
            SET tanggal_bayar = DATE_ADD(tanggal_bayar, INTERVAL 10 HOUR)
            WHERE TIME(tanggal_bayar) = '00:00:00'
            AND tanggal_bayar IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback: kembalikan ke midnight
        // MySQL compatible: menggunakan DATE function dan TIME checking
        DB::statement("
            UPDATE pembayaran 
            SET tanggal_bayar = DATE(tanggal_bayar)
            WHERE tanggal_bayar IS NOT NULL
        ");
    }
};
