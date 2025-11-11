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
        Schema::create('transaksi_kas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('buku_kas_id');
            $table->string('no_transaksi')->unique();
            $table->date('tanggal');
            $table->enum('jenis', ['pemasukan', 'pengeluaran']);
            $table->enum('metode', ['cash', 'transfer']);
            $table->string('kategori'); // Pembayaran Tagihan, Operasional, dll
            $table->decimal('nominal', 15, 2);
            $table->text('keterangan')->nullable();
            $table->unsignedBigInteger('pembayaran_id')->nullable(); // Link ke pembayaran jika dari pembayaran santri
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign keys
            $table->foreign('buku_kas_id')->references('id')->on('buku_kas')->onDelete('cascade');
            $table->foreign('pembayaran_id')->references('id')->on('pembayaran')->onDelete('set null');
            
            // Index
            $table->index(['buku_kas_id', 'tanggal']);
            $table->index('jenis');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi_kas');
    }
};
