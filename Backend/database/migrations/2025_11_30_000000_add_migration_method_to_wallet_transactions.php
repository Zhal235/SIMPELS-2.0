<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'migration' to method enum
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE wallet_transactions CHANGE `method` `method` ENUM('cash','transfer','epos','migration') NULL;");
        }
    }

    public function down(): void
    {
        // Revert to previous state (remove 'migration')
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE wallet_transactions CHANGE `method` `method` ENUM('cash','transfer','epos') NULL;");
        }
    }
};