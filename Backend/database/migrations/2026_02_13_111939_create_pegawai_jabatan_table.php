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
        Schema::create('pegawai_jabatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pegawai_id')->constrained('pegawai')->onDelete('cascade');
            $table->foreignId('jabatan_id')->constrained('jabatan')->onDelete('cascade');
            $table->boolean('is_primary')->default(false)->comment('Jabatan utama');
            $table->timestamps();
            
            // Unique constraint untuk mencegah duplicate
            $table->unique(['pegawai_id', 'jabatan_id']);
            
            // Index untuk performance 
            $table->index('pegawai_id');
            $table->index('jabatan_id');
            $table->index(['pegawai_id', 'is_primary']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pegawai_jabatan');
    }
};
