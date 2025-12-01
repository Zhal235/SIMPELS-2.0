<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DataCorrection extends Model
{
    protected $fillable = [
        'santri_id',
        'field_name',
        'old_value',
        'new_value',
        'note',
        'status',
        'requested_by',
        'admin_note',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function santri()
    {
        return $this->belongsTo(\App\Models\Santri::class, 'santri_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
