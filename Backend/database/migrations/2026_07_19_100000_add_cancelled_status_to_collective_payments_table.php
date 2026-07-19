<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE collective_payments MODIFY COLUMN status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE collective_payments MODIFY COLUMN status ENUM('active', 'completed') NOT NULL DEFAULT 'active'");
    }
};
