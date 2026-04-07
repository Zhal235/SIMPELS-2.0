<?php

namespace App\Repositories;

use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Repositories\Contracts\WalletRepositoryInterface;
use Illuminate\Support\Facades\DB;

/**
 * Wallet Repository
 * 
 * Handles all database queries related to Wallet model.
 * Implements Repository Pattern for cleaner service layer.
 */
class WalletRepository implements WalletRepositoryInterface
{
    /**
     * Find wallet by santri ID
     * 
     * @param int $santriId
     * @return Wallet|null
     */
    public function findBySantriId(int $santriId): ?Wallet
    {
        return Wallet::with('santri')->where('santri_id', $santriId)->first();
    }

    /**
     * Get all wallets with optional filters
     * 
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getAllWithFilters(array $filters)
    {
        $query = Wallet::with(['santri', 'santri.kelas']);

        // Filter by santri name
        if (!empty($filters['nama_santri'])) {
            $query->whereHas('santri', function ($q) use ($filters) {
                $q->where('nama_santri', 'like', '%' . $filters['nama_santri'] . '%');
            });
        }

        // Filter by NIS
        if (!empty($filters['nis'])) {
            $query->whereHas('santri', function ($q) use ($filters) {
                $q->where('nis', 'like', '%' . $filters['nis'] . '%');
            });
        }

        // Filter by kelas
        if (!empty($filters['kelas_id'])) {
            $query->whereHas('santri', function ($q) use ($filters) {
                $q->where('kelas_id', $filters['kelas_id']);
            });
        }

        // Filter by minimum balance
        if (isset($filters['min_balance'])) {
            $query->where('balance', '>=', $filters['min_balance']);
        }

        // Filter by maximum balance
        if (isset($filters['max_balance'])) {
            $query->where('balance', '<=', $filters['max_balance']);
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        
        if ($sortBy === 'nama_santri') {
            $query->join('santri', 'wallets.santri_id', '=', 'santri.id')
                  ->orderBy('santri.nama_santri', $sortOrder)
                  ->select('wallets.*');
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination
        $perPage = $filters['per_page'] ?? 15;
        
        return $query->paginate($perPage);
    }

    /**
     * Get total cash and bank balances across all wallets
     * 
     * @return array
     */
    public function getTotalBalances(): array
    {
        // Total Cash = sum of all credit cash - sum of all debit cash
        $totalCashCredit = WalletTransaction::where('type', 'credit')
            ->where('method', 'cash')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');

        $totalCashDebit = WalletTransaction::where('type', 'debit')
            ->where('method', 'cash')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');

        // Total Bank/Transfer = sum of all credit transfer - sum of all debit transfer
        $totalBankCredit = WalletTransaction::where('type', 'credit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');

        $totalBankDebit = WalletTransaction::where('type', 'debit')
            ->where('method', 'transfer')
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');

        return [
            'total_cash' => $totalCashCredit - $totalCashDebit,
            'total_bank' => $totalBankCredit - $totalBankDebit,
        ];
    }

    /**
     * Create or get wallet for a santri
     * 
     * @param int $santriId
     * @return Wallet
     */
    public function firstOrCreateBySantriId(int $santriId): Wallet
    {
        return Wallet::firstOrCreate(
            ['santri_id' => $santriId],
            ['balance' => 0]
        );
    }

    /**
     * Update wallet balance
     * 
     * @param int $santriId
     * @param float $newBalance
     * @return bool
     */
    public function updateBalance(int $santriId, float $newBalance): bool
    {
        return Wallet::where('santri_id', $santriId)
            ->update(['balance' => $newBalance]);
    }

    /**
     * Deactivate wallet (soft delete)
     * 
     * @param int $santriId
     * @return bool
     */
    public function deactivate(int $santriId): bool
    {
        $wallet = $this->findBySantriId($santriId);
        
        if (!$wallet) {
            return false;
        }

        return $wallet->delete();
    }
}
