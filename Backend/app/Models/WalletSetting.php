<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletSetting extends Model
{
    use HasFactory;

    protected $table = 'wallet_settings';

    protected $fillable = [
        'key', 'value', 'scope'
    ];
}
