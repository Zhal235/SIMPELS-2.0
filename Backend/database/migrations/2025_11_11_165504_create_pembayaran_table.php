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
        Schema::create('pembayaran', function (Blueprint $table) {
            $table->id();
            $table->uuid('santri_id');
            $table->unsignedBigInteger('tagihan_santri_id');
            $table->unsignedBigInteger('buku_kas_id');
            $table->string('no_transaksi')->unique(); // Format: PAY-YYYYMMDD-XXXXX
            $table->dateTime('tanggal_bayar'); // Changed from date to dateTime
            $table->decimal('nominal_bayar', 15, 2);
            $table->enum('metode_pembayaran', ['cash', 'transfer']);
            $table->enum('status_pembayaran', ['lunas', 'sebagian']);
            $table->text('keterangan')->nullable();
            $table->string('bukti_pembayaran')->nullable(); // Path file bukti transfer
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('santri_id')->references('id')->on('santri')->onDelete('cascade');
            $table->foreign('tagihan_santri_id')->references('id')->on('tagihan_santri')->onDelete('cascade');
            $table->foreign('buku_kas_id')->references('id')->on('buku_kas')->onDelete('cascade');
            
            // Index
            $table->index(['santri_id', 'tanggal_bayar']);
            $table->index('no_transaksi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembayaran');
    }
};
