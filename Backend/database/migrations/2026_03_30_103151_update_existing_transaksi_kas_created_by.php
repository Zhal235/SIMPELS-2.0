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
        // Cari super admin, admin, atau user pertama sebagai default creator untuk data lama
        $defaultUser = DB::table('users')
            ->whereIn('role', ['super_admin', 'admin'])
            ->orderBy('id')
            ->first();
        
        if (!$defaultUser) {
            $defaultUser = DB::table('users')->orderBy('id')->first();
        }
        
        // Jika ada user di database, update transaksi_kas yang created_by nya NULL
        if ($defaultUser) {
            DB::table('transaksi_kas')
                ->whereNull('created_by')
                ->update(['created_by' => $defaultUser->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak perlu rollback karena ini data migration
        // Biarkan data tetap ada
    }
};
