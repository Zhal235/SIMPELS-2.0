<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

$santriId = '019aa9f3-cda3-7150-92f3-354196775728';
for ($i = 1; $i <= 3; $i++) {
    $payload = [
        'santri_id' => $santriId,
        'amount' => 3000,
        'epos_txn_id' => "SIM_TEST_" . $i,
        'meta' => ['items' => [['product_name' => 'Aqua 600ml']]]
    ];

    $req = Request::create('/api/v1/wallets/epos/transaction', 'POST', $payload);
    try {
        $resp = app()->call('App\\Http\\Controllers\\EposController@transaction', ['request' => $req]);
        echo "Attempt #$i result: \n";
        echo $resp->getContent() . "\n\n";
    } catch (Exception $e) {
        echo "Attempt #$i exception: " . $e->getMessage() . "\n\n";
    }
}
