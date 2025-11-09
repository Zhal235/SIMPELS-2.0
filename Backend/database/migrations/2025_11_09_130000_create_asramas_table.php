<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('asramas', function (Blueprint $table) {
            $table->id();
            $table->string('nama_asrama');
            $table->string('wali_asrama')->nullable();
            $table->timestamps();
        });

        // Tambahkan kolom asrama_nama ke tabel santri untuk sinkronisasi cepat di frontend
        if (Schema::hasTable('santri')) {
            Schema::table('santri', function (Blueprint $table) {
                if (!Schema::hasColumn('santri', 'asrama_nama')) {
                    $table->string('asrama_nama')->nullable()->after('asrama_id');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('santri') && Schema::hasColumn('santri', 'asrama_nama')) {
            Schema::table('santri', function (Blueprint $table) {
                $table->dropColumn('asrama_nama');
            });
        }
        Schema::dropIfExists('asramas');
    }
};