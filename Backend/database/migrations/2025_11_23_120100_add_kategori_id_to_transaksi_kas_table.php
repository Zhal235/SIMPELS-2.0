<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('transaksi_kas', function (Blueprint $table) {
            $table->unsignedBigInteger('kategori_id')->nullable()->after('kategori');
            $table->foreign('kategori_id')->references('id')->on('kategori_pengeluaran')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::table('transaksi_kas', function (Blueprint $table) {
            $table->dropForeign(['kategori_id']);
            $table->dropColumn('kategori_id');
        });
    }
};
