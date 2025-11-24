<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BukuKas;
use App\Models\TransaksiKas;

class TestTransaksiSeeder extends Seeder
{
    public function run(): void
    {
        $bukuKas = BukuKas::first();
        
        if (!$bukuKas) {
            $bukuKas = BukuKas::create([
                'nama_kas' => 'Kas Utama',
                'saldo_cash_awal' => 1000000,
                'saldo_bank_awal' => 5000000
            ]);
        }

        // Hapus transaksi test lama
        TransaksiKas::where('keterangan', 'like', '%Test%')->delete();

        // Tambah data sample
        $count = 0;
        for ($i = 1; $i <= 10; $i++) {
            $count++;
            TransaksiKas::create([
                'buku_kas_id' => $bukuKas->id,
                'no_transaksi' => 'MSK-' . date('Ymd') . '-' . str_pad($count, 5, '0', STR_PAD_LEFT),
                'tanggal' => date('Y-m-d', strtotime("-{$i} days")),
                'jenis' => 'pemasukan',
                'metode' => $i % 2 == 0 ? 'transfer' : 'cash',
                'kategori' => 'Pembayaran SPP',
                'nominal' => rand(300000, 800000),
                'keterangan' => 'Test data pemasukan ' . $i
            ]);

            $count++;
            TransaksiKas::create([
                'buku_kas_id' => $bukuKas->id,
                'no_transaksi' => 'KLR-' . date('Ymd') . '-' . str_pad($count, 5, '0', STR_PAD_LEFT),
                'tanggal' => date('Y-m-d', strtotime("-{$i} days")),
                'jenis' => 'pengeluaran',
                'metode' => $i % 3 == 0 ? 'transfer' : 'cash',
                'kategori' => $i % 3 == 0 ? 'Gaji' : ($i % 3 == 1 ? 'Belanja' : 'Listrik'),
                'nominal' => rand(100000, 500000),
                'keterangan' => 'Test data pengeluaran ' . $i
            ]);
        }

        $this->command->info('✅ Berhasil menambahkan ' . (10 * 2) . ' transaksi test');
    }
}
