<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class SantriFactory extends Factory
{
    protected $model = \App\Models\Santri::class;

    public function definition()
    {
        return [
            'id' => (string) Str::ulid(),
            'nis' => $this->faker->unique()->numerify('S-#####'),
            'nisn' => $this->faker->numerify('NISN-####'),
            'nik_santri' => $this->faker->numerify('NIK-########'),
            'nama_santri' => $this->faker->name(),
            'tempat_lahir' => $this->faker->city(),
            'tanggal_lahir' => $this->faker->date('Y-m-d', '-10 years'),
            'jenis_kelamin' => $this->faker->randomElement(['L', 'P']),
            'kelas_id' => null,
            'asrama_id' => null,
            'asal_sekolah' => $this->faker->company(),
            'hobi' => 'Olahraga',
            'cita_cita' => 'Insinyur',
            'jumlah_saudara' => $this->faker->numberBetween(0, 4),
            'alamat' => $this->faker->address(),
            'provinsi' => 'Jawa Barat',
            'kabupaten' => 'Bandung',
            'kecamatan' => 'Coblong',
            'desa' => 'Dago',
            'kode_pos' => '40135',
            'no_kk' => $this->faker->numerify('KK#########'),
            'nama_ayah' => $this->faker->name('male'),
            'nik_ayah' => $this->faker->numerify('NIK########'),
            'pendidikan_ayah' => 'SMA',
            'pekerjaan_ayah' => 'Karyawan',
            'hp_ayah' => $this->faker->phoneNumber(),
            'nama_ibu' => $this->faker->name('female'),
            'nik_ibu' => $this->faker->numerify('NIK########'),
            'pendidikan_ibu' => 'SMA',
            'pekerjaan_ibu' => 'Ibu Rumah Tangga',
            'hp_ibu' => $this->faker->phoneNumber(),
        ];
    }
}
