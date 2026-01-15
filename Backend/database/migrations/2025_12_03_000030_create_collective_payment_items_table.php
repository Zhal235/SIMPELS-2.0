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
        Schema::create('collective_payment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collective_payment_id')->constrained('collective_payments')->onDelete('cascade');
            $table->uuid('santri_id');
            $table->foreign('santri_id')->references('id')->on('santri')->onDelete('cascade');
            $table->foreignId('wallet_id')->constrained('wallets')->onDelete('cascade');
            $table->decimal('amount', 15, 2); // 10000
            $table->enum('status', ['paid', 'pending'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->unsignedBigInteger('transaction_id')->nullable();
            $table->foreign('transaction_id')->references('id')->on('wallet_transactions')->onDelete('set null');
            $table->text('failure_reason')->nullable(); // "insufficient_balance"
            $table->timestamps();
            
            $table->index(['collective_payment_id', 'status']);
            $table->index(['santri_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collective_payment_items');
    }
};
