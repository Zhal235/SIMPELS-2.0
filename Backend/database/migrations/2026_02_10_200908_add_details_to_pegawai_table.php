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
        Schema::table('pegawai', function (Blueprint $table) {
            // Identity
            $table->string('nip')->nullable()->unique()->after('nama_pegawai')->comment('NIP atau NIPY');
            $table->string('nuptk')->nullable()->unique()->after('nip');
            $table->string('nik', 16)->nullable()->after('nuptk');
            
            // Personal & Biodata
            $table->string('gelar_depan')->nullable()->after('nik');
            $table->string('gelar_belakang')->nullable()->after('nama_pegawai'); // nama_pegawai ada di tengah gelar
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable()->after('gelar_belakang');
            $table->string('tempat_lahir')->nullable()->after('jenis_kelamin');
            $table->date('tanggal_lahir')->nullable()->after('tempat_lahir');
            $table->text('alamat')->nullable()->after('tanggal_lahir');
            $table->string('no_hp')->nullable()->after('alamat');
            $table->string('email')->nullable()->after('no_hp');
            
            // Employment Data
            $table->enum('jenis_pegawai', ['Guru', 'Staff', 'Security', 'Kebersihan', 'Lainnya'])->default('Guru')->after('email');
            $table->enum('status_kepegawaian', ['Tetap', 'Kontrak', 'Honorer', 'Magang'])->default('Tetap')->after('jenis_pegawai');
            $table->date('tanggal_mulai_tugas')->nullable()->after('status_kepegawaian');
            $table->string('jabatan')->nullable()->after('tanggal_mulai_tugas')->comment('Struktural jika ada');
            $table->string('pendidikan_terakhir')->nullable()->after('jabatan');
            
            // Misc
            $table->string('foto_profil')->nullable()->after('pendidikan_terakhir');
            $table->string('status_pernikahan')->nullable()->after('foto_profil');
            $table->string('nama_ibu_kandung')->nullable()->after('status_pernikahan');
            
            // System Integration
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pegawai', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn([
                'user_id',
                'nip',
                'nuptk',
                'nik',
                'gelar_depan',
                'gelar_belakang',
                'jenis_kelamin',
                'tempat_lahir',
                'tanggal_lahir',
                'alamat',
                'no_hp',
                'email',
                'jenis_pegawai',
                'status_kepegawaian',
                'tanggal_mulai_tugas',
                'jabatan',
                'pendidikan_terakhir',
                'foto_profil',
                'status_pernikahan',
                'nama_ibu_kandung'
            ]);
        });
    }
};
