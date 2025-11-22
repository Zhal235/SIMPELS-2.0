<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /*
         * Komentar Teknis (Perubahan):
         * - Memindahkan seeding user ke UserSeeder terpisah untuk modularitas.
         * - Tidak ada perubahan logika bisnis; hanya penataan struktur seeder.
         * - UserSeeder akan membuat Admin dari ENV serta user demo via factory.
         */
        $this->call([
            UserSeeder::class,
            RoleSeeder::class,
            KelasSeeder::class,
            AsramaSeeder::class,
            SantriSeeder::class,
        ]);
    }
}
