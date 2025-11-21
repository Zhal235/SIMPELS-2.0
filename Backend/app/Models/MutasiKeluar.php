<?php

namespace App\Models;

use App\Models\Santri;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MutasiKeluar extends Model
{
    use HasFactory;

    protected $table = 'mutasi_keluar';

    protected $fillable = [
        'santri_id',
        'tanggal_mutasi',
        'tujuan',
        'alasan',
        'created_by',
    ];

    public function santri()
    {
        return $this->belongsTo(Santri::class, 'santri_id');
    }

}
