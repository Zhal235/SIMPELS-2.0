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
        Schema::create('bukti_transfer', function (Blueprint $table) {
            $table->id();
            $table->uuid('santri_id');
            $table->json('tagihan_ids'); // Array of tagihan IDs
            $table->decimal('total_nominal', 15, 2);
            $table->string('bukti_path');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('catatan_wali')->nullable();
            $table->text('catatan_admin')->nullable();
            $table->timestamp('uploaded_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('santri_id')->references('id')->on('santri')->onDelete('cascade');
            $table->foreign('processed_by')->references('id')->on('users')->onDelete('set null');
            
            // Indexes
            $table->index('santri_id');
            $table->index('status');
            $table->index('uploaded_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bukti_transfer');
    }
};
