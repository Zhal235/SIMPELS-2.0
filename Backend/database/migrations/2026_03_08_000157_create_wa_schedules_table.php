<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('wa_schedules', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['tagihan_detail', 'reminder']);
            $table->json('tanggal_kirim'); // array of up to 3 ints (1-28)
            $table->string('jam', 5)->default('07:00');
            $table->boolean('enabled')->default(true);
            $table->date('last_ran_date')->nullable();
            $table->timestamps();
            $table->unique('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wa_schedules');
    }
};
