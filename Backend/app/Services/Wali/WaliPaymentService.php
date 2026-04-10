<?php

namespace App\Services\Wali;

use App\Models\Santri;
use App\Models\TagihanSantri;
use App\Models\Pembayaran;
use App\Models\BuktiTransfer;
use App\Models\BankAccount;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Wali Payment Service
 * 
 * Handles payment operations, tagihan, and bukti transfer for wali
 */
class WaliPaymentService
{
    /**
     * Get all tagihan untuk santri
     * 
     * @param int $santriId
     * @return array
     */
    public function getAllTagihan(int $santriId): array
    {
        $santri = Santri::findOrFail($santriId);
        
        $allTagihan = TagihanSantri::where('santri_id', $santriId)
            ->with('jenisTagihan')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) use ($santriId) {
                return $this->formatTagihan($t, $santriId);
            });

        // Deteksi tunggakan
        $allTagihanWithOverdue = $this->detectOverdue($allTagihan);
        
        // Group by status
        $lunas = $allTagihanWithOverdue->where('status', 'lunas');
        $belumBayar = $allTagihanWithOverdue->whereIn('status', ['belum_bayar', 'cicilan', 'sebagian']);
        $tunggakan = $allTagihanWithOverdue->where('status', 'tunggakan');

        return [
            'success' => true,
            'data' => [
                'semua' => $allTagihanWithOverdue->values()->toArray(),
                'lunas' => $lunas->values()->toArray(),
                'belum_bayar' => $belumBayar->values()->toArray(),
                'tunggakan' => $tunggakan->values()->toArray(),
            ],
            'summary' => [
                'total_tagihan' => $allTagihanWithOverdue->sum('nominal'),
                'total_dibayar' => $allTagihanWithOverdue->sum('dibayar'),
                'total_sisa' => $allTagihanWithOverdue->sum('sisa'),
                'jumlah_lunas' => $lunas->count(),
                'jumlah_belum_bayar' => $belumBayar->count(),
                'jumlah_tunggakan' => $tunggakan->count(),
            ],
            'status_code' => 200,
        ];
    }

    /**
     * Get riwayat pembayaran
     * 
     * @param int $santriId
     * @return array
     */
    public function getPembayaran(int $santriId): array
    {
        $santri = Santri::findOrFail($santriId);
        
        $pembayaran = Pembayaran::where('santri_id', $santriId)
            ->with('jenisTagihan')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'tanggal' => $p->tanggal_bayar ?? $p->created_at->format('Y-m-d'),
                    'jenis_tagihan' => $p->jenisTagihan->nama ?? 'Unknown',
                    'bulan' => $p->bulan ?? null,
                    'tahun' => $p->tahun ?? date('Y'),
                    'jumlah' => $p->jumlah,
                    'metode_pembayaran' => $p->metode_pembayaran ?? 'Cash',
                    'status' => $p->status ?? 'lunas',
                    'bukti_url' => $p->bukti ? Storage::disk('r2')->url($p->bukti) : null,
                ];
            });

        return [
            'success' => true,
            'data' => $pembayaran->toArray(),
            'total' => $pembayaran->sum('jumlah'),
            'status_code' => 200,
        ];
    }

    /**
     * Get tunggakan
     * 
     * @param int $santriId
     * @return array
     */
    public function getTunggakan(int $santriId): array
    {
        $santri = Santri::findOrFail($santriId);
        
        $tunggakan = TagihanSantri::where('santri_id', $santriId)
            ->where('status', '!=', 'lunas')
            ->with('jenisTagihan')
            ->orderBy('jatuh_tempo', 'asc')
            ->get()
            ->map(function ($t) {
                $jumlah = $t->jumlah ?? 0;
                $sudahDibayar = $t->jumlah_dibayar ?? 0;
                $sisa = $jumlah - $sudahDibayar;
                
                return [
                    'id' => $t->id,
                    'jenis_tagihan' => $t->jenisTagihan->nama ?? 'Unknown',
                    'bulan' => $t->bulan ?? null,
                    'tahun' => $t->tahun ?? date('Y'),
                    'jumlah' => $jumlah,
                    'sudah_dibayar' => $sudahDibayar,
                    'sisa' => $sisa,
                    'status' => $t->status ?? 'belum_lunas',
                    'jatuh_tempo' => $t->jatuh_tempo ?? null,
                ];
            });

        return [
            'success' => true,
            'data' => $tunggakan->toArray(),
            'total_tunggakan' => $tunggakan->sum('sisa'),
            'status_code' => 200,
        ];
    }

    /**
     * Upload bukti transfer untuk multiple tagihan
     * 
     * @param int $santriId
     * @param array $data
     * @return array
     */
    public function uploadBukti(int $santriId, array $data): array
    {
        // Verify santri exists
        $santri = Santri::find($santriId);
        if (!$santri) {
            return [
                'success' => false,
                'error' => 'Santri tidak ditemukan',
                'status_code' => 404,
            ];
        }

        $tagihanIds = $data['tagihan_ids'] ?? [];

        // Verify all tagihan belong to this santri (if provided)
        if (!empty($tagihanIds)) {
            $tagihans = TagihanSantri::whereIn('id', $tagihanIds)
                ->where('santri_id', $santriId)
                ->get();

            if ($tagihans->count() !== count($tagihanIds)) {
                return [
                    'success' => false,
                    'error' => 'Beberapa tagihan tidak valid',
                    'status_code' => 400,
                ];
            }
        }

        // Store bukti transfer file
        $filePath = $data['bukti']->store('bukti_transfer', 'r2');

        $nominalTopup = $data['nominal_topup'] ?? 0;
        $nominalTabungan = $data['nominal_tabungan'] ?? 0;
        $totalNominal = $data['total_nominal'];
        
        // Determine transaction type
        $jenisTransaksi = $this->determineJenisTransaksi($tagihanIds, $nominalTopup, $nominalTabungan);

        // Create bukti transfer record
        $buktiTransfer = BuktiTransfer::create([
            'santri_id' => $santriId,
            'selected_bank_id' => $data['selected_bank_id'] ?? null,
            'jenis_transaksi' => $jenisTransaksi,
            'tagihan_ids' => $tagihanIds,
            'total_nominal' => $totalNominal,
            'bukti_path' => $filePath,
            'status' => 'pending',
            'catatan_wali' => $data['catatan'] ?? null,
            'uploaded_at' => now(),
        ]);

        // Store breakdown in catatan_admin
        $this->updateCatatanAdmin($buktiTransfer, $jenisTransaksi, $totalNominal, $nominalTopup, $nominalTabungan);

        return [
            'success' => true,
            'message' => 'Bukti transfer berhasil dikirim. Tunggu konfirmasi admin.',
            'data' => $buktiTransfer,
            'status_code' => 201,
        ];
    }

    /**
     * Get history bukti transfer untuk santri
     * 
     * @param int $santriId
     * @return array
     */
    public function getBuktiHistory(int $santriId): array
    {
        $buktiList = BuktiTransfer::where('santri_id', $santriId)
            ->with(['santri', 'processedBy', 'selectedBank'])
            ->orderBy('uploaded_at', 'desc')
            ->get()
            ->map(function ($bukti) {
                return $this->formatBuktiTransfer($bukti);
            });

        return [
            'success' => true,
            'data' => $buktiList->toArray(),
            'status_code' => 200,
        ];
    }

    /**
     * Upload bukti transfer untuk top-up dompet
     * 
     * @param int $santriId
     * @param array $data ['nominal', 'selected_bank_id', 'bukti', 'catatan']
     * @return array
     */
    public function uploadBuktiTopup(int $santriId, array $data): array
    {
        // Verify santri exists
        $santri = Santri::find($santriId);
        if (!$santri) {
            return [
                'success' => false,
                'error' => 'Santri tidak ditemukan',
                'status_code' => 404,
            ];
        }

        // Store bukti transfer file
        $filePath = $data['bukti']->store('bukti_transfer', 'r2');

        // Create bukti transfer record for topup
        $buktiTransfer = BuktiTransfer::create([
            'santri_id' => $santriId,
            'selected_bank_id' => $data['selected_bank_id'] ?? null,
            'jenis_transaksi' => 'topup',
            'tagihan_ids' => null,
            'total_nominal' => $data['nominal'],
            'bukti_path' => $filePath,
            'status' => 'pending',
            'catatan_wali' => $data['catatan'] ?? null,
            'uploaded_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => 'Bukti top-up berhasil dikirim. Tunggu konfirmasi admin.',
            'data' => $buktiTransfer,
            'status_code' => 201,
        ];
    }

    /**
     * Get list of active bank accounts
     * 
     * @return array
     */
    public function getBankAccounts(): array
    {
        $accounts = BankAccount::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('bank_name')
            ->get(['id', 'bank_name', 'account_number', 'account_name']);

        return [
            'success' => true,
            'data' => $accounts->toArray(),
            'status_code' => 200,
        ];
    }

    /**
     * Format tagihan data
     * 
     * @param TagihanSantri $tagihan
     * @param int $santriId
     * @return array
     */
    private function formatTagihan($tagihan, int $santriId): array
    {
        $nominal = $tagihan->nominal ?? 0;
        $dibayar = $tagihan->dibayar ?? 0;
        $sisa = $nominal - $dibayar;
        
        $status = $tagihan->status ?? 'belum_bayar';
        
        // Check pending bukti
        $hasPendingBukti = $this->checkPendingBukti($tagihan->id, $santriId);
        
        return [
            'id' => $tagihan->id,
            'jenis_tagihan' => $tagihan->jenisTagihan->nama_tagihan ?? 'Biaya',
            'deskripsi' => $tagihan->deskripsi ?? null,
            'bulan' => $tagihan->bulan ?? null,
            'tahun' => $tagihan->tahun ?? date('Y'),
            'nominal' => (float) $nominal,
            'dibayar' => (float) $dibayar,
            'sisa' => (float) $sisa,
            'status' => $status,
            'has_pending_bukti' => $hasPendingBukti,
            'jatuh_tempo' => $tagihan->jatuh_tempo ?? null,
            'tanggal_dibuat' => $tagihan->created_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Check if tagihan has pending bukti
     * 
     * @param int $tagihanId
     * @param int $santriId
     * @return bool
     */
    private function checkPendingBukti(int $tagihanId, int $santriId): bool
    {
        try {
            if (!\Schema::hasTable('bukti_transfer')) {
                return false;
            }

            $pendingBukti = BuktiTransfer::where('status', 'pending')
                ->where('santri_id', $santriId)
                ->get();
            
            foreach ($pendingBukti as $bukti) {
                $tagihanIds = $bukti->tagihan_ids ?? [];
                $tagihanIdsAsStrings = array_map('strval', $tagihanIds);
                
                if (in_array(strval($tagihanId), $tagihanIdsAsStrings)) {
                    return true;
                }
            }
            
            return false;
        } catch (\Exception $e) {
            Log::error('bukti_transfer check failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Detect overdue tagihan
     * 
     * @param \Illuminate\Support\Collection $tagihan
     * @return \Illuminate\Support\Collection
     */
    private function detectOverdue($tagihan)
    {
        $now = now();
        $currentMonth = $now->month;
        $currentYear = $now->year;
        
        $bulanMap = [
            'Januari' => 1, 'Februari' => 2, 'Maret' => 3, 'April' => 4,
            'Mei' => 5, 'Juni' => 6, 'Juli' => 7, 'Agustus' => 8,
            'September' => 9, 'Oktober' => 10, 'November' => 11, 'Desember' => 12
        ];
        
        return $tagihan->map(function ($t) use ($currentMonth, $currentYear, $bulanMap) {
            $bulan = $t['bulan'];
            $tahun = $t['tahun'];
            $status = $t['status'];
            
            $bulanNum = $bulanMap[$bulan] ?? null;
            
            if ($status !== 'lunas' && $bulanNum) {
                $isOverdue = ($tahun < $currentYear) || 
                            ($tahun == $currentYear && $bulanNum < $currentMonth);
                
                if ($isOverdue) {
                    $t['status'] = 'tunggakan';
                    $t['is_overdue'] = true;
                }
            }
            
            return $t;
        });
    }

    /**
     * Determine jenis transaksi
     * 
     * @param array $tagihanIds
     * @param float $nominalTopup
     * @param float $nominalTabungan
     * @return string
     */
    private function determineJenisTransaksi(array $tagihanIds, float $nominalTopup, float $nominalTabungan): string
    {
        if (empty($tagihanIds) && $nominalTopup > 0) {
            return 'topup';
        } else if ($nominalTopup > 0 && $nominalTabungan > 0) {
            return 'pembayaran_topup_tabungan';
        } else if ($nominalTopup > 0) {
            return 'pembayaran_topup';
        } else if ($nominalTabungan > 0) {
            return 'pembayaran_tabungan';
        }
        
        return 'pembayaran';
    }

    /**
     * Update catatan admin with breakdown
     * 
     * @param BuktiTransfer $buktiTransfer
     * @param string $jenisTransaksi
     * @param float $totalNominal
     * @param float $nominalTopup
     * @param float $nominalTabungan
     * @return void
     */
    private function updateCatatanAdmin($buktiTransfer, string $jenisTransaksi, float $totalNominal, float $nominalTopup, float $nominalTabungan): void
    {
        $catatan = '';
        
        if ($jenisTransaksi === 'topup') {
            $catatan = "Top-up dompet: Rp " . number_format($nominalTopup, 0, ',', '.');
        } else if ($jenisTransaksi === 'pembayaran_topup') {
            $nominalPembayaran = $totalNominal - $nominalTopup;
            $catatan = "Pembayaran tagihan: Rp " . number_format($nominalPembayaran, 0, ',', '.') . "\n";
            $catatan .= "Top-up dompet: Rp " . number_format($nominalTopup, 0, ',', '.');
        } else if ($jenisTransaksi === 'pembayaran_tabungan') {
            $nominalPembayaran = $totalNominal - $nominalTabungan;
            $catatan = "Pembayaran tagihan: Rp " . number_format($nominalPembayaran, 0, ',', '.') . "\n";
            $catatan .= "Setor tabungan: Rp " . number_format($nominalTabungan, 0, ',', '.');
        } else if ($jenisTransaksi === 'pembayaran_topup_tabungan') {
            $nominalPembayaran = $totalNominal - $nominalTopup - $nominalTabungan;
            $catatan = "Pembayaran tagihan: Rp " . number_format($nominalPembayaran, 0, ',', '.') . "\n";
            $catatan .= "Top-up dompet: Rp " . number_format($nominalTopup, 0, ',', '.') . "\n";
            $catatan .= "Setor tabungan: Rp " . number_format($nominalTabungan, 0, ',', '.');
        }
        
        if ($catatan) {
            $buktiTransfer->update(['catatan_admin' => $catatan]);
        }
    }

    /**
     * Format bukti transfer data
     * 
     * @param BuktiTransfer $bukti
     * @return array
     */
    private function formatBuktiTransfer($bukti): array
    {
        // Get tagihan details
        $tagihans = collect([]);
        if ($bukti->tagihan_ids && count($bukti->tagihan_ids) > 0) {
            $tagihans = TagihanSantri::whereIn('id', $bukti->tagihan_ids)
                ->with('jenisTagihan')
                ->get();
        }

        // Parse nominal_topup and nominal_tabungan
        [$nominalTopup, $nominalTabungan] = $this->parseNominalFromCatatan($bukti);

        return [
            'id' => $bukti->id,
            'jenis_transaksi' => $bukti->jenis_transaksi ?? 'pembayaran',
            'selected_bank' => $bukti->selectedBank ? [
                'id' => $bukti->selectedBank->id,
                'bank_name' => $bukti->selectedBank->bank_name,
                'account_number' => $bukti->selectedBank->account_number,
                'account_name' => $bukti->selectedBank->account_name,
            ] : null,
            'total_nominal' => (float) $bukti->total_nominal,
            'nominal_topup' => $nominalTopup,
            'nominal_tabungan' => $nominalTabungan,
            'status' => $bukti->status,
            'catatan_wali' => $bukti->catatan_wali,
            'catatan_admin' => $bukti->catatan_admin,
            'bukti_url' => $bukti->bukti_url,
            'uploaded_at' => $bukti->uploaded_at->format('Y-m-d H:i:s'),
            'processed_at' => $bukti->processed_at ? $bukti->processed_at->format('Y-m-d H:i:s') : null,
            'processed_by' => $bukti->processedBy ? $bukti->processedBy->name : null,
            'tagihan' => $tagihans->map(function ($t) {
                return [
                    'id' => $t->id,
                    'jenis' => $t->jenisTagihan->nama_tagihan ?? 'Biaya',
                    'bulan' => $t->bulan,
                    'tahun' => (int) $t->tahun,
                    'nominal' => (float) $t->nominal,
                    'dibayar' => (float) $t->dibayar,
                    'sisa' => (float) $t->sisa,
                ];
            })->toArray(),
        ];
    }

    /**
     * Parse nominal from catatan admin
     * 
     * @param BuktiTransfer $bukti
     * @return array [nominalTopup, nominalTabungan]
     */
    private function parseNominalFromCatatan($bukti): array
    {
        $nominalTopup = 0;
        $nominalTabungan = 0;
        $catatan = $bukti->catatan_admin ?? '';

        if ($bukti->jenis_transaksi === 'topup') {
            $nominalTopup = (float) $bukti->total_nominal;
        } else if (in_array($bukti->jenis_transaksi, ['pembayaran_topup', 'pembayaran_topup_tabungan'])) {
            if (preg_match('/Top-up dompet[:\s]+Rp\s*([\d.,]+)/i', $catatan, $m)) {
                $nominalTopup = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            }
        }
        
        if (in_array($bukti->jenis_transaksi, ['pembayaran_tabungan', 'pembayaran_topup_tabungan'])) {
            if (preg_match('/Setor tabungan[:\s]+Rp\s*([\d.,]+)/i', $catatan, $m)) {
                $nominalTabungan = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            }
        }

        return [$nominalTopup, $nominalTabungan];
    }
}
