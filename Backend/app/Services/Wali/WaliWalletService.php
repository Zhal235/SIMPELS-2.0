<?php

namespace App\Services\Wali;

use App\Models\Santri;
use App\Models\Wallet;
use App\Models\SantriTransactionLimit;
use App\Models\WalletSettings;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Wali Wallet Service
 * 
 * Handles wallet information and transaction history for wali
 */
class WaliWalletService
{
    /**
     * Get wallet information with recent transactions
     * 
     * @param int $santriId
     * @return array
     */
    public function getWallet(int $santriId): array
    {
        $santri = Santri::findOrFail($santriId);
        $wallet = Wallet::where('santri_id', $santriId)->first();
        
        // Get transaction limit
        $transactionLimit = SantriTransactionLimit::where('santri_id', $santriId)->first();
        $limitHarian = $transactionLimit ? $transactionLimit->daily_limit : 15000;
        
        // Get global minimum balance
        $settings = WalletSettings::first();
        $minBalance = $settings ? $settings->global_minimum_balance : 10000;
        
        if (!$wallet) {
            return [
                'success' => true,
                'data' => [
                    'santri_id' => $santri->id,
                    'santri_nama' => $santri->nama_santri,
                    'saldo' => 0.0,
                    'limit_harian' => (float) $limitHarian,
                    'limit_tersisa' => (float) $limitHarian,
                    'minimum_balance' => (float) $minBalance,
                    'is_below_minimum' => true,
                    'transaksi_terakhir' => [],
                ],
                'status_code' => 200,
            ];
        }

        // Get recent transactions
        $recentTransactions = $this->getRecentTransactions($wallet->id, 10);
        
        $currentBalance = (float) ($wallet->balance ?? $wallet->saldo ?? 0);
        $isBelowMinimum = $currentBalance < $minBalance;
        
        return [
            'success' => true,
            'data' => [
                'santri_id' => $santri->id,
                'santri_nama' => $santri->nama_santri,
                'saldo' => $currentBalance,
                'limit_harian' => (float) $limitHarian,
                'limit_tersisa' => (float) ($wallet->remaining_limit ?? $limitHarian),
                'minimum_balance' => (float) $minBalance,
                'is_below_minimum' => $isBelowMinimum,
                'transaksi_terakhir' => $recentTransactions,
            ],
            'status_code' => 200,
        ];
    }

    /**
     * Get santri wallet transaction history
     * 
     * @param int $santriId
     * @return array
     */
    public function getSantriWalletHistory(int $santriId): array
    {
        $wallet = Wallet::where('santri_id', $santriId)->first();

        if (!$wallet) {
            return [
                'success' => true,
                'data' => [],
                'status_code' => 200,
            ];
        }

        $transactions = $this->getAllTransactions($wallet->id);

        return [
            'success' => true,
            'data' => $transactions,
            'status_code' => 200,
        ];
    }

    /**
     * Set daily transaction limit for santri
     * 
     * @param int $santriId
     * @param float $dailyLimit
     * @return array
     */
    public function setSantriDailyLimit(int $santriId, float $dailyLimit): array
    {
        $santri = Santri::find($santriId);
        
        if (!$santri) {
            return [
                'success' => false,
                'message' => 'Santri not found',
                'status_code' => 404,
            ];
        }

        $limit = SantriTransactionLimit::updateOrCreate(
            ['santri_id' => $santriId],
            ['daily_limit' => $dailyLimit]
        );

        return [
            'success' => true,
            'data' => $limit,
            'status_code' => 200,
        ];
    }

    /**
     * Get recent transactions
     * 
     * @param int $walletId
     * @param int $limit
     * @return array
     */
    private function getRecentTransactions(int $walletId, int $limit = 10): array
    {
        return DB::table('wallet_transactions')
            ->where('wallet_id', $walletId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($t) {
                return $this->formatTransaction($t);
            })
            ->toArray();
    }

    /**
     * Get all transactions for a wallet
     * 
     * @param int $walletId
     * @return array
     */
    private function getAllTransactions(int $walletId): array
    {
        return DB::table('wallet_transactions')
            ->where('wallet_id', $walletId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                return $this->formatTransaction($t);
            })
            ->values()
            ->toArray();
    }

    /**
     * Format transaction data
     * 
     * @param object $transaction
     * @return array
     */
    private function formatTransaction($transaction): array
    {
        $tanggal = $transaction->created_at
            ? Carbon::parse($transaction->created_at)->toIso8601String()
            : now()->toIso8601String();
        
        return [
            'id' => (string) $transaction->id,
            'tanggal' => $tanggal,
            'keterangan' => $transaction->description ?? '',
            'jumlah' => is_numeric($transaction->amount) ? (float) $transaction->amount : 0.0,
            'tipe' => $transaction->type ?? 'credit',
            'saldo_akhir' => is_numeric($transaction->balance_after) ? (float) $transaction->balance_after : 0.0,
        ];
    }
}
