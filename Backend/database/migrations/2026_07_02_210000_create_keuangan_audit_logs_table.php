<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keuangan_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100);
            $table->string('entity', 100)->default('tagihan_santri');
            $table->json('filters')->nullable();
            $table->json('result')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 1024)->nullable();
            $table->timestamps();

            $table->index(['action', 'created_at']);
            $table->index(['entity', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('keuangan_audit_logs');
    }
};
