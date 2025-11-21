<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only run ALTER for non-sqlite drivers (MySQL/Postgres). SQLite cannot ALTER enums
        // For SQLite we skip the ALTER because it's not supported — the enum handling is DB-specific.
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE wallet_transactions CHANGE `method` `method` ENUM('cash','transfer','epos') NULL;");
        }
    }

    public function down(): void
    {
        // revert to previous state (remove 'epos')
        DB::statement("ALTER TABLE wallet_transactions CHANGE `method` `method` ENUM('cash','transfer') NULL;");
    }
};
