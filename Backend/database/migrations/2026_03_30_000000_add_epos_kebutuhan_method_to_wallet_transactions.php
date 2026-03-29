<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE wallet_transactions CHANGE `method` `method` ENUM('cash','transfer','epos','migration','admin-reverse','admin-void','epos_kebutuhan') NULL;");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE wallet_transactions CHANGE `method` `method` ENUM('cash','transfer','epos','migration','admin-reverse','admin-void') NULL;");
        }
    }
};
