<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TagihanSantri extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tagihan_santri';

    protected $fillable = [
        'santri_id',
        'jenis_tagihan_id',
        'bulan',
        'tahun',
        'nominal',
        'status',
        'dibayar',
        'sisa',
        'jatuh_tempo',
        'buku_kas',
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
        'dibayar' => 'decimal:2',
        'sisa' => 'decimal:2',
        'tahun' => 'integer',
    ];

    /**
     * Relasi ke santri
     */
    public function santri()
    {
        return $this->belongsTo(Santri::class);
    }

    /**
     * Relasi ke jenis tagihan
     */
    public function jenisTagihan()
    {
        return $this->belongsTo(JenisTagihan::class);
    }
}
