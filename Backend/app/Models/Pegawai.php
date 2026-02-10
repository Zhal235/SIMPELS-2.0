<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    use HasFactory;

    protected $table = 'pegawai';

    protected $fillable = [
        'nama_pegawai',
        'user_id',
        'nip',
        'nuptk',
        'nik',
        'gelar_depan',
        'gelar_belakang',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'no_hp',
        'email',
        'jenis_pegawai',
        'status_kepegawaian',
        'tanggal_mulai_tugas',
        'jabatan',
        'pendidikan_terakhir',
        'foto_profil',
        'status_pernikahan',
        'nama_ibu_kandung',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}