<?php

namespace App\Services\Wallet;

use Illuminate\Support\Facades\DB;
use App\Models\WalletTransaction;

/**
 * Wallet Balance Service
 * 
 * Handles all balance calculation logic for wallet system.
 * Extracted from WalletController to improve code organization.
 * 
 * Responsibilities:
 * - Calculate total cash balance
 * - Calculate total bank/transfer balance  
 * - Aggregate balance across all wallets
 * - Handle balance adjustments from withdrawals
 */
class WalletBalanceService
{
    /**
     * Calculate total Cash balance across all santri wallets
     * 
     * Formula:
     * Cash Balance = (Cash Credits - Cash Debits) + Bank Withdrawals - EPOS Cash Withdrawals
     * 
     * @return float
     */
    public function calculateTotalCashBalance(): float
    {
        // Credit cash dari top-up manual (exclude voided & admin-void)
        $cashCredit = WalletTransaction::where('type', 'credit')
            ->where('method', 'cash')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        // Debit cash (tarik tunai santri, EPOS belanja) - exclude voided
        $cashDebit = WalletTransaction::where('type', 'debit')
            ->where('method', 'cash')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        // Tambah dari penarikan Bank→Cash
        $withdrawals = DB::table('wallet_withdrawals')
            ->where('pool_id', null) // Cash withdrawals (bukan EPOS)
            ->where('status', 'done')
            ->sum('amount');
        
        // Kurangi pencairan EPOS yang pakai cash
        $eposWithdrawalsCash = DB::table('epos_withdrawals')
            ->where('status', 'approved')
            ->where('payment_method', 'cash')
            ->sum('amount');
        
        return ($cashCredit - $cashDebit) + $withdrawals - $eposWithdrawalsCash;
    }

    /**
     * Calculate total Transfer/Bank balance across all santri wallets
     * 
     * Formula:
     * Bank Balance = (Transfer Credits - Transfer Debits) - Bank Withdrawals - EPOS Transfer Withdrawals
     * 
     * @return float
     */
    public function calculateTotalBankBalance(): float
    {
        $transferCredit = WalletTransaction::where('type', 'credit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        $transferDebit = WalletTransaction::where('type', 'debit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        // Kurangi penarikan Bank→Cash
        $withdrawals = DB::table('wallet_withdrawals')
            ->where('pool_id', null)
            ->where('status', 'done')
            ->sum('amount');
        
        // Kurangi pencairan EPOS yang pakai transfer
        $eposWithdrawalsTransfer = DB::table('epos_withdrawals')
            ->where('status', 'approved')
            ->where('payment_method', 'transfer')
            ->sum('amount');
        
        return ($transferCredit - $transferDebit) - $withdrawals - $eposWithdrawalsTransfer;
    }

    /**
     * Get aggregated balance summary
     * 
     * @return array
     */
    public function getBalances(): array
    {
        $cashBalance = $this->calculateTotalCashBalance();
        $bankBalance = $this->calculateTotalBankBalance();

        return [
            'cash_balance' => $cashBalance,
            'bank_balance' => $bankBalance,
            'total_balance' => $cashBalance + $bankBalance,
        ];
    }
}
