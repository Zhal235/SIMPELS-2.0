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
                'dompet.dompet-santri',
                'dompet.manajemen-keuangan',
                'dompet.history',
                'dompet.laporan',
                'dompet.tagihan',
                'dompet.rfid',
                'dompet.withdrawals',
                'dompet.settings',
            ]
        ]);

        // Akademik role - akses ke kesantrian dan akademik dengan edit/hapus terbatas
        Role::updateOrCreate(['slug' => 'akademik'], [
            'name' => 'Akademik',
            'menus' => [
                'dashboard',
                'kesantrian.santri',
                'kesantrian.santri.view',
                'kesantrian.santri.create',
                'kesantrian.santri.update',
                'kesantrian.kelas',
                'kesantrian.kelas.view',
                'kesantrian.kelas.create',
                'kesantrian.kelas.update',
                'kesantrian.kelas.delete',
                'kesantrian.asrama',
                'kesantrian.asrama.view',
                'kesantrian.asrama.create',
                'kesantrian.asrama.update',
                'kesantrian.asrama.delete',
                'kesantrian.koreksi_data',
                'kesantrian.mutasi.masuk',
                'kesantrian.mutasi.keluar',
                'kesantrian.alumni',
                'akademik.tahun-ajaran',
                'akademik.tahun-ajaran.view',
                'akademik.tahun-ajaran.create',
                'akademik.tahun-ajaran.update',
                'akademik.tahun-ajaran.delete',
            ]
        ]);

        // Operator role - akses terbatas ke fitur operasional
        Role::updateOrCreate(['slug' => 'operator'], [
            'name' => 'Operator',
            'menus' => [
                'dashboard',
                'kesantrian.santri',
                'kesantrian.santri.view',
                'keuangan.pembayaran',
                'keuangan.pembayaran.view',
                'dompet.dompet-santri',
                'dompet.rfid',
                'dompet.withdrawals',
            ]
        ]);

        // Tata Usaha role - akses view only untuk kesantrian
        Role::updateOrCreate(['slug' => 'tata usaha'], [
            'name' => 'Tata Usaha',
            'menus' => [
                'dashboard',
                'kesantrian.santri',
                'kesantrian.santri.view',
                'kesantrian.kelas',
                'kesantrian.kelas.view',
                'kesantrian.asrama',
                'kesantrian.asrama.view',
            ]
        ]);
    }
}
