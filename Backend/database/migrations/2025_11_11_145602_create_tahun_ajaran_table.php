<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tahun_ajaran', function (Blueprint $table) {
            $table->id();
            $table->string('nama_tahun_ajaran'); // Contoh: 2024/2025
            $table->integer('tanggal_mulai');
            $table->integer('bulan_mulai'); // 1-12
            $table->integer('tahun_mulai');
            $table->integer('tanggal_akhir');
            $table->integer('bulan_akhir'); // 1-12
            $table->integer('tahun_akhir');
            $table->enum('status', ['aktif', 'tidak_aktif'])->default('tidak_aktif');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tahun_ajaran');
    }
};
