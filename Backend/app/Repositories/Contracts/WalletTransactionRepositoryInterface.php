<?php

namespace App\Repositories\Contracts;

use Illuminate\Support\Collection;

/**
 * Wallet Transaction Repository Interface
 * 
 * Contract for wallet transaction data access operations.
 */
interface WalletTransactionRepositoryInterface
{
    /**
     * Get transactions for a specific santri with filters
     * 
     * @param int $santriId
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getTransactionsBySantri(int $santriId, array $filters);

    /**
     * Get all transactions across all wallets with filters
     * 
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getAllTransactions(array $filters);

    /**
     * Find transaction by ID
     * 
     * @param int $id
     * @return \App\Models\WalletTransaction|null
     */
    public function findById(int $id);

    /**
     * Create new transaction
     * 
     * @param array $data
     * @return \App\Models\WalletTransaction
     */
    public function create(array $data);

    /**
     * Update transaction
     * 
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data): bool;

    /**
     * Calculate balances by payment method
     * 
     * @param string $method (cash|transfer)
     * @return array ['total_credit' => float, 'total_debit' => float, 'balance' => float]
     */
    public function calculateBalances(string $method): array;

    /**
     * Get transactions by wallet ID
     * 
     * @param int $walletId
     * @param array $filters
     * @return Collection
     */
    public function getByWalletId(int $walletId, array $filters = []): Collection;

    /**
     * Delete migration transactions for a wallet
     * 
     * @param int $walletId
     * @return int Number of deleted rows
     */
    public function deleteMigrationTransactions(int $walletId): int;
}
