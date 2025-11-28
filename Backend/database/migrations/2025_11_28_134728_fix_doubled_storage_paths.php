<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix foto paths with doubled 'storage/' prefix
        DB::table('santri')
            ->whereNotNull('foto')
            ->where('foto', 'like', 'storage/storage/%')
            ->update([
                'foto' => DB::raw("SUBSTRING(foto, 9)")  // Remove first 8 chars ('storage/')
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse: add back the 'storage/' prefix if needed
        DB::table('santri')
            ->whereNotNull('foto')
            ->where('foto', 'not like', 'storage/%')
            ->where('foto', 'like', 'foto%')
            ->update([
                'foto' => DB::raw("CONCAT('storage/', foto)")
            ]);
    }
};
