<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asrama extends Model
{
    use HasFactory;

    protected $table = 'asramas';

    protected $fillable = [
        'nama_asrama',
        'wali_asrama',
    ];

    public function santri()
    {
        return $this->hasMany(Santri::class, 'asrama_id');
    }
}