<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wa_message_templates', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['tagihan_detail', 'reminder', 'rekap_tunggakan', 'pengumuman'])->unique();
            $table->text('body');
            $table->json('placeholders'); // [{key, desc, required}]
            $table->string('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wa_message_templates');
    }
};
