<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KeuanganAuditLog extends Model
{
    use HasFactory;

    protected $table = 'keuangan_audit_logs';

    protected $fillable = [
        'user_id',
        'action',
        'entity',
        'filters',
        'result',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'filters' => 'array',
        'result' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
