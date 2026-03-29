<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('fcm_tokens')) {
            Schema::create('fcm_tokens', function (Blueprint $table) {
                $table->id();
                $table->string('santri_id', 36); // UUID
                $table->string('fcm_token', 500)->unique();
                $table->string('device_type')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();

                $table->index(['santri_id', 'fcm_token']);
            });
        } else {
            // Fix existing table: change santri_id from bigint to varchar(36) for UUID
            $columns = Schema::getColumnListing('fcm_tokens');
            if (in_array('santri_id', $columns)) {
                $type = DB::select("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'fcm_tokens' AND COLUMN_NAME = 'santri_id' AND TABLE_SCHEMA = DATABASE()");
                if (!empty($type) && stripos($type[0]->COLUMN_TYPE, 'varchar') === false) {
                    DB::statement('ALTER TABLE fcm_tokens MODIFY COLUMN santri_id varchar(36) NOT NULL');
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fcm_tokens');
    }
};
