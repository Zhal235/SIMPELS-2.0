<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('santris', function (Blueprint $table) {
            if (Schema::hasColumn('santris', 'no_bpjs')) {
                $table->dropColumn('no_bpjs');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('santris', function (Blueprint $table) {
            if (!Schema::hasColumn('santris', 'no_bpjs')) {
                $table->string('no_bpjs', 50)->nullable();
            }
        });
    }
};