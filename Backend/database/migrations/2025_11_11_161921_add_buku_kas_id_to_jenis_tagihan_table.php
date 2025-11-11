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
        Schema::table('jenis_tagihan', function (Blueprint $table) {
            // Cek apakah kolom buku_kas ada, jika ada hapus
            if (Schema::hasColumn('jenis_tagihan', 'buku_kas')) {
                $table->dropColumn('buku_kas');
            }
            
            // Tambah foreign key ke buku_kas (nullable dulu karena ada data existing)
            $table->unsignedBigInteger('buku_kas_id')->nullable()->after('jatuh_tempo');
            $table->foreign('buku_kas_id')->references('id')->on('buku_kas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jenis_tagihan', function (Blueprint $table) {
            $table->dropForeign(['buku_kas_id']);
            $table->dropColumn('buku_kas_id');
            $table->string('buku_kas')->after('jatuh_tempo');
        });
    }
};
