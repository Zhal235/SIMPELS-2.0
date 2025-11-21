<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletWithdrawal extends Model
{
    use HasFactory;

    protected $table = 'wallet_withdrawals';

    protected $fillable = [
        'pool_id', 'amount', 'status', 'requested_by', 'processed_by', 'epos_ref', 'notes'
    ];

    public function pool()
    {
        return $this->belongsTo(EposPool::class, 'pool_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
