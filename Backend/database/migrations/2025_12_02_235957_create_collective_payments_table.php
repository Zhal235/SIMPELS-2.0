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
        Schema::create('collective_payments', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // "Iuran Ekskul Basket - Jan 2025"
            $table->text('description')->nullable();
            $table->decimal('amount_per_santri', 15, 2); // 10000
            $table->enum('target_type', ['individual', 'class', 'all'])->default('individual');
            $table->foreignId('class_id')->nullable()->constrained('kelas')->onDelete('set null');
            $table->integer('total_santri')->default(0); // 30
            $table->decimal('collected_amount', 15, 2)->default(0); // 200000
            $table->decimal('outstanding_amount', 15, 2)->default(0); // 100000
            $table->enum('status', ['active', 'completed'])->default('active');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collective_payments');
    }
};
