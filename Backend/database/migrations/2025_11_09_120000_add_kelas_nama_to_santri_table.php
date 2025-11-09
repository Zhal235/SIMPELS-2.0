<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Tambahkan kolom kelas_nama ke tabel santri (nullable)
     */
    public function up(): void
    {
        if (Schema::hasTable('santri') && !Schema::hasColumn('santri', 'kelas_nama')) {
            Schema::table('santri', function (Blueprint $table) {
                $table->string('kelas_nama')->nullable()->after('kelas_id');
            });
        }
    }

    /**
     * Rollback kolom kelas_nama dari tabel santri
     */
    public function down(): void
    {
        if (Schema::hasTable('santri') && Schema::hasColumn('santri', 'kelas_nama')) {
            Schema::table('santri', function (Blueprint $table) {
                $table->dropColumn('kelas_nama');
            });
        }
    }
};