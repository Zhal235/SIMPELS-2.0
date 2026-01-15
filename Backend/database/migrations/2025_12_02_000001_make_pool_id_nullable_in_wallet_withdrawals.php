<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Check if migration already ran
        if (!Schema::hasTable('wallet_withdrawals')) {
            return;
        }

        // Use Laravel's built-in transaction handling which is database-agnostic
        DB::beginTransaction();
        
        try {
            // 1. Save existing data
            DB::statement('CREATE TABLE wallet_withdrawals_backup AS SELECT * FROM wallet_withdrawals');
            
            // 2. Drop old table
            Schema::dropIfExists('wallet_withdrawals');
            
            // 3. Create new table with nullable pool_id
            Schema::create('wallet_withdrawals', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('pool_id')->nullable(); // Now nullable
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
            
            // 4. Restore data
            DB::statement('INSERT INTO wallet_withdrawals SELECT * FROM wallet_withdrawals_backup');
            
            // 5. Drop backup
            DB::statement('DROP TABLE wallet_withdrawals_backup');
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function down(): void
    {
        // Reverse: make pool_id NOT NULL again
        if (!Schema::hasTable('wallet_withdrawals')) {
            return;
        }

        DB::beginTransaction();
        
        try {
            // 1. Save existing data
            DB::statement('CREATE TABLE wallet_withdrawals_backup AS SELECT * FROM wallet_withdrawals');
            
            // 2. Drop old table
            Schema::dropIfExists('wallet_withdrawals');
            
            // 3. Recreate with pool_id NOT NULL
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
            
            // 4. Restore data (only rows where pool_id is not NULL)
            DB::statement('INSERT INTO wallet_withdrawals SELECT * FROM wallet_withdrawals_backup WHERE pool_id IS NOT NULL');
            
            // 5. Drop backup
            DB::statement('DROP TABLE wallet_withdrawals_backup');
            
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
};
