<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('epos_pools', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('balance', 15, 2)->default(0);
            $table->timestamps();
        });

        // Seed a main pool row for ePOS
        if (Schema::hasTable('epos_pools')) {
            \Illuminate\Support\Facades\DB::table('epos_pools')->insert([
                ['name' => 'epos_main', 'balance' => 0.00, 'created_at' => now(), 'updated_at' => now()]
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('epos_pools');
    }
};
