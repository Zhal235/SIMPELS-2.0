<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BukuKas extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'buku_kas';

    protected $fillable = [
        'nama_kas',
        'saldo_cash_awal',
        'saldo_bank_awal',
    ];

    protected $casts = [
        'saldo_cash_awal' => 'decimal:2',
        'saldo_bank_awal' => 'decimal:2',
    ];

    /**
     * Relasi ke jenis tagihan
     */
    public function jenisTagihan()
    {
        return $this->hasMany(JenisTagihan::class);
    }

    /**
     * Relasi ke transaksi kas (nanti akan dibuat)
     */
    public function transaksi()
    {
        return $this->hasMany(TransaksiKas::class);
    }

    /**
     * Relasi ke pembayaran
     */
    public function pembayaran()
    {
        return $this->hasMany(Pembayaran::class, 'buku_kas_id');
    }
}
