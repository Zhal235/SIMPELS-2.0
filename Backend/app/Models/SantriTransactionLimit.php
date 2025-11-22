<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SantriTransactionLimit extends Model
{
    protected $table = 'santri_transaction_limits';
    protected $fillable = ['santri_id', 'daily_limit'];
    protected $casts = [
        'daily_limit' => 'decimal:2',
    ];

    public function santri()
    {
        return $this->belongsTo(Santri::class);
    }
}
