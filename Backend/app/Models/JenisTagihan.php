<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JenisTagihan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jenis_tagihan';

    protected $fillable = [
        'nama_tagihan',
        'kategori',
        'bulan',
        'tipe_nominal',
        'nominal_sama',
        'nominal_per_kelas',
        'nominal_per_individu',
        'jatuh_tempo',
        'buku_kas_id',
        'tahun_ajaran_id',
    ];

    protected $casts = [
        'bulan' => 'array',
        'nominal_per_kelas' => 'array',
        'nominal_per_individu' => 'array',
        'nominal_sama' => 'decimal:2',
    ];

    /**
     * Accessor untuk format response yang lebih clean
     */
    public function getFormattedDataAttribute()
    {
        $data = [
            'id' => $this->id,
            'namaTagihan' => $this->nama_tagihan,
            'kategori' => $this->kategori,
            'bulan' => $this->bulan,
            'tipeNominal' => $this->tipe_nominal,
            'jatuhTempo' => $this->jatuh_tempo,
            'bukuKasId' => $this->buku_kas_id,
        ];

        if ($this->tipe_nominal === 'sama') {
            $data['nominalSama'] = (float) $this->nominal_sama;
        } elseif ($this->tipe_nominal === 'per_kelas') {
            $data['nominalPerKelas'] = $this->nominal_per_kelas;
        } elseif ($this->tipe_nominal === 'per_individu') {
            $data['nominalPerIndividu'] = $this->nominal_per_individu;
        }

        return $data;
    }

    /**
     * Relasi ke buku kas
     */
    public function bukuKas()
    {
        return $this->belongsTo(BukuKas::class);
    }

    /**
     * Relasi ke tahun ajaran
     */
    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'tahun_ajaran_id');
    }
}
