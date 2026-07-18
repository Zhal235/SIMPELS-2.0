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
        // Fix: Update kelas XII santri from 'aktif' to 'alumni'
        // These 25 santri were incorrectly left as 'aktif' when they should have graduated
        DB::table('santri')
            ->whereIn('kelas_id', function ($query) {
                $query->select('id')->from('kelas')->where('tingkat', 12);
            })
            ->where('status', 'aktif')
            ->update([
                'status' => 'alumni',
                'tanggal_keluar' => '2026-05-23', // Graduation date consistent with other alumni
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback: Revert kelas XII alumni back to aktif (for dev/test purposes)
        DB::table('santri')
            ->where('tanggal_keluar', '2026-05-23')
            ->whereIn('kelas_id', function ($query) {
                $query->select('id')->from('kelas')->where('tingkat', 12);
            })
            ->update([
                'status' => 'aktif',
                'tanggal_keluar' => null,
            ]);
    }
};
