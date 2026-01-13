<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

echo "=== Debug Transaksi Abdul Latif Gunawan ===\n\n";

// Cari wallet Abdul Latif
$wallet = DB::table('wallets')
    ->join('santri', 'wallets.santri_id', '=', 'santri.id')
    ->where('santri.nama_santri', 'LIKE', '%ABDUL LATIF%')
    ->select('wallets.*', 'santri.nama_santri')
    ->first();

if (!$wallet) {
    echo "Santri tidak ditemukan!\n";
    exit;
}

echo "Wallet ID: {$wallet->id}\n";
echo "Santri: {$wallet->nama_santri}\n";
echo "Saldo: Rp " . number_format($wallet->balance, 0, ',', '.') . "\n\n";

echo "=== Transaksi Credit (Top-up) ===\n";
$credits = DB::table('wallet_transactions')
    ->where('wallet_id', $wallet->id)
    ->where('type', 'credit')
    ->orderBy('created_at', 'desc')
    ->get();

foreach ($credits as $txn) {
    $voidedStr = $txn->voided === null ? 'NULL' : ($txn->voided ? 'TRUE' : 'FALSE');
    $voidedInt = $txn->voided === null ? 'NULL' : (int)$txn->voided;
    
    echo sprintf(
        "ID: %s | Amount: Rp %s | Method: %s | Voided: %s (int: %s) | Date: %s\n",
        substr($txn->id, 0, 8),
        number_format($txn->amount, 0, ',', '.'),
        $txn->method,
        $voidedStr,
        $voidedInt,
        $txn->created_at
    );
}

echo "\n=== Transaksi Debit ===\n";
$debits = DB::table('wallet_transactions')
    ->where('wallet_id', $wallet->id)
    ->where('type', 'debit')
    ->orderBy('created_at', 'desc')
    ->get();

foreach ($debits as $txn) {
    $voidedStr = $txn->voided === null ? 'NULL' : ($txn->voided ? 'TRUE' : 'FALSE');
    echo sprintf(
        "ID: %s | Amount: Rp %s | Method: %s | Voided: %s | Desc: %s\n",
        substr($txn->id, 0, 8),
        number_format($txn->amount, 0, ',', '.'),
        $txn->method,
        $voidedStr,
        substr($txn->description, 0, 40)
    );
}

echo "\n=== Perhitungan ===\n";

// CREDIT
$total_credit_correct = DB::table('wallet_transactions')
    ->where('wallet_id', $wallet->id)
    ->where('type', 'credit')
    ->where('method', '!=', 'admin-void') // Exclude reversal
    ->where(function($q) {
        $q->where('voided', '!=', 1)
          ->orWhereNull('voided');
    })
    ->sum('amount');

$total_credit_cash = DB::table('wallet_transactions')
    ->where('wallet_id', $wallet->id)
    ->where('type', 'credit')
    ->where('method', 'cash')
    ->where(function($q) {
        $q->where('voided', '!=', 1)->orWhereNull('voided');
    })
    ->sum('amount');

$total_credit_transfer = DB::table('wallet_transactions')
    ->where('wallet_id', $wallet->id)
    ->where('type', 'credit')
    ->where('method', 'transfer')
    ->where(function($q) {
        $q->where('voided', '!=', 1)->orWhereNull('voided');
    })
    ->sum('amount');

// DEBIT
$total_debit_correct = DB::table('wallet_transactions')
    ->where('wallet_id', $wallet->id)
    ->where('type', 'debit')
    ->where('method', '!=', 'admin-void') // Exclude reversal
    ->where(function($q) {
        $q->where('voided', '!=', 1)
          ->orWhereNull('voided');
    })
    ->sum('amount');

echo "✅ CREDIT (exclude void & admin-void): Rp " . number_format($total_credit_correct, 0, ',', '.') . "\n";
echo "   - Cash: Rp " . number_format($total_credit_cash, 0, ',', '.') . "\n";
echo "   - Transfer: Rp " . number_format($total_credit_transfer, 0, ',', '.') . "\n";
echo "\n";
echo "✅ DEBIT (exclude void & admin-void): Rp " . number_format($total_debit_correct, 0, ',', '.') . "\n";
echo "\n";
echo "💰 Saldo seharusnya: Rp " . number_format($total_credit_correct - $total_debit_correct, 0, ',', '.') . "\n";
echo "💰 Saldo di DB: Rp " . number_format($wallet->balance, 0, ',', '.') . "\n";
