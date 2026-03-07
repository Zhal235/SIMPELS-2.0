<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE wa_schedules MODIFY COLUMN type ENUM('tagihan_detail', 'reminder', 'rekap_tunggakan') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE wa_schedules MODIFY COLUMN type ENUM('tagihan_detail', 'reminder') NOT NULL");
    }
};
