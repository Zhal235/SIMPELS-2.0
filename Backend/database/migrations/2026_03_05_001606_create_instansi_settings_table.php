<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('instansi_settings', function (Blueprint $table) {
            $table->id();
            $table->string('nama_yayasan')->default('Yayasan Pondok Pesantren');
            $table->string('nama_pesantren')->default('Pondok Pesantren');
            $table->string('alamat')->nullable();
            $table->string('telp')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('kop_surat_path')->nullable();
            $table->timestamps();
        });

        // Insert default row
        DB::table('instansi_settings')->insert([
            'nama_yayasan' => 'Yayasan Pondok Pesantren',
            'nama_pesantren' => 'Pondok Pesantren',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('instansi_settings');
    }
};
