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
         * Hanya UserSeeder yang dijalankan untuk testing dari awal.
         * Semua data master (santri, kelas, asrama, dll) akan dibuat manual via aplikasi.
         */
        $this->call([
            UserSeeder::class,
        ]);
    }
}
