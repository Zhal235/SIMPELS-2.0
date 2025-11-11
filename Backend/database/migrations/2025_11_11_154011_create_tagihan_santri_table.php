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
        Schema::create('tagihan_santri', function (Blueprint $table) {
            $table->id();
            $table->uuid('santri_id'); // UUID karena Santri pakai UUID
            $table->unsignedBigInteger('jenis_tagihan_id');
            $table->string('bulan'); // Nama bulan (Januari, Februari, dst)
            $table->integer('tahun');
            $table->decimal('nominal', 15, 2);
            $table->enum('status', ['belum_bayar', 'sebagian', 'lunas'])->default('belum_bayar');
            $table->decimal('dibayar', 15, 2)->default(0);
            $table->decimal('sisa', 15, 2);
            $table->string('jatuh_tempo');
            $table->string('buku_kas');
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('santri_id')->references('id')->on('santri')->onDelete('cascade');
            $table->foreign('jenis_tagihan_id')->references('id')->on('jenis_tagihan')->onDelete('cascade');
            
            // Index untuk query cepat
            $table->index(['santri_id', 'status']);
            $table->index(['bulan', 'tahun']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tagihan_santri');
    }
};
