<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rfid_tags', function (Blueprint $table) {
            $table->id();
            $table->string('uid')->unique();
            $table->uuid('santri_id')->nullable();
            $table->string('label')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->foreign('santri_id')->references('id')->on('santri')->onDelete('set null');
            $table->index(['santri_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rfid_tags');
    }
};
