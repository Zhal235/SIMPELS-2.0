<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Current TransaksiKas ===\n";
$transaksi = \App\Models\TransaksiKas::all();
foreach ($transaksi as $t) {
    echo $t->no_transaksi . " - " . $t->jenis . " - " . $t->tanggal . "\n";
}

echo "\n=== Test Generate ===\n";
echo "Pemasukan: " . \App\Models\TransaksiKas::generateNoTransaksi('pemasukan') . "\n";
echo "Pengeluaran: " . \App\Models\TransaksiKas::generateNoTransaksi('pengeluaran') . "\n";

echo "\n=== Check existing MSK-20251124 ===\n";
$existing = \App\Models\TransaksiKas::where('no_transaksi', 'LIKE', 'MSK-20251124-%')
    ->orderBy('no_transaksi', 'desc')
    ->get();
foreach ($existing as $e) {
    echo $e->no_transaksi . "\n";
}
