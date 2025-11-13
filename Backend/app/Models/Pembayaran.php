<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pembayaran extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pembayaran';

    protected $fillable = [
        'santri_id',
        'tagihan_santri_id',
        'buku_kas_id',
        'no_transaksi',
        'tanggal_bayar',
        'nominal_bayar',
        'sisa_sebelum',
        'sisa_sesudah',
        'metode_pembayaran',
        'status_pembayaran',
        'keterangan',
        'bukti_pembayaran',
        'kwitansi_snapshot',
    ];

    protected $casts = [
        'nominal_bayar' => 'decimal:2',
        'sisa_sebelum' => 'decimal:2',
        'sisa_sesudah' => 'decimal:2',
        'tanggal_bayar' => 'datetime',
        'kwitansi_snapshot' => 'array',
    ];

    /**
     * Relasi ke santri
     */
    public function santri()
    {
        return $this->belongsTo(Santri::class);
    }

    /**
     * Relasi ke tagihan santri
     */
    public function tagihanSantri()
    {
        return $this->belongsTo(TagihanSantri::class);
    }

    /**
     * Relasi ke buku kas
     */
    public function bukuKas()
    {
        return $this->belongsTo(BukuKas::class);
    }

    /**
     * Generate nomor transaksi otomatis
     */
    public static function generateNoTransaksi()
    {
        $date = date('Ymd');
        $lastPembayaran = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        if ($lastPembayaran) {
            $lastNumber = (int) substr($lastPembayaran->no_transaksi, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return 'PAY-' . $date . '-' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }
}
