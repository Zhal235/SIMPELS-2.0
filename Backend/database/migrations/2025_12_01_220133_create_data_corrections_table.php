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
        Schema::create('data_corrections', function (Blueprint $table) {
            $table->id();
            $table->string('santri_id');
            $table->string('field_name'); // Nama field yang dikoreksi
            $table->text('old_value'); // Nilai lama
            $table->text('new_value'); // Nilai baru yang diusulkan
            $table->text('note')->nullable(); // Catatan dari wali
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('requested_by'); // 'wali' or 'admin'
            $table->text('admin_note')->nullable(); // Catatan dari admin
            $table->unsignedBigInteger('approved_by')->nullable(); // Admin yang approve
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index('santri_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('data_corrections');
    }
};
