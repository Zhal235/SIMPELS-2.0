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
        // Check if we're using SQLite (development) or MySQL (production)
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite compatible version
            DB::statement("
                UPDATE pembayaran 
                SET tanggal_bayar = datetime(tanggal_bayar, '+10 hours')
                WHERE strftime('%H:%M:%S', tanggal_bayar) = '00:00:00'
                AND tanggal_bayar IS NOT NULL
            ");
        } else {
            // MySQL compatible version  
            DB::statement("
                UPDATE pembayaran 
                SET tanggal_bayar = DATE_ADD(tanggal_bayar, INTERVAL 10 HOUR)
                WHERE TIME(tanggal_bayar) = '00:00:00'
                AND tanggal_bayar IS NOT NULL
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if we're using SQLite (development) or MySQL (production)
        $driver = DB::connection()->getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite compatible version
            DB::statement("
                UPDATE pembayaran 
                SET tanggal_bayar = date(tanggal_bayar)
                WHERE tanggal_bayar IS NOT NULL
            ");
        } else {
            // MySQL compatible version
            DB::statement("
                UPDATE pembayaran 
                SET tanggal_bayar = DATE(tanggal_bayar)
                WHERE tanggal_bayar IS NOT NULL
            ");
        }
    }
};
