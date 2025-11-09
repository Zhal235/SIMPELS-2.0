<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Santri;
use App\Models\Kelas;
use App\Models\Asrama;

class SantriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan kelas & asrama sudah ada
        $kelasList = Kelas::query()->whereIn('nama_kelas', ['VIIA','VIIB','VIIIA','VIIIB','IXA','IXB'])->get();
        $asramaList = Asrama::query()->whereIn('nama_asrama', ['Azzaini 1','Azzaini 2','Zainia 1','Zainia 2'])->get();

        // Jika belum ada, buat dulu agar seeder ini mandiri
        if ($kelasList->count() === 0) {
            $this->call(\Database\Seeders\KelasSeeder::class);
            $kelasList = Kelas::query()->whereIn('nama_kelas', ['VIIA','VIIB','VIIIA','VIIIB','IXA','IXB'])->get();
        }
        if ($asramaList->count() === 0) {
            $this->call(\Database\Seeders\AsramaSeeder::class);
            $asramaList = Asrama::query()->whereIn('nama_asrama', ['Azzaini 1','Azzaini 2','Zainia 1','Zainia 2'])->get();
        }

        // Nama-nama contoh (Indonesia) untuk santri
        $maleFirstNames = ['Ahmad','Budi','Dimas','Fajar','Gilang','Hafidz','Iqbal','Johan','Khalid','Lutfi','Mika','Naufal','Omar','Pandu','Qasim','Rafi','Surya','Taufik','Umar','Vino','Wahyu','Yusuf','Zaki','Rizky','Andi'];
        $femaleFirstNames = ['Aisyah','Bella','Citra','Dewi','Eka','Farah','Gita','Hana','Intan','Jihan','Kirana','Laila','Maya','Nadia','Ovi','Putri','Qaira','Rani','Salsa','Tania','Utami','Vina','Wulan','Yuni','Zahra'];
        $lastNames = ['Putra','Saputra','Pratama','Anggara','Maulana','Ramadhan','Nur','Salsabila','Kartika','Puspita','Hidayat','Pratami','Wibowo','Hakim','Fadilah','Anjani','Permata','Kusuma','Fakhri','Siregar'];

        $total = 50; // 25 laki-laki, 25 perempuan
        $maleCount = 25;
        $femaleCount = 25;

        $rows = [];
        for ($i = 0; $i < $maleCount; $i++) {
            $fn = $maleFirstNames[$i % count($maleFirstNames)];
            $ln = $lastNames[$i % count($lastNames)];
            $rows[] = [
                'nama_santri' => "$fn $ln",
                'jenis_kelamin' => 'L',
            ];
        }
        for ($i = 0; $i < $femaleCount; $i++) {
            $fn = $femaleFirstNames[$i % count($femaleFirstNames)];
            $ln = $lastNames[$i % count($lastNames)];
            $rows[] = [
                'nama_santri' => "$fn $ln",
                'jenis_kelamin' => 'P',
            ];
        }

        // Distribusi ke kelas & asrama secara merata
        $kelasIds = $kelasList->pluck('id')->values()->all();
        $kelasMap = $kelasList->mapWithKeys(fn($k) => [$k->id => $k->nama_kelas])->all();
        $asramaIds = $asramaList->pluck('id')->values()->all();
        $asramaMap = $asramaList->mapWithKeys(fn($a) => [$a->id => $a->nama_asrama])->all();

        foreach ($rows as $idx => $r) {
            $kelasId = $kelasIds ? $kelasIds[$idx % count($kelasIds)] : null;
            $kelasNama = $kelasId ? ($kelasMap[$kelasId] ?? null) : null;
            $asramaId = $asramaIds ? $asramaIds[$idx % count($asramaIds)] : null;
            $asramaNama = $asramaId ? ($asramaMap[$asramaId] ?? null) : null;

            // Generate NIS & NISN unik
            $nis = str_pad((string) (70000000 + $idx + 1), 8, '0', STR_PAD_LEFT);
            $nisn = str_pad((string) (1000000000 + $idx + 1), 10, '0', STR_PAD_LEFT);

            // Tanggal lahir acak antar 2007-2011
            $year = 2007 + ($idx % 5);
            $month = str_pad((string) (1 + ($idx % 12)), 2, '0', STR_PAD_LEFT);
            $day = str_pad((string) (1 + ($idx % 28)), 2, '0', STR_PAD_LEFT);

            $parts = explode(' ', $r['nama_santri']);
            $last = trim($parts[count($parts) - 1] ?? 'Nusantara');

            Santri::query()->firstOrCreate([
                'nis' => $nis,
            ], [
                // id akan diisi otomatis oleh HasUuids
                'nisn' => $nisn,
                'nik_santri' => (string) (3200000000000000 + $idx + 1),
                'nama_santri' => $r['nama_santri'],
                'tempat_lahir' => 'Bandung',
                'tanggal_lahir' => "$year-$month-$day",
                'jenis_kelamin' => $r['jenis_kelamin'],
                'kelas_id' => $kelasId,
                'kelas_nama' => $kelasNama,
                'asrama_id' => $asramaId,
                'asrama_nama' => $asramaNama,
                'asal_sekolah' => 'SMP Negeri 1',
                'hobi' => 'Membaca',
                'cita_cita' => 'Dokter',
                'jumlah_saudara' => ($idx % 3) + 1,
                'alamat' => 'Jl. Merdeka No. 1',
                'provinsi' => 'Jawa Barat',
                'kabupaten' => 'Bandung',
                'kecamatan' => 'Coblong',
                'desa' => 'Dago',
                'kode_pos' => '40135',
                'no_kk' => (string) (3200123456789000 + $idx + 1),
                'nama_ayah' => 'Bapak ' . $last,
                'nik_ayah' => (string) (3200000000000000 + $idx + 100),
                'pendidikan_ayah' => 'SMA',
                'pekerjaan_ayah' => 'Karyawan',
                'hp_ayah' => '0812345678' . str_pad((string) $idx, 2, '0', STR_PAD_LEFT),
                'nama_ibu' => 'Ibu ' . $last,
                'nik_ibu' => (string) (3200000000000000 + $idx + 200),
                'pendidikan_ibu' => 'SMA',
                'pekerjaan_ibu' => 'Ibu Rumah Tangga',
                'hp_ibu' => '0812345679' . str_pad((string) $idx, 2, '0', STR_PAD_LEFT),
                'foto' => null,
            ]);
        }
    }
}