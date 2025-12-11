<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Kelas;
use App\Models\Asrama;
use App\Models\SantriTransactionLimit;
use App\Models\RfidTag;
use App\Models\Wallet;

class Santri extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'santri';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted()
    {
        static::created(function ($santri) {
            // Auto-create transaction limit with default 15000
            SantriTransactionLimit::firstOrCreate(
                ['santri_id' => $santri->id],
                ['daily_limit' => 15000]
            );
        });
    }

    protected $fillable = [
        'nis', 'nisn', 'nik_santri', 'nama_santri', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
        'kelas_id', 'kelas_nama', 'asrama_id', 'asrama_nama', 'asal_sekolah', 'hobi', 'cita_cita', 'jumlah_saudara', 'alamat',
        'provinsi', 'kabupaten', 'kecamatan', 'desa', 'kode_pos', 'no_kk', 'nama_ayah', 'nik_ayah',
        'pendidikan_ayah', 'pekerjaan_ayah', 'hp_ayah', 'nama_ibu', 'nik_ibu', 'pendidikan_ibu',
        'pekerjaan_ibu', 'hp_ibu', 'foto', 'jenis_penerimaan', 'status',
    ];

    /**
     * Relasi ke Kelas
     */
    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }

    /**
     * Relasi ke Asrama
     */
    public function asrama()
    {
        return $this->belongsTo(Asrama::class, 'asrama_id');
    }

    /**
     * Relasi ke RFID tag (satu santri -> satu rfid tag)
     */
    public function rfid_tag()
    {
        return $this->hasOne(RfidTag::class, 'santri_id');
    }

    /**
     * Relasi ke dompet/wallet (satu santri -> satu wallet)
     */
    public function wallet()
    {
        return $this->hasOne(Wallet::class, 'santri_id');
    }

    /**
     * Relasi ke tagihan santri
     */
    public function tagihanSantri()
    {
        return $this->hasMany(TagihanSantri::class, 'santri_id');
    }

    /**
     * Relasi ke pembayaran
     */
    public function pembayaran()
    {
        return $this->hasMany(Pembayaran::class, 'santri_id');
    }

    /**
     * Relasi ke transaksi wallet
     */
    public function walletTransactions()
    {
        return $this->hasManyThrough(WalletTransaction::class, Wallet::class, 'santri_id', 'wallet_id');
    }
}