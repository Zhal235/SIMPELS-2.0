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
        Schema::table('bukti_transfer', function (Blueprint $table) {
            $table->foreignId('selected_bank_id')->nullable()->after('santri_id')->constrained('bank_accounts')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bukti_transfer', function (Blueprint $table) {
            $table->dropForeign(['selected_bank_id']);
            $table->dropColumn('selected_bank_id');
        });
    }
};
