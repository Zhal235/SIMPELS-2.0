<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('santri_tabungan', function (Blueprint $table) {
            $table->id();
            $table->uuid('santri_id')->unique();
            $table->decimal('saldo', 15, 2)->default(0);
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->date('opened_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('santri_id')->references('id')->on('santri')->onDelete('cascade');
            $table->index(['santri_id']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('santri_tabungan');
    }
};
