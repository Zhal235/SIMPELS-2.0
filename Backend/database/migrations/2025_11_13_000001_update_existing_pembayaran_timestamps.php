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
        DB::statement("
            UPDATE pembayaran 
            SET tanggal_bayar = datetime(tanggal_bayar, '+10 hours')
            WHERE time(tanggal_bayar) = '00:00:00'
            AND tanggal_bayar IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback: kembalikan ke midnight
        DB::statement("
            UPDATE pembayaran 
            SET tanggal_bayar = date(tanggal_bayar)
            WHERE tanggal_bayar IS NOT NULL
        ");
    }
};
