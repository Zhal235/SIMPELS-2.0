<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('epos_kebutuhan_orders', function (Blueprint $table) {
            $table->id();
            $table->string('epos_order_id')->unique();   // order_number dari EPOS (KBT-xxx)
            $table->string('santri_id', 36);      // UUID
            $table->string('santri_name');
            $table->string('rfid_uid')->nullable();
            $table->json('items');                        // [{product_id,name,qty,price,subtotal}]
            $table->decimal('total_amount', 12, 2);
            $table->enum('status', [
                'pending',
                'confirmed',
                'rejected',
                'expired',
                'completed',
            ])->default('pending');
            $table->string('cashier_name')->nullable();
            $table->string('terminal_id')->nullable();
            $table->unsignedBigInteger('confirmed_by_id')->nullable(); // user id yang konfirmasi
            $table->string('confirmed_by')->nullable();                // 'wali' | 'admin'
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('expired_at');                           // +1 hari dari created_at
            $table->string('rejection_reason')->nullable();
            $table->unsignedBigInteger('wallet_transaction_id')->nullable(); // setelah deduct saldo
            $table->timestamps();

            $table->index(['santri_id', 'status']);
            $table->index('status');
            $table->index('expired_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('epos_kebutuhan_orders');
    }
};
