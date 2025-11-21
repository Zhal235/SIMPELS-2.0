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
            if (!Schema::hasColumn('wallet_transactions', 'voided')) {
                $table->boolean('voided')->default(false)->after('method');
            }
            if (!Schema::hasColumn('wallet_transactions', 'voided_by')) {
                $table->unsignedBigInteger('voided_by')->nullable()->after('voided');
                $table->foreign('voided_by')->references('id')->on('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('wallet_transactions', 'reversed_of')) {
                $table->unsignedBigInteger('reversed_of')->nullable()->after('voided_by');
                $table->foreign('reversed_of')->references('id')->on('wallet_transactions')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('wallet_transactions')) return;

        Schema::table('wallet_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('wallet_transactions', 'reversed_of')) $table->dropForeign(['reversed_of']);
            if (Schema::hasColumn('wallet_transactions', 'voided_by')) $table->dropForeign(['voided_by']);
            if (Schema::hasColumn('wallet_transactions', 'reversed_of')) $table->dropColumn('reversed_of');
            if (Schema::hasColumn('wallet_transactions', 'voided_by')) $table->dropColumn('voided_by');
            if (Schema::hasColumn('wallet_transactions', 'voided')) $table->dropColumn('voided');
        });
    }
};
