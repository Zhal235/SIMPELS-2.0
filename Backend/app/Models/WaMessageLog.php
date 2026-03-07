<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaMessageLog extends Model
{
    protected $table = 'wa_message_logs';

    protected $fillable = [
        'recipient_type',
        'recipient_id',
        'phone',
        'message_type',
        'message_body',
        'status',
        'error_reason',
        'retry_count',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'retry_count' => 'integer',
    ];

    public function markSent(): void
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
            'error_reason' => null,
        ]);
    }

    public function markFailed(string $reason): void
    {
        $this->update([
            'status' => 'failed',
            'error_reason' => $reason,
        ]);
    }

    public function incrementRetry(): void
    {
        $this->increment('retry_count');
        $this->update(['status' => 'pending', 'error_reason' => null]);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }
}
