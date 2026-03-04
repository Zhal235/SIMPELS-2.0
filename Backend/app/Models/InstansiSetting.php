<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class InstansiSetting extends Model
{
    protected $table = 'instansi_settings';

    protected $fillable = [
        'nama_yayasan',
        'nama_pesantren',
        'alamat',
        'telp',
        'email',
        'website',
        'kop_surat_path',
    ];

    protected $appends = ['kop_surat_url'];

    public function getKopSuratUrlAttribute(): ?string
    {
        if (!$this->kop_surat_path) return null;
        return Storage::disk('r2')->url($this->kop_surat_path);
    }
}
