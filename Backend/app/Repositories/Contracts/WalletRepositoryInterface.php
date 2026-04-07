<?php

namespace App\Repositories\Contracts;

use App\Models\Wallet;
use Illuminate\Support\Collection;

/**
 * Wallet Repository Interface
 * 
 * Contract for wallet data access operations.
 * Implements Repository Pattern for better separation of concerns.
 */
interface WalletRepositoryInterface
{
    /**
     * Find wallet by santri ID
     * 
     * @param int $santriId
     * @return Wallet|null
     */
    public function findBySantriId(int $santriId): ?Wallet;

    /**
     * Get all wallets with optional filters
     * 
     * @param array $filters
     * @return \Illuminate\Pagination\LengthAwarePaginator
     */
    public function getAllWithFilters(array $filters);

    /**
     * Get total cash and bank balances across all wallets
     * 
     * @return array ['total_cash' => float, 'total_bank' => float]
     */
    public function getTotalBalances(): array;

    /**
     * Create or get wallet for a santri
     * 
     * @param int $santriId
     * @return Wallet
     */
    public function firstOrCreateBySantriId(int $santriId): Wallet;

    /**
     * Update wallet balance
     * 
     * @param int $santriId
     * @param float $newBalance
     * @return bool
     */
    public function updateBalance(int $santriId, float $newBalance): bool;

    /**
     * Deactivate wallet (soft delete)
     * 
     * @param int $santriId
     * @return bool
     */
    public function deactivate(int $santriId): bool;
}
