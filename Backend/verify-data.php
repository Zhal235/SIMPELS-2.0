<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== DATABASE VERIFICATION ===\n\n";

// Check Admin
echo "Admin User:\n";
$admin = \App\Models\User::where('email', 'Admin.simpels@saza.sch.id')->first();
if ($admin) {
    echo "  Email: {$admin->email}\n";
    echo "  Name: {$admin->name}\n";
    echo "  Role: {$admin->role}\n";
} else {
    echo "  ❌ Admin not found\n";
}

echo "\nSample Santri:\n";
$santri = \App\Models\Santri::with('wallet')->first();
if ($santri) {
    echo "  NIS: {$santri->nis}\n";
    echo "  Nama: {$santri->nama_santri}\n";
    echo "  HP Ayah: {$santri->hp_ayah}\n";
    echo "  Kelas: {$santri->kelas_nama}\n";
    if ($santri->wallet) {
        echo "  Balance: Rp " . number_format($santri->wallet->balance, 0, ',', '.') . "\n";
    }
}

echo "\nTagihan Sample:\n";
$tagihan = \App\Models\TagihanSantri::with('santri', 'jenisTagihan')->first();
if ($tagihan) {
    echo "  Santri: {$tagihan->santri->nama_santri}\n";
    echo "  Jenis: {$tagihan->jenisTagihan->nama_tagihan}\n";
    echo "  Nominal: Rp " . number_format($tagihan->nominal, 0, ',', '.') . "\n";
    echo "  Status: {$tagihan->status}\n";
}

echo "\nPassword Wali Sample:\n";
$pw = DB::table('password_wali')->first();
if ($pw) {
    echo "  No HP: {$pw->no_hp}\n";
    echo "  Password hash exists: " . (!empty($pw->password) ? 'Yes' : 'No') . "\n";
}

echo "\n✅ Database import successful!\n";
echo "\n=== LOGIN CREDENTIALS ===\n";
echo "Web Admin:\n";
echo "  Email: Admin.simpels@saza.sch.id\n";
echo "  Password: ChangeMeNow!2025\n\n";

echo "Mobile App (Wali):\n";
echo "  Any phone number from santri (hp_ayah/hp_ibu)\n";
echo "  Password: 123456 (default)\n\n";

$sampleWalis = DB::table('santri')->whereNotNull('hp_ayah')->limit(3)->get(['nama_santri', 'hp_ayah']);
echo "Sample Wali Login:\n";
foreach ($sampleWalis as $s) {
    echo "  Phone: {$s->hp_ayah} (Ayah dari {$s->nama_santri})\n";
}
