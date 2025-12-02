<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollectivePaymentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'collective_payment_id',
        'santri_id',
        'wallet_id',
        'amount',
        'status',
        'paid_at',
        'transaction_id',
        'failure_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function collectivePayment()
    {
        return $this->belongsTo(CollectivePayment::class);
    }

    public function santri()
    {
        return $this->belongsTo(Santri::class);
    }

    public function wallet()
    {
        return $this->belongsTo(Wallet::class);
    }

    public function transaction()
    {
        return $this->belongsTo(WalletTransaction::class, 'transaction_id');
    }

    // Scope untuk filter by status
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
