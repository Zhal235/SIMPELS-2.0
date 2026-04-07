<?php

namespace App\Services\Wallet;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Wallet;
use App\Models\Santri;
use App\Models\WalletTransaction;

/**
 * Wallet CRUD Service
 * 
 * Handles Create, Read, Update, Delete operations for wallet management.
 * Extracted from WalletController to improve code organization.
 * 
 * Responsibilities:
 * - List all wallets with transaction summaries
 * - Show single wallet detail
 * - Deactivate wallets (soft delete)
 * - Calculate transaction statistics per wallet
 */
class WalletCrudService
{
    /**
     * Get all active wallets with transaction summaries
     * Supports date range filtering
     * 
     * @param Request $request
     * @return array
     */
    public function getAllWallets(Request $request): array
    {
        $dateFrom = $request->filled('date_from') ? $request->date_from . ' 00:00:00' : null;
        $dateTo   = $request->filled('date_to')   ? $request->date_to   . ' 23:59:59' : null;

        $wallets = Wallet::with('santri')->where('is_active', true)->get();

        // Add transaction totals per wallet
        $wallets->transform(function ($wallet) use ($dateFrom, $dateTo) {
            $this->addTransactionSummary($wallet, $dateFrom, $dateTo);
            return $wallet;
        });

        return $wallets->toArray();
    }

    /**
     * Get single wallet by santri ID
     * 
     * @param string $santriId
     * @return array
     */
    public function getWalletBySantriId(string $santriId): array
    {
        $wallet = Wallet::where('santri_id', $santriId)
            ->where('is_active', true)
            ->with('santri')
            ->first();

        if (!$wallet) {
            // Wallet belum dibuat — kembalikan objek kosong agar frontend tidak error
            return [
                'id' => null,
                'santri_id' => $santriId,
                'balance' => 0,
                'updated_at' => null,
            ];
        }

        return $wallet->toArray();
    }

    /**
     * Deactivate wallet (soft delete)
     * Only allowed for non-active santri
     * 
     * @param string $santriId
     * @return array ['success' => bool, 'message' => string]
     */
    public function deactivateWallet(string $santriId): array
    {
        $santri = Santri::find($santriId);
        if (!$santri) {
            return [
                'success' => false,
                'message' => 'Santri tidak ditemukan',
                'status_code' => 404
            ];
        }

        if (!in_array($santri->status, ['mutasi', 'mutasi_keluar', 'keluar', 'alumni', 'lulus'], true)) {
            return [
                'success' => false,
                'message' => 'Dompet hanya dapat dihapus untuk santri nonaktif/mutasi',
                'status_code' => 422
            ];
        }

        $wallet = Wallet::where('santri_id', $santriId)->where('is_active', true)->first();
        if (!$wallet) {
            return [
                'success' => false,
                'message' => 'Dompet tidak ditemukan',
                'status_code' => 404
            ];
        }

        try {
            DB::transaction(function () use ($wallet) {
                // Keep wallet + transactions for historical financial reports, just deactivate it.
                $wallet->is_active = false;
                $wallet->save();
            });

            return [
                'success' => true,
                'message' => 'Dompet santri mutasi berhasil dinonaktifkan',
                'status_code' => 200
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'Gagal menghapus dompet',
                'error' => $e->getMessage(),
                'status_code' => 500
            ];
        }
    }

    /**
     * Add transaction summary statistics to wallet object
     * 
     * @param Wallet $wallet
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @return void
     */
    private function addTransactionSummary($wallet, $dateFrom, $dateTo): void
    {
        // Exclude voided transactions (voided=1/true)
        $wallet->total_credit = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'credit')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('created_at', [$dateFrom, $dateTo]))
            ->sum('amount');

        $wallet->total_debit = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('created_at', [$dateFrom, $dateTo]))
            ->sum('amount');

        // Include NULL/empty method in cash (legacy import data had method truncated to NULL)
        $wallet->total_credit_cash = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'credit')
            ->where(function($q) {
                $q->where('method', 'cash')
                  ->orWhereNull('method')
                  ->orWhere('method', '');
            })
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('created_at', [$dateFrom, $dateTo]))
            ->sum('amount');

        $wallet->total_credit_transfer = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'credit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('created_at', [$dateFrom, $dateTo]))
            ->sum('amount');

        $wallet->total_debit_cash = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->where('method', 'cash')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('created_at', [$dateFrom, $dateTo]))
            ->sum('amount');

        $wallet->total_debit_transfer = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('created_at', [$dateFrom, $dateTo]))
            ->sum('amount');

        $wallet->total_debit_epos = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->whereIn('method', ['epos', 'epos_kebutuhan'])
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('created_at', [$dateFrom, $dateTo]))
            ->sum('amount');

        $wallet->transaction_count = WalletTransaction::where('wallet_id', $wallet->id)
            ->when($dateFrom && $dateTo, fn($q) => $q->whereBetween('created_at', [$dateFrom, $dateTo]))
            ->count();

        // If date filter exists, calculate balance snapshot at end date
        if ($dateFrom && $dateTo) {
            $this->addBalanceSnapshot($wallet, $dateTo);
        }
    }

    /**
     * Add balance snapshot at specific date
     * 
     * @param Wallet $wallet
     * @param string $dateTo
     * @return void
     */
    private function addBalanceSnapshot($wallet, $dateTo): void
    {
        // Calculate total credit up to end date
        $creditUntilEnd = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'credit')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->where('created_at', '<=', $dateTo)
            ->sum('amount');

        // Calculate total debit up to end date
        $debitUntilEnd = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->where('created_at', '<=', $dateTo)
            ->sum('amount');

        $wallet->balance_at_end_date = (float)($creditUntilEnd - $debitUntilEnd);

        // Breakdown per method up to end date
        $creditCashUntilEnd = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'credit')
            ->where(function($q) {
                $q->where('method', 'cash')
                  ->orWhereNull('method')
                  ->orWhere('method', '');
            })
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->where('created_at', '<=', $dateTo)
            ->sum('amount');

        $creditTransferUntilEnd = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'credit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->where('created_at', '<=', $dateTo)
            ->sum('amount');

        $debitCashUntilEnd = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->where('method', 'cash')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->where('created_at', '<=', $dateTo)
            ->sum('amount');

        $debitTransferUntilEnd = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->where('created_at', '<=', $dateTo)
            ->sum('amount');

        $debitEposUntilEnd = WalletTransaction::where('wallet_id', $wallet->id)
            ->where('type', 'debit')
            ->whereIn('method', ['epos', 'epos_kebutuhan'])
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->where('created_at', '<=', $dateTo)
            ->sum('amount');

        // Calculate Bank->Cash withdrawals up to end date
        $withdrawalsUntilEnd = DB::table('wallet_withdrawals')
            ->where('pool_id', null)
            ->where('status', 'done')
            ->where('created_at', '<=', $dateTo)
            ->sum('amount');

        $wallet->cash_balance_at_end_date = (float)(($creditCashUntilEnd - $debitCashUntilEnd - $debitEposUntilEnd) + $withdrawalsUntilEnd);
        $wallet->bank_balance_at_end_date = (float)(($creditTransferUntilEnd - $debitTransferUntilEnd) - $withdrawalsUntilEnd);
    }
}
