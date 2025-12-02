<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollectivePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'amount_per_santri',
        'target_type',
        'class_id',
        'total_santri',
        'collected_amount',
        'outstanding_amount',
        'status',
        'created_by',
    ];

    protected $casts = [
        'amount_per_santri' => 'decimal:2',
        'collected_amount' => 'decimal:2',
        'outstanding_amount' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(CollectivePaymentItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function class()
    {
        return $this->belongsTo(Kelas::class, 'class_id');
    }

    // Scope untuk filter by status
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
