<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nama',
        'kode',
        'deskripsi',
    ];

    protected $dates = ['created_at', 'updated_at', 'deleted_at'];

    // Relasi dengan jabatan
    public function jabatan()
    {
        return $this->hasMany(Jabatan::class);
    }

    // Relasi dengan pegawai (jika department langsung terkait pegawai)
    public function pegawai() 
    {
        return $this->hasManyThrough(Pegawai::class, Jabatan::class, 'department_id', 'jabatan_id', 'id', 'id');
    }
}