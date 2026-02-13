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
        Schema::create('jabatan', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100);
            $table->string('kode', 10)->unique();
            $table->tinyInteger('level')->unsigned()->default(1)->comment('1 = tertinggi, 10 = terendah');
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->foreignId('parent_id')->nullable()->constrained('jabatan')->onDelete('set null');
            $table->text('deskripsi')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes untuk performance
            $table->index(['department_id', 'level']);
            $table->index('parent_id');
            
            // Unique constraint untuk nama jabatan dalam department yang sama
            $table->unique(['nama', 'department_id', 'deleted_at'], 'jabatan_nama_department_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jabatan');
    }
};
