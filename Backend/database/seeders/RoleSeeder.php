<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // default admin can access everything (menus null == full access)
        Role::updateOrCreate(['slug' => 'admin'], ['name' => 'Admin', 'menus' => null]);

        // Keuangan role - akses ke semua fitur keuangan termasuk edit/hapus
        Role::updateOrCreate(['slug' => 'keuangan'], [
            'name' => 'Keuangan',
            'menus' => [
                'dashboard',
                'keuangan.pembayaran',
                'keuangan.pembayaran.view',
                'keuangan.pembayaran.edit',
                'keuangan.pembayaran.delete',
                'keuangan.transaksi-kas',
                'keuangan.transaksi-kas.view',
                'keuangan.transaksi-kas.edit',
                'keuangan.transaksi-kas.delete',
                'keuangan.buku-kas',
                'keuangan.buku-kas.view',
                'keuangan.buku-kas.edit',
                'keuangan.buku-kas.delete',
                'keuangan.laporan',
                'keuangan.tagihan',
                'keuangan.tagihan.view',
                'keuangan.tagihan.edit',
                'keuangan.tagihan.delete',
                'keuangan.bukti-transfer',
                'keuangan.rekening-bank',
                'keuangan.rekening-bank.view',
                'keuangan.rekening-bank.edit',
                'keuangan.rekening-bank.delete',
                'keuangan.tunggakan',
                'keuangan.pengaturan',
            ]
        ]);

        // Akademik role - akses ke kesantrian dan akademik dengan edit/hapus terbatas
        Role::updateOrCreate(['slug' => 'akademik'], [
            'name' => 'Akademik',
            'menus' => [
                'dashboard',
                'kesantrian.santri',
                'kesantrian.santri.edit',
                'kesantrian.kelas',
                'kesantrian.kelas.edit',
                'kesantrian.kelas.delete',
                'kesantrian.asrama',
                'kesantrian.asrama.edit',
                'kesantrian.asrama.delete',
                'kesantrian.koreksi_data',
                'kesantrian.mutasi.masuk',
                'kesantrian.mutasi.keluar',
                'kesantrian.alumni',
                'akademik.tahun-ajaran',
                'akademik.tahun-ajaran.edit',
                'akademik.tahun-ajaran.delete',
            ]
        ]);

        // Operator role - akses terbatas ke fitur operasional
        Role::updateOrCreate(['slug' => 'operator'], [
            'name' => 'Operator',
            'menus' => [
                'dashboard',
                'kesantrian.santri',
                'keuangan.pembayaran',
                'dompet.dompet-santri',
                'dompet.rfid',
            ]
        ]);
    }
}
