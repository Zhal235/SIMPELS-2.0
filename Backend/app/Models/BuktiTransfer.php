<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BuktiTransfer extends Model
{
    use HasFactory;

    protected $table = 'bukti_transfer';

    protected $fillable = [
        'santri_id',
        'selected_bank_id',
        'jenis_transaksi',
        'tagihan_ids',
        'total_nominal',
        'bukti_path',
        'status',
        'catatan_wali',
        'catatan_admin',
        'uploaded_at',
        'processed_at',
        'processed_by',
    ];

    protected $casts = [
        'tagihan_ids' => 'array',
        'total_nominal' => 'decimal:2',
        'uploaded_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    protected $appends = ['bukti_url'];

    // Relationships
    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id', 'id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function selectedBank()
    {
        return $this->belongsTo(BankAccount::class, 'selected_bank_id');
    }

    // Accessor untuk URL bukti transfer
    public function getBuktiUrlAttribute()
    {
        if ($this->bukti_path) {
            // Use API route for CORS support (no CSRF issues)
            return '/api/storage/' . $this->bukti_path;
        }
        return null;
    }

    // Scope
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}
