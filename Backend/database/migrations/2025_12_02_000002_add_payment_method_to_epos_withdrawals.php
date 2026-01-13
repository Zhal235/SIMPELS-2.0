<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('epos_withdrawals', function (Blueprint $table) {
            $table->enum('payment_method', ['cash', 'transfer'])->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('epos_withdrawals', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });
    }
};
