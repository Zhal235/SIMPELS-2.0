<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Santri;

// Test normalisasi HP
function normalizePhoneNumber($phone)
{
    // Hapus semua karakter non-digit
    $phone = preg_replace('/[^0-9]/', '', $phone);
    
    // Jika dimulai dengan 0, ganti dengan 62
    if (substr($phone, 0, 1) === '0') {
        $phone = '62' . substr($phone, 1);
    }
    
    // Jika belum ada 62 di depan, tambahkan
    if (substr($phone, 0, 2) !== '62') {
        $phone = '62' . $phone;
    }
    
    return $phone;
}

echo "=== TEST LOGIN DEBUG ===\n";

$inputHP = '085722549909';  // HP Ayah Abdul Latif
$normalizedHp = normalizePhoneNumber($inputHP);

echo "Input HP: $inputHP\n";
echo "Normalized HP: $normalizedHp\n\n";

// Cari santri dengan nama Abdul Latif
$santriAbdul = Santri::where('nama_santri', 'LIKE', '%ABDUL LATIF%')->first();

if ($santriAbdul) {
    echo "=== DATA SANTRI DITEMUKAN ===\n";
    echo "ID: " . $santriAbdul->id . "\n";
    echo "Nama: " . $santriAbdul->nama_santri . "\n";
    echo "HP Ayah: " . $santriAbdul->hp_ayah . "\n";
    echo "HP Ibu: " . $santriAbdul->hp_ibu . "\n";
    echo "Status: " . $santriAbdul->status . "\n\n";
    
    // Test query login seperti di WaliController
    echo "=== TEST QUERY LOGIN ===\n";
    
    $santriList = Santri::where(function($query) use ($normalizedHp, $inputHP) {
        $query->where('hp_ayah', 'LIKE', '%' . $normalizedHp . '%')
              ->orWhere('hp_ayah', 'LIKE', '%' . $inputHP . '%')
              ->orWhere('hp_ibu', 'LIKE', '%' . $normalizedHp . '%')
              ->orWhere('hp_ibu', 'LIKE', '%' . $inputHP . '%');
    })
    ->where('status', 'aktif')
    ->get();
    
    echo "Jumlah santri ditemukan dengan query login: " . $santriList->count() . "\n";
    
    foreach ($santriList as $santri) {
        echo "- " . $santri->nama_santri . " (HP Ayah: " . $santri->hp_ayah . ")\n";
    }
    
    if ($santriList->isEmpty()) {
        echo "\n=== DEBUGGING QUERY ===\n";
        
        // Test individual queries
        $test1 = Santri::where('hp_ayah', 'LIKE', '%' . $normalizedHp . '%')->count();
        $test2 = Santri::where('hp_ayah', 'LIKE', '%' . $inputHP . '%')->count();
        $test3 = Santri::where('hp_ibu', 'LIKE', '%' . $normalizedHp . '%')->count();
        $test4 = Santri::where('hp_ibu', 'LIKE', '%' . $inputHP . '%')->count();
        $test5 = Santri::where('status', 'aktif')->count();
        
        echo "Query 1 (hp_ayah LIKE '%$normalizedHp%'): $test1\n";
        echo "Query 2 (hp_ayah LIKE '%$inputHP%'): $test2\n";
        echo "Query 3 (hp_ibu LIKE '%$normalizedHp%'): $test3\n";
        echo "Query 4 (hp_ibu LIKE '%$inputHP%'): $test4\n";
        echo "Query 5 (status = 'aktif'): $test5\n";
        
        // Check Abdul Latif's status
        echo "\nStatus Abdul Latif: '" . $santriAbdul->status . "'\n";
        if ($santriAbdul->status !== 'aktif') {
            echo "❌ MASALAH: Status santri bukan 'aktif'\n";
        }
    }
    
} else {
    echo "❌ Santri Abdul Latif tidak ditemukan di database!\n";
}

echo "\n=== SELESAI ===\n";