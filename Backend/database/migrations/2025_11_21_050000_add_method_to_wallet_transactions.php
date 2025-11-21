<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('wallet_transactions')) return;

        Schema::table('wallet_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('wallet_transactions', 'method')) {
                $table->enum('method', ['cash', 'transfer'])->nullable()->after('type');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('wallet_transactions')) return;

        Schema::table('wallet_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('wallet_transactions', 'method')) {
                $table->dropColumn('method');
            }
        });
    }
};
