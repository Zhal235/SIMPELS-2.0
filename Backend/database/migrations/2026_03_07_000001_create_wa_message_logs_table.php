<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wa_message_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('recipient_type', ['wali', 'pegawai']);
            $table->string('recipient_id')->nullable();
            $table->string('phone', 20);
            $table->enum('message_type', ['reminder', 'tagihan_detail', 'pengumuman', 'custom']);
            $table->text('message_body');
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
            $table->text('error_reason')->nullable();
            $table->unsignedTinyInteger('retry_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['recipient_type', 'recipient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wa_message_logs');
    }
};
