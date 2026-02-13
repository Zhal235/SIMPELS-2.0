<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Jabatan;

class DepartmentAndJabatanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Departments
        $akademik = Department::create([
            'nama' => 'Akademik',
            'kode' => 'AKAD',
            'deskripsi' => 'Bidang Akademik dan Pembelajaran'
        ]);

        $keuangan = Department::create([
            'nama' => 'Keuangan',
            'kode' => 'KEU',
            'deskripsi' => 'Bidang Keuangan dan Administrasi'
        ]);

        $kesantrian = Department::create([
            'nama' => 'Kesantrian',
            'kode' => 'SANT',
            'deskripsi' => 'Bidang Kesantrian dan Asrama'
        ]);

        $administrasi = Department::create([
            'nama' => 'Administrasi',
            'kode' => 'ADM',
            'deskripsi' => 'Bidang Administrasi Umum'
        ]);

        // Create Pimpinan Pesantren (Level 0, no department)
        $pimpinanPesantren = Jabatan::create([
            'nama' => 'Pimpinan Pesantren',
            'kode' => 'PP',
            'level' => 0,
            'department_id' => null, // Tidak ada department
            'deskripsi' => 'Pimpinan tertinggi pesantren yang membawahi semua department'
        ]);

        // Create Jabatan for Akademik department
        $kepalaSekolah = Jabatan::create([
            'nama' => 'Kepala Sekolah',
            'kode' => 'KS',
            'level' => 1,
            'department_id' => $akademik->id,
            'parent_id' => $pimpinanPesantren->id,
            'deskripsi' => 'Pimpinan bidang akademik'
        ]);

        $wakilKepala = Jabatan::create([
            'nama' => 'Wakil Kepala Sekolah',
            'kode' => 'WKS',
            'level' => 2,
            'department_id' => $akademik->id,
            'parent_id' => $kepalaSekolah->id,
            'deskripsi' => 'Wakil pimpinan sekolah'
        ]);

        Jabatan::create([
            'nama' => 'Guru Mapel',
            'kode' => 'GM',
            'level' => 3,
            'department_id' => $akademik->id,
            'parent_id' => $wakilKepala->id,
            'deskripsi' => 'Guru mata pelajaran'
        ]);

        Jabatan::create([
            'nama' => 'Wali Kelas',
            'kode' => 'WK',
            'level' => 3,
            'department_id' => $akademik->id,
            'parent_id' => $wakilKepala->id,
            'deskripsi' => 'Wali kelas santri'
        ]);

        // Create Jabatan for Keuangan department
        $kepalaKeuangan = Jabatan::create([
            'nama' => 'Kepala Keuangan',
            'kode' => 'KK',
            'level' => 1,
            'department_id' => $keuangan->id,
            'parent_id' => $pimpinanPesantren->id,
            'deskripsi' => 'Pimpinan bidang keuangan'
        ]);

        Jabatan::create([
            'nama' => 'Staff Keuangan',
            'kode' => 'SK',
            'level' => 2,
            'department_id' => $keuangan->id,
            'parent_id' => $kepalaKeuangan->id,
            'deskripsi' => 'Staff administrasi keuangan'
        ]);

        Jabatan::create([
            'nama' => 'Bendahara',
            'kode' => 'BEND',
            'level' => 2,
            'department_id' => $keuangan->id,
            'parent_id' => $kepalaKeuangan->id,
            'deskripsi' => 'Bendahara sekolah'
        ]);

        // Create Jabatan for Kesantrian department
        $kepalaSantri = Jabatan::create([
            'nama' => 'Kepala Kesantrian',
            'kode' => 'KSANT',
            'level' => 1,
            'department_id' => $kesantrian->id,
            'parent_id' => $pimpinanPesantren->id,
            'deskripsi' => 'Pimpinan bidang kesantrian'
        ]);

        Jabatan::create([
            'nama' => 'Musyrif',
            'kode' => 'MUSY',
            'level' => 2,
            'department_id' => $kesantrian->id,
            'parent_id' => $kepalaSantri->id,
            'deskripsi' => 'Pembina asrama'
        ]);

        Jabatan::create([
            'nama' => 'Security',
            'kode' => 'SEC',
            'level' => 3,
            'department_id' => $kesantrian->id,
            'parent_id' => $kepalaSantri->id,
            'deskripsi' => 'Petugas keamanan'
        ]);

        // Create Jabatan for Administrasi department  
        $kepalaTU = Jabatan::create([
            'nama' => 'Kepala Tata Usaha',
            'kode' => 'KTU',
            'level' => 1,
            'department_id' => $administrasi->id,
            'parent_id' => $pimpinanPesantren->id,
            'deskripsi' => 'Pimpinan tata usaha'
        ]);

        Jabatan::create([
            'nama' => 'Staff Administrasi',
            'kode' => 'SADM',
            'level' => 2,
            'department_id' => $administrasi->id,
            'parent_id' => $kepalaTU->id,
            'deskripsi' => 'Staff administrasi umum'
        ]);

        Jabatan::create([
            'nama' => 'Cleaning Service',
            'kode' => 'CS',
            'level' => 3,
            'department_id' => $administrasi->id,
            'parent_id' => $kepalaTU->id,
            'deskripsi' => 'Petugas kebersihan'
        ]);
    }
}