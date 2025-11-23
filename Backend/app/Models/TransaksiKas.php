<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransaksiKas extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'transaksi_kas';

    protected $fillable = [
        'buku_kas_id',
        'no_transaksi',
        'tanggal',
        'jenis',
        'metode',
        'kategori',
        'kategori_id',
        'nominal',
        'keterangan',
        'pembayaran_id',
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
        'tanggal' => 'date',
    ];

    /**
     * Relasi ke buku kas
     */
    public function bukuKas()
    {
        return $this->belongsTo(BukuKas::class);
    }

    /**
     * Relasi ke pembayaran
     */
    public function pembayaran()
    {
        return $this->belongsTo(Pembayaran::class);
    }

    public function kategoriPengeluaran()
    {
        return $this->belongsTo(\App\Models\KategoriPengeluaran::class, 'kategori_id');
    }

    /**
     * Generate nomor transaksi otomatis
     */
    public static function generateNoTransaksi($jenis)
    {
        $prefix = $jenis === 'pemasukan' ? 'MSK' : 'KLR';
        $date = date('Ymd');
        $lastTransaksi = self::whereDate('created_at', today())
            ->where('jenis', $jenis)
            ->orderBy('id', 'desc')
            ->first();
        
        if ($lastTransaksi) {
            $lastNumber = (int) substr($lastTransaksi->no_transaksi, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . '-' . $date . '-' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }
}
