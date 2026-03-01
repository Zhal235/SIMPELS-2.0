<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('santri_tabungan_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tabungan_id')->constrained('santri_tabungan')->onDelete('cascade');
            $table->uuid('santri_id');
            $table->enum('type', ['setor', 'tarik']);
            $table->decimal('amount', 15, 2);
            $table->decimal('saldo_after', 15, 2);
            $table->string('description')->nullable();
            $table->enum('method', ['cash', 'transfer'])->default('cash');
            $table->unsignedBigInteger('recorded_by')->nullable();
            $table->timestamps();

            $table->foreign('santri_id')->references('id')->on('santri')->onDelete('cascade');
            $table->foreign('recorded_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['santri_id']);
            $table->index(['tabungan_id']);
            $table->index(['type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('santri_tabungan_transactions');
    }
};
