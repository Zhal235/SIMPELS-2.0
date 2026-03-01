<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            // Simpan nilai asli sebelum diedit (audit trail tanpa tabel terpisah)
            $table->decimal('original_amount', 15, 2)->nullable()->after('amount');
            $table->string('original_method', 50)->nullable()->after('method');
            $table->text('original_description')->nullable()->after('description');
            $table->timestamp('edited_at')->nullable()->after('voided_by');
            $table->unsignedBigInteger('edited_by')->nullable()->after('edited_at');
            // Alasan void wajib diisi admin
            $table->string('void_reason', 255)->nullable()->after('edited_by');

            $table->foreign('edited_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('wallet_transactions', function (Blueprint $table) {
            $table->dropForeign(['edited_by']);
            $table->dropColumn([
                'original_amount', 'original_method', 'original_description',
                'edited_at', 'edited_by', 'void_reason',
            ]);
        });
    }
};
