<?php

namespace App\Services\EposKebutuhan;

use App\Models\EposKebutuhanOrder;
use App\Models\EposPool;
use App\Models\Wallet;
use App\Models\WalletSettings;
use App\Models\WalletTransaction;
use App\Services\EposCallbackService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * KebutuhanOrderPaymentService
 * 
 * Handles payment processing for Kebutuhan Orders
 * - Wallet balance checking and deduction
 * - Transaction creation
 * - EPOS pool management
 * - Payment validation
 */
class KebutuhanOrderPaymentService
{
    private EposCallbackService $callbackService;

    public function __construct(EposCallbackService $callbackService)
    {
        $this->callbackService = $callbackService;
    }

    /**
     * Process order confirmation with payment
     * 
     * @throws \Exception
     */
    public function processConfirmation(
        EposKebutuhanOrder $order, 
        int $userId, 
        string $byType
    ): array {
        DB::beginTransaction();
        
        try {
            // Get santri's wallet
            $wallet = $this->getWalletForOrder($order);
            
            // Validate wallet balance
            $this->validateWalletBalance($wallet, $order);
            
            // Process payment
            $transaction = $this->processPayment($wallet, $order);
            
            // Update order status
            $this->updateOrderStatus($order, $userId, $byType, $transaction->id);
            
            // Update EPOS pool
            $this->updateEposPool($order->total_amount);
            
            DB::commit();
            
            // Push status to EPOS (fire-and-forget)
            $this->pushStatusToEpos($order->fresh());
            
            // Log successful confirmation
            $this->logConfirmation($order, $byType, $wallet);
            
            return [
                'success' => true,
                'order' => $order->fresh(),
                'new_balance' => (float) $wallet->balance,
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('KebutuhanOrder confirm failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Get wallet for the order
     * 
     * @throws \Exception
     */
    private function getWalletForOrder(EposKebutuhanOrder $order): Wallet
    {
        $wallet = Wallet::where('santri_id', $order->santri_id)->first();
        
        if (!$wallet) {
            throw new \Exception('Wallet santri tidak ditemukan');
        }
        
        return $wallet;
    }

    /**
     * Validate wallet has sufficient balance
     * 
     * @throws \Exception
     */
    private function validateWalletBalance(Wallet $wallet, EposKebutuhanOrder $order): void
    {
        $minBalance = $this->getMinimumBalance();
        $balanceAfterPayment = $wallet->balance - $order->total_amount;
        
        if ($balanceAfterPayment < $minBalance) {
            throw new \Exception(
                'Saldo santri tidak mencukupi. ' .
                'Saldo: Rp ' . number_format($wallet->balance, 0, ',', '.') . ', ' .
                'Min balance: Rp ' . number_format($minBalance, 0, ',', '.') . ', ' .
                'Total order: Rp ' . number_format($order->total_amount, 0, ',', '.')
            );
        }
    }

    /**
     * Get global minimum balance setting
     */
    private function getMinimumBalance(): float
    {
        $settings = WalletSettings::first();
        return $settings ? (float) $settings->global_minimum_balance : 10000;
    }

    /**
     * Process the actual payment - deduct balance and create transaction
     */
    private function processPayment(Wallet $wallet, EposKebutuhanOrder $order): WalletTransaction
    {
        // Deduct wallet balance
        $wallet->balance -= $order->total_amount;
        $wallet->save();
        
        // Create transaction record
        $description = $this->generateTransactionDescription($order);
        
        return WalletTransaction::create([
            'wallet_id'   => $wallet->id,
            'type'        => 'debit',
            'amount'      => $order->total_amount,
            'method'      => 'epos_kebutuhan',
            'description' => $description,
            'voided'      => false,
        ]);
    }

    /**
     * Generate transaction description from order items
     */
    private function generateTransactionDescription(EposKebutuhanOrder $order): string
    {
        $itemNames = collect($order->items)
            ->pluck('name')
            ->take(5)
            ->implode(', ');
            
        return 'Kebutuhan: ' . $itemNames;
    }

    /**
     * Update order status after successful payment
     */
    private function updateOrderStatus(
        EposKebutuhanOrder $order, 
        int $userId, 
        string $byType, 
        int $transactionId
    ): void {
        $order->update([
            'status'                => 'confirmed',
            'confirmed_by_id'       => $userId,
            'confirmed_by'          => $byType,
            'confirmed_at'          => now(),
            'wallet_transaction_id' => $transactionId,
        ]);
    }

    /**
     * Update EPOS pool balance (same as regular RFID transactions)
     */
    private function updateEposPool(float $amount): void
    {
        $pool = EposPool::firstOrCreate(
            ['name' => 'epos_main'],
            ['balance' => 0]
        );
        
        $pool->balance += $amount;
        $pool->save();
    }

    /**
     * Push order status to EPOS (fire-and-forget)
     */
    private function pushStatusToEpos(EposKebutuhanOrder $order): void
    {
        try {
            $this->callbackService->pushOrderStatus($order);
        } catch (\Exception $e) {
            // Log but don't throw - EPOS push failure shouldn't break confirmation
            Log::warning('Failed to push order status to EPOS', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log successful confirmation for audit trail
     */
    private function logConfirmation(EposKebutuhanOrder $order, string $byType, Wallet $wallet): void
    {
        Log::info('KebutuhanOrder confirmed', [
            'order_id'     => $order->id,
            'epos_order_id' => $order->epos_order_id,
            'santri_id'    => $order->santri_id,
            'confirmed_by' => $byType,
            'amount'       => $order->total_amount,
            'old_balance'  => $wallet->balance + $order->total_amount, // Balance before deduction
            'new_balance'  => $wallet->balance,
        ]);
    }

    /**
     * Check if wallet has sufficient balance (without side effects)
     */
    public function checkWalletBalance(string $santriId, float $amount): array
    {
        $wallet = Wallet::where('santri_id', $santriId)->first();
        
        if (!$wallet) {
            return [
                'sufficient' => false,
                'reason' => 'Wallet tidak ditemukan',
            ];
        }
        
        $minBalance = $this->getMinimumBalance();
        $balanceAfterPayment = $wallet->balance - $amount;
        
        $sufficient = $balanceAfterPayment >= $minBalance;
        
        return [
            'sufficient' => $sufficient,
            'current_balance' => (float) $wallet->balance,
            'min_balance' => $minBalance,
            'amount' => $amount,
            'balance_after' => $balanceAfterPayment,
            'reason' => $sufficient ? null : 'Saldo tidak mencukupi untuk memenuhi minimum balance',
        ];
    }
}