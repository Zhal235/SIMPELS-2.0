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
        Schema::create('jenis_tagihan', function (Blueprint $table) {
            $table->id();
            $table->string('nama_tagihan');
            $table->enum('kategori', ['Rutin', 'Non Rutin']);
            $table->json('bulan'); // Array bulan: ["Juli", "Agustus", ...]
            $table->enum('tipe_nominal', ['sama', 'per_kelas', 'per_individu']);
            
            // Nominal sama untuk semua
            $table->decimal('nominal_sama', 15, 2)->nullable();
            
            // Nominal berbeda per kelas
            $table->json('nominal_per_kelas')->nullable(); 
            // Format: [{"kelas": "VII A", "nominal": 300000}, ...]
            
            // Nominal berbeda per individu
            $table->json('nominal_per_individu')->nullable(); 
            // Format: [{"santriId": "1", "santriNama": "Ahmad", "nominal": 150000}, ...]
            
            $table->string('jatuh_tempo');
            $table->string('buku_kas'); // Nanti akan jadi foreign key ke tabel buku_kas
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jenis_tagihan');
    }
};
