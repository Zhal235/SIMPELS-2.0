<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KategoriPengeluaran extends Model
{
    protected $table = 'kategori_pengeluaran';

    protected $fillable = [
        'name',
        'slug',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
