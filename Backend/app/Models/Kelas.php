<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Pegawai;

class Kelas extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_kelas',
        'tingkat',
        'wali_kelas_id',
    ];

    /**
     * Relasi: satu kelas memiliki banyak santri
     */
    public function santri()
    {
        return $this->hasMany(Santri::class, 'kelas_id');
    }

    /**
     * Relasi ke Wali Kelas (Pegawai)
     */
    public function wali_kelas()
    {
        return $this->belongsTo(Pegawai::class, 'wali_kelas_id');
    }
}
