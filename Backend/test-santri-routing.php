<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$admin = \App\Models\User::where('email', 'Admin.simpels@saza.sch.id')->first();
$token = $admin->createToken('test-routing')->plainTextToken;

$base = 'http://localhost:8001/api/v1/kesantrian/santri';
$headers = ['Authorization: Bearer ' . $token, 'Accept: application/json', 'Content-Type: application/json'];

function curlGet(string $url, array $headers): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($body, true)];
}

function curlPost(string $url, array $headers, array $data): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => $headers,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($body, true)];
}

function curlPut(string $url, array $headers, array $data): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => $headers,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($body, true)];
}

function curlDelete(string $url, array $headers): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => 'DELETE', CURLOPT_HTTPHEADER => $headers]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($body, true)];
}

function pass(string $msg): void { echo "  ✅ $msg\n"; }
function fail(string $msg): void { echo "  ❌ $msg\n"; }
function check(string $label, int $code, int $expected): void {
    ($code === $expected) ? pass("$label → HTTP $code") : fail("$label → HTTP $code (expected $expected)");
}

echo "=== ROUTING VERIFICATION: /api/v1/kesantrian/santri ===\n\n";

// 1. GET list
echo "1. GET /api/v1/kesantrian/santri\n";
$r = curlGet($base, $headers);
check('List santri', $r['code'], 200);
if ($r['code'] === 200) {
    $total = $r['body']['total'] ?? 0;
    pass("Total santri: $total");
} else {
    fail("Response: " . json_encode($r['body']));
}

// 2. GET list with filters
echo "\n2. GET with filters (?q=Ahmad&kelas_id=1&status=aktif)\n";
$r = curlGet($base . '?q=Ahmad&status=aktif&perPage=5', $headers);
check('List with filters', $r['code'], 200);
if ($r['code'] === 200) pass("Filtered count: " . count($r['body']['data'] ?? []));

// 3. POST create (valid)
echo "\n3. POST /api/v1/kesantrian/santri (create valid)\n";
$testNis = 'TEST-' . time();
$r = curlPost($base, $headers, [
    'nis' => $testNis,
    'nama_santri' => 'Test Santri Routing',
    'tempat_lahir' => 'Jakarta',
    'tanggal_lahir' => '2010-06-15',
    'jenis_kelamin' => 'L',
    'alamat' => 'Jl. Test Routing No. 1',
    'nama_ayah' => 'Bapak Test Routing',
    'nama_ibu' => 'Ibu Test Routing',
    'kelas_id' => 1,
    'hp_ayah' => '081234567899',
]);
check('Create santri', $r['code'], 201);
$createdId = $r['body']['data']['id'] ?? null;
if ($createdId) pass("ID created: $createdId");

// 4. POST create (invalid - missing required)
echo "\n4. POST /api/v1/kesantrian/santri (missing required → 422)\n";
$r = curlPost($base, $headers, ['nama_santri' => 'Incomplete']);
check('Validation 422', $r['code'], 422);
if ($r['code'] === 422) {
    $errKeys = array_keys($r['body']['errors'] ?? []);
    pass("Validation errors: " . implode(', ', array_slice($errKeys, 0, 4)));
}

// 5. GET show
if ($createdId) {
    echo "\n5. GET /api/v1/kesantrian/santri/{id}\n";
    $r = curlGet("$base/$createdId", $headers);
    check('Show santri', $r['code'], 200);
    if ($r['code'] === 200) pass("Nama: " . ($r['body']['data']['nama_santri'] ?? '?'));
}

// 6. GET show (not found)
echo "\n6. GET /api/v1/kesantrian/santri/invalid-uuid (not found → 404)\n";
$r = curlGet("$base/00000000-0000-0000-0000-000000000000", $headers);
check('Not found 404', $r['code'], 404);

// 7. PUT update
if ($createdId) {
    echo "\n7. PUT /api/v1/kesantrian/santri/{id}\n";
    $r = curlPut("$base/$createdId", $headers, [
        'nis' => $testNis,
        'nama_santri' => 'Test Santri UPDATED',
        'tempat_lahir' => 'Bandung',
        'tanggal_lahir' => '2010-06-15',
        'jenis_kelamin' => 'L',
        'alamat' => 'Jl. Updated No. 2',
        'nama_ayah' => 'Bapak Updated',
        'nama_ibu' => 'Ibu Updated',
    ]);
    check('Update santri', $r['code'], 200);
    if ($r['code'] === 200) pass("Updated nama: " . ($r['body']['data']['nama_santri'] ?? '?'));
}

// 8. DELETE (should fail - no dependencies confirmed but santri exists)
if ($createdId) {
    echo "\n8. DELETE /api/v1/kesantrian/santri/{id}\n";
    $r = curlDelete("$base/$createdId", $headers);
    if (in_array($r['code'], [200, 422])) {
        if ($r['code'] === 200) pass("Delete successful (no dependencies)");
        if ($r['code'] === 422) pass("Delete blocked (has dependencies) - correct behavior");
    } else {
        fail("Delete → HTTP {$r['code']}");
    }

    // Clean up if still exists
    if ($r['code'] === 200) pass("Cleanup: santri test deleted");
    else {
        // Force delete via DB
        \App\Models\Santri::where('id', $createdId)->forceDelete();
        pass("Cleanup: force deleted test santri");
    }
}

// 9. GET export (check header, not full download)
echo "\n9. GET /api/v1/kesantrian/santri/export\n";
$ch = curl_init("$base/export");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_NOBODY => true, CURLOPT_HTTPHEADER => $headers]);
$resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
check('Export Excel', $code, 200);

// 10. GET template
echo "\n10. GET /api/v1/kesantrian/santri/template\n";
$ch = curl_init("$base/template");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_NOBODY => true, CURLOPT_HTTPHEADER => $headers]);
$resp = curl_exec($ch); $code = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
check('Download template', $code, 200);

echo "\n=== ROUTING VERIFICATION COMPLETE ===\n";
