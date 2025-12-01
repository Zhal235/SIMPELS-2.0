<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->index(); // santri_id from wali
            $table->string('user_type')->default('wali'); // wali, admin, santri
            $table->string('type'); // payment_approved, payment_rejected, new_tagihan, etc
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional data (tagihan_id, bukti_id, etc)
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'is_read']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
