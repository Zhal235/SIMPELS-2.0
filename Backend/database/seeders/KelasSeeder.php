<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Kelas;

class KelasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Definisi kelas sesuai permintaan
        $data = [
            ['nama_kelas' => 'VIIA', 'tingkat' => 7, 'wali_kelas_id' => null],
            ['nama_kelas' => 'VIIB', 'tingkat' => 7, 'wali_kelas_id' => null],
            ['nama_kelas' => 'VIIIA', 'tingkat' => 8, 'wali_kelas_id' => null],
            ['nama_kelas' => 'VIIIB', 'tingkat' => 8, 'wali_kelas_id' => null],
            ['nama_kelas' => 'IXA', 'tingkat' => 9, 'wali_kelas_id' => null],
            ['nama_kelas' => 'IXB', 'tingkat' => 9, 'wali_kelas_id' => null],
        ];

        foreach ($data as $row) {
            Kelas::query()->firstOrCreate(
                ['nama_kelas' => $row['nama_kelas']],
                ['tingkat' => $row['tingkat'], 'wali_kelas_id' => $row['wali_kelas_id']]
            );
        }
    }
}