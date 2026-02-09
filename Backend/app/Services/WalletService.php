<?php

namespace App\Services;

use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;

class WalletService
{
    /**
     * Calculate total Cash balance across all santri wallets
     * 
     * @return int
     */
    public function calculateTotalCashBalance()
    {
        // Credit cash dari top-up manual (exclude voided & admin-void)
        $cashCredit = WalletTransaction::where('type', 'credit')
            ->where('method', 'cash')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');
        
        // Debit cash (tarik tunai santri, EPOS belanja) - exclude voided & admin-void
        $cashDebit = WalletTransaction::where('type', 'debit')
            ->where('method', 'cash')
            ->where('method', '!=', 'admin-void')
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
     * @return int
     */
    public function calculateTotalBankBalance()
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
}
