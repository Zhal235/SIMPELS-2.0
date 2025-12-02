<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't support ALTER COLUMN with foreign keys
        // So we need to recreate the table
        
        // 1. Rename old table
        Schema::rename('wallet_withdrawals', 'wallet_withdrawals_old');
        
        // 2. Create new table with nullable pool_id
        Schema::create('wallet_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pool_id')->nullable(); // Now nullable for cash withdrawals
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['pending', 'approved', 'rejected', 'done'])->default('pending');
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->string('epos_ref')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('pool_id')->references('id')->on('epos_pools')->onDelete('cascade');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('processed_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['pool_id', 'status']);
        });
        
        // 3. Copy data from old table
        DB::statement('INSERT INTO wallet_withdrawals SELECT * FROM wallet_withdrawals_old');
        
        // 4. Drop old table
        Schema::dropIfExists('wallet_withdrawals_old');
    }

    public function down(): void
    {
        // Reverse: make pool_id NOT NULL again
        Schema::rename('wallet_withdrawals', 'wallet_withdrawals_old');
        
        Schema::create('wallet_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pool_id'); // Back to NOT NULL
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['pending', 'approved', 'rejected', 'done'])->default('pending');
            $table->unsignedBigInteger('requested_by')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->string('epos_ref')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('pool_id')->references('id')->on('epos_pools')->onDelete('cascade');
            $table->foreign('requested_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('processed_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['pool_id', 'status']);
        });
        
        // Copy back (hanya yang pool_id tidak NULL)
        DB::statement('INSERT INTO wallet_withdrawals SELECT * FROM wallet_withdrawals_old WHERE pool_id IS NOT NULL');
        
        Schema::dropIfExists('wallet_withdrawals_old');
    }
};
