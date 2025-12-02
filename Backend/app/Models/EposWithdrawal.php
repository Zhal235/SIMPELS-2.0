<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EposWithdrawal extends Model
{
    protected $fillable = [
        'withdrawal_number',
        'amount',
        'period_start',
        'period_end',
        'total_transactions',
        'notes',
        'requested_by',
        'status',
        'payment_method',
        'approved_at',
        'approved_by',
        'completed_at',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'period_start' => 'date',
        'period_end' => 'date',
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_COMPLETED = 'completed';
    const STATUS_REJECTED = 'rejected';

    public function getStatusLabelAttribute()
    {
        return match($this->status) {
            self::STATUS_PENDING => 'Menunggu Approval',
            self::STATUS_APPROVED => 'Disetujui',
            self::STATUS_COMPLETED => 'Selesai',
            self::STATUS_REJECTED => 'Ditolak',
            default => 'Unknown'
        };
    }
}
