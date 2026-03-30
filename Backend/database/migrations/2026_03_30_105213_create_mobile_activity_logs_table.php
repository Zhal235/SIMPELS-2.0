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
        Schema::create('mobile_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('no_hp', 20)->index(); // Nomor HP wali
            $table->unsignedBigInteger('santri_id')->nullable()->index(); // ID santri yang diakses
            $table->string('action', 100)->index(); // Nama action: login, view_saldo, view_tagihan, etc
            $table->string('feature', 50)->nullable()->index(); // Kategori: dashboard, pembayaran, tabungan, etc
            $table->string('endpoint', 255)->nullable(); // API endpoint yang diakses
            $table->string('method', 10)->nullable(); // GET, POST, etc
            $table->string('device', 50)->nullable(); // Android, iOS, etc
            $table->string('device_model', 100)->nullable(); // Device model jika ada
            $table->string('app_version', 20)->nullable(); // Versi aplikasi mobile
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->integer('response_time')->nullable(); // Response time in ms
            $table->string('status_code', 10)->nullable(); // HTTP status code
            $table->timestamps();
            
            // Index for common queries
            $table->index('created_at');
            $table->index(['no_hp', 'created_at']);
            $table->index(['action', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mobile_activity_logs');
    }
};
