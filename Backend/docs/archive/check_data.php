<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Sample Santri ===\n";
$santri = \App\Models\Santri::first();
if ($santri) {
    print_r($santri->toArray());
}

echo "\n=== Sample Jenis Tagihan ===\n";
$jenisTagihan = \App\Models\JenisTagihan::all();
foreach ($jenisTagihan as $jt) {
    echo "ID: {$jt->id}, Nama: {$jt->nama_tagihan}\n";
}
