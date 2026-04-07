<?php

namespace App\Repositories;

use App\Models\WalletTransaction;
use App\Repositories\Contracts\WalletTransactionRepositoryInterface;
use Illuminate\Support\Collection;

/**
 * Wallet Transaction Repository
 * 
 * Handles all database queries related to WalletTransaction model.
 */
class WalletTransactionRepository implements WalletTransactionRepositoryInterface
{
    /**
     * Get transactions for a specific santri with filters
     * 
     * @param int $santriId
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getTransactionsBySantri(int $santriId, array $filters)
    {
        $query = WalletTransaction::whereHas('wallet', function ($q) use ($santriId) {
            $q->where('santri_id', $santriId);
        });

        return $this->applyFiltersAndPaginate($query, $filters);
    }

    /**
     * Get all transactions across all wallets with filters
     * 
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getAllTransactions(array $filters)
    {
        $query = WalletTransaction::with(['wallet.santri']);

        // Filter by santri_id
        if (!empty($filters['santri_id'])) {
            $query->whereHas('wallet', function ($q) use ($filters) {
                $q->where('santri_id', $filters['santri_id']);
            });
        }

        return $this->applyFiltersAndPaginate($query, $filters);
    }

    /**
     * Apply common filters and pagination
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    protected function applyFiltersAndPaginate($query, array $filters)
    {
        // Filter by type (credit/debit)
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Filter by method (cash/transfer)
        if (!empty($filters['method'])) {
            $query->where('method', $filters['method']);
        }

        // Filter by date range
        if (!empty($filters['start_date'])) {
            $query->whereDate('created_at', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('created_at', '<=', $filters['end_date']);
        }

        // Exclude voided transactions
        if (!empty($filters['exclude_voided'])) {
            $query->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            });
        }

        // Sort
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $filters['per_page'] ?? 15;
        
        return $query->paginate($perPage);
    }

    /**
     * Find transaction by ID
     * 
     * @param int $id
     * @return WalletTransaction|null
     */
    public function findById(int $id)
    {
        return WalletTransaction::with('wallet.santri')->find($id);
    }

    /**
     * Create new transaction
     * 
     * @param array $data
     * @return WalletTransaction
     */
    public function create(array $data)
    {
        return WalletTransaction::create($data);
    }

    /**
     * Update transaction
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool
    {
        $transaction = $this->findById($id);
        
        if (!$transaction) {
            return false;
        }

        return $transaction->update($data);
    }

    /**
     * Calculate balances by payment method
     * 
     * @param string $method (cash|transfer)
     * @return array
     */
    public function calculateBalances(string $method): array
    {
        $totalCredit = WalletTransaction::where('type', 'credit')
            ->where('method', $method)
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');

        $totalDebit = WalletTransaction::where('type', 'debit')
            ->where('method', $method)
            ->where(function($q) {
                $q->where('voided', '!=', 1)
                  ->orWhereNull('voided');
            })
            ->sum('amount');

        return [
            'total_credit' => $totalCredit,
            'total_debit' => $totalDebit,
            'balance' => $totalCredit - $totalDebit,
        ];
    }

    /**
     * Get transactions by wallet ID
     * 
     * @param int $walletId
     * @param array $filters
     * @return Collection
     */
    public function getByWalletId(int $walletId, array $filters = []): Collection
    {
        $query = WalletTransaction::where('wallet_id', $walletId);

        // Apply filters if provided
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['method'])) {
            $query->where('method', $filters['method']);
        }

        $query->orderBy('created_at', 'desc');

        return $query->get();
    }

    /**
     * Delete migration transactions for a wallet
     * 
     * @param int $walletId
     * @return int Number of deleted rows
     */
    public function deleteMigrationTransactions(int $walletId): int
    {
        return WalletTransaction::where('wallet_id', $walletId)
            ->where(function($q) {
                $q->where('reference', 'like', 'MIGRATION-%')
                  ->orWhere('method', 'migration');
            })
            ->delete();
    }
}
