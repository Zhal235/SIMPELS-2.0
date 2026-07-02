<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('santri', function (Blueprint $table) {
            if (!Schema::hasColumn('santri', 'tanggal_keluar')) {
                $table->date('tanggal_keluar')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('santri', function (Blueprint $table) {
            if (Schema::hasColumn('santri', 'tanggal_keluar')) {
                $table->dropColumn('tanggal_keluar');
            }
        });
    }
};
