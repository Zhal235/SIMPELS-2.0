<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Testing API Response Structure ===\n\n";

// Test tagihan santri endpoint
echo "1. Tagihan Santri Endpoint:\n";
$tagihan = DB::table('tagihan_santri')
    ->join('santri', 'tagihan_santri.santri_id', '=', 'santri.id')
    ->join('kelas', 'santri.kelas_id', '=', 'kelas.id')
    ->select(
        'santri.id as santri_id',
        'santri.nis as santri_nis',
        'santri.nama_santri as santri_nama',
        'kelas.nama_kelas as kelas'
    )
    ->whereNull('tagihan_santri.deleted_at')
    ->groupBy('santri.id', 'santri.nis', 'santri.nama_santri', 'kelas.nama_kelas')
    ->limit(1)
    ->first();

if ($tagihan) {
    echo "Sample data:\n";
    print_r($tagihan);
}

// Test jenis tagihan
echo "\n2. Jenis Tagihan:\n";
$jenisTagihan = \App\Models\JenisTagihan::all(['id', 'nama_tagihan']);
echo "Found: " . $jenisTagihan->count() . " jenis tagihan\n";
foreach ($jenisTagihan as $jt) {
    echo "  - ID: {$jt->id}, Nama: {$jt->nama_tagihan}\n";
}
