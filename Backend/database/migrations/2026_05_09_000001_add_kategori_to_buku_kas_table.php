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
        Schema::table('buku_kas', function (Blueprint $table) {
            $table->enum('kategori', ['Rutin', 'Non Rutin'])->default('Rutin')->after('nama_kas');
            $table->text('keterangan')->nullable()->after('kategori');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buku_kas', function (Blueprint $table) {
            $table->dropColumn('kategori');
            $table->dropColumn('keterangan');
        });
    }
};
