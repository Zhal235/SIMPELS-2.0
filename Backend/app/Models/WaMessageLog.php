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

    protected $appends = ['santri_names'];

    /**
     * Get santri names associated with this phone number
     */
    public function getSantriNamesAttribute(): ?string
    {
        if ($this->recipient_type !== 'wali') {
            return null;
        }

        $candidates = $this->phoneCandidates((string) $this->phone);
        if (empty($candidates)) {
            return null;
        }

        $santriList = \App\Models\Santri::where(function ($query) use ($candidates) {
            foreach ($candidates as $candidate) {
                $query->orWhere('hp_ayah', $candidate)
                    ->orWhere('hp_ibu', $candidate);
            }
        })->pluck('nama_santri');

        return $santriList->isEmpty() ? null : $santriList->join(', ');
    }

    private function phoneCandidates(string $rawPhone): array
    {
        $digits = preg_replace('/\D+/', '', $rawPhone) ?? '';
        if ($digits === '') {
            return [];
        }

        $candidates = [$rawPhone, $digits];

        if (str_starts_with($digits, '62')) {
            $local = '0' . substr($digits, 2);
            $candidates[] = $local;
            $candidates[] = '+62' . substr($digits, 2);
        }

        if (str_starts_with($digits, '0')) {
            $intl = '62' . substr($digits, 1);
            $candidates[] = $intl;
            $candidates[] = '+' . $intl;
        }

        return array_values(array_unique(array_filter($candidates)));
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
