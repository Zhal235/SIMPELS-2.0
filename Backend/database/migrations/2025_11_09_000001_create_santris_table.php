<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('santris', function (Blueprint $table) {
            $table->id();
            $table->string('nis', 20)->unique();
            $table->string('nisn', 20)->nullable();
            $table->string('nik_santri', 20)->nullable();
            $table->string('nama_santri', 100);
            $table->string('tempat_lahir', 50);
            $table->date('tanggal_lahir');
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->foreignId('kelas_id')->nullable()->index();
            $table->foreignId('asrama_id')->nullable()->index();
            $table->string('asal_sekolah', 100)->nullable();
            $table->string('hobi', 100)->nullable();
            $table->string('cita_cita', 100)->nullable();
            $table->integer('jumlah_saudara')->nullable();
            $table->text('alamat');
            $table->string('provinsi', 50)->nullable();
            $table->string('kabupaten', 50)->nullable();
            $table->string('kecamatan', 50)->nullable();
            $table->string('desa', 50)->nullable();
            $table->string('kode_pos', 10)->nullable();
            $table->string('no_kk', 50)->nullable();
            $table->string('nama_ayah', 100);
            $table->string('nik_ayah', 20)->nullable();
            $table->string('pendidikan_ayah', 50)->nullable();
            $table->string('pekerjaan_ayah', 100)->nullable();
            $table->string('hp_ayah', 20)->nullable();
            $table->string('nama_ibu', 100);
            $table->string('nik_ibu', 20)->nullable();
            $table->string('pendidikan_ibu', 50)->nullable();
            $table->string('pekerjaan_ibu', 100)->nullable();
            $table->string('hp_ibu', 20)->nullable();
            $table->string('foto')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('santris');
    }
};