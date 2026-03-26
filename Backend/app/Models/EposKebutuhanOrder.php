<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
     * Expire semua order yang sudah melewati waktu
     */
    public static function expireOldOrders(): int
    {
        return static::where('status', 'pending')
            ->where('expired_at', '<', now())
            ->update(['status' => 'expired']);
    }
}
