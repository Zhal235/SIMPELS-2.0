<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\KategoriPengeluaran;

class KategoriPengeluaranSeeder extends Seeder
{
    public function run()
    {
        $default = [
            'Gaji',
            'Operasional',
            'Pembelian ATK',
            'Perbaikan & Maintenance',
            'Transport',
            'Listrik & Utilitas',
            'Sumbangan & Bantuan',
        ];

        foreach ($default as $name) {
            KategoriPengeluaran::firstOrCreate([
                'name' => $name
            ], [
                'slug' => str()->slug($name)
            ]);
        }
    }
}
