<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EposKebutuhanOrder extends Model
{
    protected $table = 'epos_kebutuhan_orders';

    protected $fillable = [
        'epos_order_id',
        'santri_id',
        'santri_name',
        'rfid_uid',
        'items',
        'total_amount',
        'status',
        'cashier_name',
        'terminal_id',
        'confirmed_by_id',
        'confirmed_by',
        'confirmed_at',
        'expired_at',
        'rejection_reason',
        'wallet_transaction_id',
    ];

    protected $casts = [
        'items'        => 'array',
        'total_amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
        'expired_at'   => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $order) {
            if (empty($order->expired_at)) {
                $order->expired_at = now()->addDay();
            }
        });
    }

    public function santri(): BelongsTo
    {
        return $this->belongsTo(Santri::class, 'santri_id');
    }

    public function confirmedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by_id');
    }

    public function walletTransaction(): BelongsTo
    {
        return $this->belongsTo(WalletTransaction::class, 'wallet_transaction_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForSantri($query, string $santriId)
    {
        return $query->where('santri_id', $santriId);
    }

    public function isExpired(): bool
    {
        return $this->expired_at->isPast() && $this->status === 'pending';
    }

    /**
     * Auto-confirm semua order yang sudah melewati batas waktu
     * (setelah 24 jam otomatis dikonfirmasi)
     */
    public static function autoConfirmOldOrders(): int
    {
        $orders = static::where('status', 'pending')
            ->where('expired_at', '<', now())
            ->get();

        $confirmed = 0;
        foreach ($orders as $order) {
            try {
                $wallet = Wallet::where('santri_id', $order->santri_id)->first();
                
                if (!$wallet) {
                    // Jika tidak ada wallet, expire aja
                    $order->update(['status' => 'expired']);
                    continue;
                }

                $settingsRow = WalletSettings::first();
                $minBalance = $settingsRow ? (float) $settingsRow->global_minimum_balance : 10000;

                // Cek saldo cukup
                if (($wallet->balance - $order->total_amount) < $minBalance) {
                    // Saldo tidak cukup, expire
                    $order->update(['status' => 'expired', 'rejection_reason' => 'Saldo tidak mencukupi']);
                    continue;
                }

                \DB::beginTransaction();
                
                // Potong saldo
                $wallet->balance -= $order->total_amount;
                $wallet->save();

                $itemNames = collect($order->items)->pluck('name')->take(5)->implode(', ');
                $txn = WalletTransaction::create([
                    'wallet_id'   => $wallet->id,
                    'type'        => 'debit',
                    'amount'      => $order->total_amount,
                    'method'      => 'epos_kebutuhan',
                    'description' => 'Kebutuhan (Auto): ' . $itemNames,
                    'voided'      => false,
                ]);

                // Tambahkan ke EposPool
                $pool = EposPool::firstOrCreate(['name' => 'epos_main'], ['balance' => 0]);
                $pool->balance += $order->total_amount;
                $pool->save();

                $order->update([
                    'status'                => 'confirmed',
                    'confirmed_by_id'       => null,
                    'confirmed_by'          => 'system',
                    'confirmed_at'          => now(),
                    'wallet_transaction_id' => $txn->id,
                ]);

                \DB::commit();
                $confirmed++;

                // Push ke EPOS
                try {
                    (new \App\Services\EposCallbackService())->pushOrderStatus($order->fresh());
                } catch (\Exception $e) {
                    \Log::error('Failed to push auto-confirmed order to EPOS', ['order_id' => $order->id, 'error' => $e->getMessage()]);
                }

            } catch (\Exception $e) {
                \DB::rollBack();
                \Log::error('Failed to auto-confirm order', ['order_id' => $order->id, 'error' => $e->getMessage()]);
                $order->update(['status' => 'expired']);
            }
        }

        return $confirmed;
    }
}
