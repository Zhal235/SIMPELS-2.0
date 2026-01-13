<?php

namespace App\Observers;

use App\Models\WalletTransaction;
use App\Models\CollectivePaymentItem;
use App\Models\Wallet;
use Illuminate\Support\Str;

class WalletTransactionObserver
{
    /**
     * Handle the WalletTransaction "created" event.
     * Auto-process pending collective payments when santri top-up
     */
    public function created(WalletTransaction $transaction)
    {
        // Only process for credit (top-up) transactions
        if ($transaction->type !== 'credit') {
            return;
        }

        // Get wallet
        $wallet = Wallet::find($transaction->wallet_id);
        if (!$wallet) {
            return;
        }

        // Check if santri has pending collective payment items
        $pendingItems = CollectivePaymentItem::where('wallet_id', $wallet->id)
            ->where('status', 'pending')
            ->with('collectivePayment')
            ->get();

        if ($pendingItems->isEmpty()) {
            return;
        }

        // Try to process each pending item
        foreach ($pendingItems as $item) {
            // Refresh wallet balance
            $wallet->refresh();

            // Check if sufficient balance
            if ($wallet->balance < $item->amount) {
                $item->update([
                    'failure_reason' => 'Saldo tidak mencukupi (Rp ' . number_format($wallet->balance, 0, ',', '.') . ')'
                ]);
                continue;
            }

            // Create debit transaction for collective payment
            $reference = 'CP-AUTO-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
            
            $cpTransaction = WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $item->amount,
                'balance_after' => $wallet->balance - $item->amount,
                'description' => '[Auto] ' . $item->collectivePayment->title,
                'reference' => $reference,
                'method' => 'cash',
                'created_by' => $transaction->created_by, // Use same user as top-up
            ]);

            // Update wallet balance
            $wallet->decrement('balance', $item->amount);

            // Update item status
            $item->update([
                'status' => 'paid',
                'paid_at' => now(),
                'transaction_id' => $cpTransaction->id,
                'failure_reason' => null,
            ]);

            // Update collective payment totals
            $payment = $item->collectivePayment;
            $paidSum = $payment->items()->paid()->sum('amount');
            $pendingSum = $payment->items()->pending()->sum('amount');

            $payment->update([
                'collected_amount' => $paidSum,
                'outstanding_amount' => $pendingSum,
                'status' => $pendingSum > 0 ? 'active' : 'completed'
            ]);

            \Log::info("Auto-processed collective payment item #{$item->id} for santri #{$wallet->santri_id}");
        }
    }
}
