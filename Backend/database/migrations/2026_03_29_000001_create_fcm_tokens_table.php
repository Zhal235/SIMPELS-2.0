<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('fcm_tokens')) {
            Schema::create('fcm_tokens', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('santri_id');
                $table->string('fcm_token', 500)->unique();
                $table->string('device_type')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();

                $table->foreign('santri_id')->references('id')->on('santri')->onDelete('cascade');
                $table->index(['santri_id', 'fcm_token']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fcm_tokens');
    }
};
