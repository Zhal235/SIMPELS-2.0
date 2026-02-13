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

    // Relasi many-to-many dengan jabatan
    public function jabatan()
    {
        return $this->belongsToMany(Jabatan::class, 'pegawai_jabatan')
                    ->withPivot('is_primary')
                    ->withTimestamps();
    }

    // Get jabatan utama
    public function jabatanUtama()
    {
        return $this->belongsToMany(Jabatan::class, 'pegawai_jabatan')
                    ->withPivot('is_primary')
                    ->withTimestamps()
                    ->wherePivot('is_primary', true)
                    ->first();
    }

    // Get nama jabatan utama untuk display
    public function getJabatanUtamaNameAttribute()
    {
        $jabatanUtama = $this->jabatanUtama();
        return $jabatanUtama ? $jabatanUtama->nama : '-';
    }

    // Get semua jabatan sebagai string
    public function getJabatanListAttribute()
    {
        return $this->jabatan->pluck('nama')->implode(', ');
    }
}