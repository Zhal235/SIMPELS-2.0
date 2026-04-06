<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    protected $appends = ['santri_names'];

    /**
     * Get santri names associated with this phone number
     */
    public function getSantriNamesAttribute(): ?string
    {
        if ($this->recipient_type !== 'wali') {
            return null;
        }

        $santriList = Santri::where(function ($query) {
            $query->where('hp_ayah', $this->phone)
                  ->orWhere('hp_ibu', $this->phone);
        })->pluck('nama_santri');

        return $santriList->isEmpty() ? null : $santriList->join(', ');
    }

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
