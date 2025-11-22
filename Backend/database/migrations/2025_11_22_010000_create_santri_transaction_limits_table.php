<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('santri_transaction_limits', function (Blueprint $table) {
            $table->id();
            $table->uuid('santri_id');
            $table->decimal('daily_limit', 15, 2)->default(15000);
            $table->timestamps();

            $table->foreign('santri_id')->references('id')->on('santri')->onDelete('cascade');
            $table->index(['santri_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('santri_transaction_limits');
    }
};