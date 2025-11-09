<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Asrama;

class AsramaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ['nama_asrama' => 'Azzaini 1', 'wali_asrama' => null],
            ['nama_asrama' => 'Azzaini 2', 'wali_asrama' => null],
            ['nama_asrama' => 'Zainia 1', 'wali_asrama' => null],
            ['nama_asrama' => 'Zainia 2', 'wali_asrama' => null],
        ];

        foreach ($data as $row) {
            Asrama::query()->firstOrCreate(
                ['nama_asrama' => $row['nama_asrama']],
                ['wali_asrama' => $row['wali_asrama']]
            );
        }
    }
}