<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MobileActivityLog extends Model
{
    protected $fillable = [
        'no_hp',
        'santri_id',
        'action',
        'feature',
        'endpoint',
        'method',
        'device',
        'device_model',
        'app_version',
        'ip_address',
        'user_agent',
        'response_time',
        'status_code',
    ];

    protected $casts = [
        'response_time' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Static helper untuk log activity
     */
    public static function logActivity(array $data)
    {
        return self::create($data);
    }
}
