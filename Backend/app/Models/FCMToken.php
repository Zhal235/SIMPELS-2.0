<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FCMToken extends Model
{
    protected $table = 'fcm_tokens';

    protected $fillable = [
        'santri_id',
        'fcm_token',
        'device_type',
        'last_used_at',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    public function santri()
    {
        return $this->belongsTo(Santri::class);
    }
}
