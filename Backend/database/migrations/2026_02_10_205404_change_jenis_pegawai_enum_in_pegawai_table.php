<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       // 1. Change to string (removes constraints)
       Schema::table('pegawai', function (Blueprint $table) {
           $table->string('jenis_pegawai')->change();
       });

       // 2. Update data
       DB::table('pegawai')->where('jenis_pegawai', 'Guru')->update(['jenis_pegawai' => 'Pendidik']);
       DB::table('pegawai')->where('jenis_pegawai', '!=', 'Pendidik')->update(['jenis_pegawai' => 'Tenaga Kependidikan']);

       // 3. Change to new Enum
       Schema::table('pegawai', function (Blueprint $table) {
           $table->enum('jenis_pegawai', ['Pendidik', 'Tenaga Kependidikan'])->default('Pendidik')->change();
       });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Change to string
       Schema::table('pegawai', function (Blueprint $table) {
           $table->string('jenis_pegawai')->change();
       });
        
        // 2. Revert data mappings (approximate)
        DB::table('pegawai')->where('jenis_pegawai', 'Pendidik')->update(['jenis_pegawai' => 'Guru']);
        DB::table('pegawai')->where('jenis_pegawai', 'Tenaga Kependidikan')->update(['jenis_pegawai' => 'Staff']);

        // 3. Revert to old ENUM
        Schema::table('pegawai', function (Blueprint $table) {
           $table->enum('jenis_pegawai', ['Guru', 'Staff', 'Security', 'Kebersihan', 'Lainnya'])->default('Guru')->change();
       });
    }
};
