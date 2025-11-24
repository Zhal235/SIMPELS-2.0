<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        // For now, we'll use raw SQL to update the constraint
        
        // First, get the current database driver
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'sqlite') {
            // For SQLite, we need to recreate the table or use a workaround
            // Let's just change status to string instead of enum for flexibility
            Schema::table('santri', function (Blueprint $table) {
                $table->string('status', 50)->default('aktif')->change();
            });
        } else {
            // For MySQL/PostgreSQL
            DB::statement("ALTER TABLE santri MODIFY COLUMN status ENUM('aktif', 'keluar', 'mutasi', 'mutasi_keluar', 'alumni', 'lulus') DEFAULT 'aktif'");
        }
    }

    public function down(): void
    {
        // Revert back to original enum
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'sqlite') {
            Schema::table('santri', function (Blueprint $table) {
                $table->string('status', 50)->default('aktif')->change();
            });
        } else {
            DB::statement("ALTER TABLE santri MODIFY COLUMN status ENUM('aktif', 'mutasi_keluar', 'alumni') DEFAULT 'aktif'");
        }
    }
};
