<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SantriTabunganTransaction extends Model
{
    use HasFactory;

    protected $table = 'santri_tabungan_transactions';

    protected $fillable = [
        'tabungan_id', 'santri_id', 'type', 'amount', 'saldo_after',
        'description', 'method', 'recorded_by',
    ];

    protected $casts = [
        'amount'     => 'float',
        'saldo_after' => 'float',
    ];

    public function tabungan()
    {
        return $this->belongsTo(SantriTabungan::class, 'tabungan_id');
    }

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id');
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
