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
        Schema::create('password_wali', function (Blueprint $table) {
            $table->id();
            $table->string('no_hp', 20)->unique();
            $table->string('password');
            $table->timestamps();
            
            $table->index('no_hp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('password_wali');
    }
};
