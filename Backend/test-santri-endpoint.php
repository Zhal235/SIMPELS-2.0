<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== TEST SANTRI CREATE ENDPOINT ===\n\n";

// Get admin user
$admin = \App\Models\User::where('email', 'Admin.simpels@saza.sch.id')->first();
if (!$admin) {
    echo "❌ Admin user not found\n";
    exit(1);
}

// Create token
$token = $admin->createToken('test-token')->plainTextToken;
echo "✅ Token created for admin\n\n";

// Test data (missing required fields to trigger validation)
$testCases = [
    [
        'name' => 'Missing required fields',
        'data' => [
            'nama_santri' => 'Test Santri',
        ]
    ],
    [
        'name' => 'Invalid jenis_kelamin',
        'data' => [
            'nis' => '9999999999',
            'nama_santri' => 'Test Santri',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '2010-01-01',
            'jenis_kelamin' => 'X', // Invalid: should be L or P
            'alamat' => 'Test Address',
            'nama_ayah' => 'Test Ayah',
            'nama_ibu' => 'Test Ibu',
        ]
    ],
    [
        'name' => 'Valid data',
        'data' => [
            'nis' => '9999999999',
            'nama_santri' => 'Test Santri',
            'tempat_lahir' => 'Jakarta',
            'tanggal_lahir' => '2010-01-01',
            'jenis_kelamin' => 'L',
            'alamat' => 'Test Address',
            'nama_ayah' => 'Test Ayah',
            'nama_ibu' => 'Test Ibu',
        ]
    ],
];

foreach ($testCases as $test) {
    echo "Test: {$test['name']}\n";
    echo str_repeat('-', 50) . "\n";
    
    // Simulate request
    $request = Request::create(
        '/api/v1/kesantrian/santri',
        'POST',
        $test['data']
    );
    
    $request->headers->set('Authorization', 'Bearer ' . $token);
    
    try {
        $controller = new \App\Http\Controllers\Kesantrian\SantriController();
        $response = $controller->store($request);
        
        $content = json_decode($response->getContent(), true);
        echo "Status Code: " . $response->getStatusCode() . "\n";
        echo "Response:\n";
        print_r($content);
    } catch (\Exception $e) {
        echo "❌ Exception: " . $e->getMessage() . "\n";
    }
    
    echo "\n\n";
}

echo "=== VALIDATION RULES ===\n";
echo "Required fields:\n";
echo "  - nis (required, unique)\n";
echo "  - nama_santri (required)\n";
echo "  - tempat_lahir (required)\n";
echo "  - tanggal_lahir (required, date format)\n";
echo "  - jenis_kelamin (required, L or P)\n";
echo "  - alamat (required)\n";
echo "  - nama_ayah (required)\n";
echo "  - nama_ibu (required)\n\n";

echo "Optional fields:\n";
echo "  - nisn, nik_santri, kelas_id, asrama_id, etc.\n\n";

// Check if NIS exists
$existingNIS = DB::table('santri')->pluck('nis')->take(5)->toArray();
echo "Sample existing NIS (to avoid duplicates):\n";
foreach ($existingNIS as $nis) {
    echo "  - {$nis}\n";
}
