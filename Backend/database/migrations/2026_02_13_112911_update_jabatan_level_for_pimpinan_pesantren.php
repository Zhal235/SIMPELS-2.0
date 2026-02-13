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
        Schema::table('jabatan', function (Blueprint $table) {
            // Allow level 0 for Pimpinan Pesantren and make department nullable
            $table->tinyInteger('level')->unsigned()->default(1)->comment('0 = Pimpinan Pesantren, 1 = tertinggi, 10 = terendah')->change();
            
            // Drop foreign key constraint temporarily
            $table->dropForeign(['department_id']);
            
            // Make department_id nullable for Pimpinan Pesantren  
            $table->foreignId('department_id')->nullable()->change();
            
            // Re-add foreign key constraint with nullable
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jabatan', function (Blueprint $table) {
            // Revert changes
            $table->dropForeign(['department_id']);
            $table->foreignId('department_id')->nullable(false)->change();
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->tinyInteger('level')->unsigned()->default(1)->comment('1 = tertinggi, 10 = terendah')->change();
        });
    }
};
