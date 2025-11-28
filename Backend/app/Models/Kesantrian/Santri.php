<?php

namespace App\Models\Kesantrian;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Kelas;

class Santri extends Model
{
    use HasFactory;

    protected $table = 'santri';

    protected $fillable = [
        'nis',
        'nisn',
        'nik_santri',
        'nama_santri',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'kelas_id',
        'asrama_id',
        'asal_sekolah',
        'hobi',
        'cita_cita',
        'jumlah_saudara',
        'alamat',
        'provinsi',
        'kabupaten',
        'kecamatan',
        'desa',
        'kode_pos',
        'no_kk',
        'nama_ayah',
        'nik_ayah',
        'pendidikan_ayah',
        'pekerjaan_ayah',
        'hp_ayah',
        'nama_ibu',
        'nik_ibu',
        'pendidikan_ibu',
        'pekerjaan_ibu',
        'hp_ibu',
        'foto',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'jumlah_saudara' => 'integer',
    ];

    /**
     * Relasi ke Kelas (untuk model kesantrian legacy)
     */
    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }
}