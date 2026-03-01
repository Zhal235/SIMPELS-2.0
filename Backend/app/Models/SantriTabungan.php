<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SantriTabungan extends Model
{
    use HasFactory;

    protected $table = 'santri_tabungan';

    protected $fillable = [
        'santri_id', 'saldo', 'status', 'opened_at', 'notes',
    ];

    protected $casts = [
        'opened_at' => 'date',
        'saldo'     => 'float',
    ];

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id');
    }

    public function transactions()
    {
        return $this->hasMany(SantriTabunganTransaction::class, 'tabungan_id');
    }
}
