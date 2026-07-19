<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("\n            UPDATE santri s\n            JOIN kelas k ON k.id = s.kelas_id\n            SET s.status = 'aktif', s.tanggal_keluar = NULL\n            WHERE s.status = 'alumni'\n              AND k.tingkat = 12\n        ");
    }

    public function down(): void
    {
    }
};
