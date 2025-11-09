<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Kelas;

class Santri extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'santri';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nis', 'nisn', 'nik_santri', 'nama_santri', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
        'kelas_id', 'kelas_nama', 'asrama_id', 'asal_sekolah', 'hobi', 'cita_cita', 'jumlah_saudara', 'alamat',
        'provinsi', 'kabupaten', 'kecamatan', 'desa', 'kode_pos', 'no_kk', 'nama_ayah', 'nik_ayah',
        'pendidikan_ayah', 'pekerjaan_ayah', 'hp_ayah', 'nama_ibu', 'nik_ibu', 'pendidikan_ibu',
        'pekerjaan_ibu', 'hp_ibu', 'foto',
    ];

    /**
     * Relasi ke Kelas
     */
    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }
}