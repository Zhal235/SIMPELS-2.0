<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('santri', function (Blueprint $table) {
            // Add status for santri: aktif, mutasi_keluar, alumni
            $table->enum('status', ['aktif', 'mutasi_keluar', 'alumni'])->default('aktif')->after('jenis_penerimaan');
        });
    }

    public function down(): void
    {
        Schema::table('santri', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
