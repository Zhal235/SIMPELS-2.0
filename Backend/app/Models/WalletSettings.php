<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WalletSettings extends Model
{
    protected $table = 'wallet_settings';
    protected $fillable = [
        'min_balance',
        'global_daily_limit',
        'global_minimum_balance'
    ];
    protected $casts = [
        'min_balance' => 'decimal:2',
        'global_daily_limit' => 'decimal:2',
        'global_minimum_balance' => 'decimal:2',
    ];
}
