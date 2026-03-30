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
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_mobile_login_at')->nullable()->after('remember_token');
            $table->integer('mobile_login_count')->default(0)->after('last_mobile_login_at');
            $table->string('last_mobile_device')->nullable()->after('mobile_login_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['last_mobile_login_at', 'mobile_login_count', 'last_mobile_device']);
        });
    }
};
