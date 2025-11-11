<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TahunAjaran extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tahun_ajaran';

    protected $fillable = [
        'nama_tahun_ajaran',
        'tanggal_mulai',
        'bulan_mulai',
        'tahun_mulai',
        'tanggal_akhir',
        'bulan_akhir',
        'tahun_akhir',
        'status',
    ];

    protected $casts = [
        'tanggal_mulai' => 'integer',
        'bulan_mulai' => 'integer',
        'tahun_mulai' => 'integer',
        'tanggal_akhir' => 'integer',
        'bulan_akhir' => 'integer',
        'tahun_akhir' => 'integer',
    ];
}
