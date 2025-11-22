<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletSettings extends Model
{
    protected $table = 'wallet_settings';
    protected $fillable = ['min_balance'];
    protected $casts = [
        'min_balance' => 'decimal:2',
    ];
}
