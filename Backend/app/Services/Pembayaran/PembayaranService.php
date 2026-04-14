<?php

namespace App\Services\Pembayaran;

use App\Models\Pembayaran;
use App\Models\TagihanSantri;
use App\Models\TransaksiKas;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\SantriTabungan;
use App\Models\SantriTabunganTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PembayaranService
{
    public function getList(Request $request): array
    {
        $query = Pembayaran::with(['santri', 'tagihanSantri.jenisTagihan', 'bukuKas']);

        if ($request->has('santri_id')) {
            $query->where('santri_id', $request->santri_id);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('tanggal_bayar', [$request->start_date, $request->end_date]);
        }

        $pembayaran = $query->orderBy('tanggal_bayar', 'desc')->get();

        return ['success' => true, 'data' => $pembayaran];
    }

    public function getHistory(string $santriId): array
    {
        $pembayaran = Pembayaran::with(['tagihanSantri.jenisTagihan'])
            ->where('santri_id', $santriId)
            ->orderBy('tanggal_bayar', 'desc')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'no_transaksi' => $p->no_transaksi,
                'tanggal_bayar' => $p->tanggal_bayar,
                'nominal_bayar' => $p->nominal_bayar,
                'sisa_sebelum' => $p->sisa_sebelum,
                'sisa_sesudah' => $p->sisa_sesudah,
                'metode_pembayaran' => $p->metode_pembayaran,
                'status_pembayaran' => $p->status_pembayaran,
                'keterangan' => $p->keterangan,
                'kwitansi_snapshot' => $p->kwitansi_snapshot,
                'jenis_tagihan' => $p->tagihanSantri->jenisTagihan->nama_tagihan,
                'bulan' => $p->tagihanSantri->bulan,
                'tahun' => $p->tagihanSantri->tahun,
                'nominal_tagihan' => $p->tagihanSantri->nominal,
                'admin_penerima' => $p->kwitansi_snapshot['admin'] ?? 'Admin',
            ])
            ->groupBy(fn($item) => $item['bulan'] . ' ' . $item['tahun']);

        return ['success' => true, 'data' => $pembayaran];
    }

    public function processPembayaran(Request $request): array
    {
        try {
            DB::beginTransaction();

            $tagihan = TagihanSantri::with('jenisTagihan.bukuKas', 'santri')->findOrFail($request->tagihan_santri_id);

            if ($request->nominal_bayar > $tagihan->sisa) {
                return ['success' => false, 'message' => 'Nominal pembayaran melebihi sisa tagihan', 'status_code' => 400];
            }

            $noTransaksi = Pembayaran::generateNoTransaksi();
            $sisaSebelum = $tagihan->sisa;
            $sisaSesudah = $tagihan->sisa - $request->nominal_bayar;
            $statusPembayaran = $sisaSesudah == 0 ? 'lunas' : 'sebagian';

            $kwitansiSnapshot = $this->generateKwitansiSnapshot($request, $tagihan, $noTransaksi, $sisaSebelum, $sisaSesudah, $statusPembayaran);

            $pembayaran = Pembayaran::create([
                'santri_id' => $tagihan->santri_id,
                'tagihan_santri_id' => $tagihan->id,
                'buku_kas_id' => $tagihan->jenisTagihan->buku_kas_id,
                'no_transaksi' => $noTransaksi,
                'tanggal_bayar' => $request->tanggal_bayar,
                'nominal_bayar' => $request->nominal_bayar,
                'sisa_sebelum' => $sisaSebelum,
                'sisa_sesudah' => $sisaSesudah,
                'metode_pembayaran' => $request->metode_pembayaran,
                'status_pembayaran' => $statusPembayaran,
                'keterangan' => $request->keterangan,
                'kwitansi_snapshot' => $kwitansiSnapshot,
            ]);

            $this->updateTagihan($tagihan, $request->nominal_bayar);
            $this->createTransaksiKas($tagihan, $request, $pembayaran->id);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Pembayaran berhasil diproses',
                'data' => $pembayaran->load(['santri', 'tagihanSantri', 'bukuKas']),
                'status_code' => 201,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Pembayaran error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Gagal memproses pembayaran: ' . $e->getMessage(), 'status_code' => 500];
        }
    }

    public function getDetail(string $id): array
    {
        $pembayaran = Pembayaran::with(['santri', 'tagihanSantri.jenisTagihan', 'bukuKas'])->find($id);

        if (!$pembayaran) {
            return ['success' => false, 'message' => 'Pembayaran tidak ditemukan', 'status_code' => 404];
        }

        return ['success' => true, 'data' => $pembayaran];
    }

    public function getTagihanBySantri(string $santriId): array
    {
        $tagihan = TagihanSantri::with('jenisTagihan')
            ->where('santri_id', $santriId)
            ->whereIn('status', ['belum_bayar', 'sebagian'])
            ->orderBy('tahun', 'asc')
            ->orderByRaw("CASE bulan
                WHEN 'Januari' THEN 1
                WHEN 'Februari' THEN 2
                WHEN 'Maret' THEN 3
                WHEN 'April' THEN 4
                WHEN 'Mei' THEN 5
                WHEN 'Juni' THEN 6
                WHEN 'Juli' THEN 7
                WHEN 'Agustus' THEN 8
                WHEN 'September' THEN 9
                WHEN 'Oktober' THEN 10
                WHEN 'November' THEN 11
                WHEN 'Desember' THEN 12
                END")
            ->get();

        return ['success' => true, 'data' => $tagihan];
    }

    public function deletePembayaran(string $id): array
    {
        try {
            DB::beginTransaction();

            $pembayaran = Pembayaran::with('tagihanSantri', 'bukuKas')->find($id);

            if (!$pembayaran) {
                return ['success' => false, 'message' => 'Pembayaran tidak ditemukan', 'status_code' => 404];
            }

            $this->rollbackTagihan($pembayaran);
            TransaksiKas::where('pembayaran_id', $pembayaran->id)->delete();
            $this->rollbackWalletDistribution($pembayaran);

            $pembayaran->delete();

            DB::commit();

            return ['success' => true, 'message' => 'Pembayaran berhasil dibatalkan'];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => 'Gagal membatalkan pembayaran: ' . $e->getMessage(), 'status_code' => 500];
        }
    }

    private function generateKwitansiSnapshot(Request $request, TagihanSantri $tagihan, string $noTransaksi, float $sisaSebelum, float $sisaSesudah, string $status): array
    {
        return $request->kwitansi_data ?? [
            'no_kwitansi' => strtoupper(substr(md5($noTransaksi . time()), 0, 9)),
            'type' => $status,
            'santri' => [
                'nis' => $tagihan->santri->nis,
                'nama_santri' => $tagihan->santri->nama,
                'kelas' => $tagihan->santri->kelas?->nama_kelas ?? '-',
            ],
            'tagihan' => [
                'jenis_tagihan' => $tagihan->jenisTagihan->nama_tagihan,
                'bulan' => $tagihan->bulan,
                'tahun' => $tagihan->tahun,
                'nominal' => (float) $tagihan->nominal,
            ],
            'pembayaran' => [
                'nominal_bayar' => (float) $request->nominal_bayar,
                'sisa_sebelum' => (float) $sisaSebelum,
                'sisa_sesudah' => (float) $sisaSesudah,
                'metode_pembayaran' => $request->metode_pembayaran,
                'tanggal_bayar' => $request->tanggal_bayar,
            ],
            'admin' => $request->user()?->name ?? 'Admin',
            'tanggal_cetak' => now()->setTimezone('Asia/Jakarta')->format('d F Y'),
            'jam_cetak' => now()->setTimezone('Asia/Jakarta')->format('H:i:s') . ' WIB',
        ];
    }

    private function updateTagihan(TagihanSantri $tagihan, float $nominalBayar): void
    {
        $dibayarBaru = $tagihan->dibayar + $nominalBayar;
        $sisaBaru = $tagihan->sisa - $nominalBayar;

        $statusTagihan = 'belum_bayar';
        if ($dibayarBaru >= $tagihan->nominal) {
            $statusTagihan = 'lunas';
        } elseif ($dibayarBaru > 0) {
            $statusTagihan = 'sebagian';
        }

        $tagihan->update([
            'dibayar' => $dibayarBaru,
            'sisa' => $sisaBaru,
            'status' => $statusTagihan,
        ]);
    }

    private function createTransaksiKas(TagihanSantri $tagihan, Request $request, int $pembayaranId): void
    {
        $maxRetries = 5;
        $transaksiKasCreated = false;

        for ($i = 0; $i < $maxRetries; $i++) {
            try {
                $noTransaksiKas = TransaksiKas::generateNoTransaksi('pemasukan');
                if ($i > 0) $noTransaksiKas .= '-' . $i;

                TransaksiKas::create([
                    'buku_kas_id' => $tagihan->jenisTagihan->buku_kas_id,
                    'no_transaksi' => $noTransaksiKas,
                    'tanggal' => $request->tanggal_bayar,
                    'jenis' => 'pemasukan',
                    'metode' => $request->metode_pembayaran,
                    'kategori' => 'Pembayaran Tagihan',
                    'nominal' => $request->nominal_bayar,
                    'keterangan' => $request->keterangan ?? "Pembayaran {$tagihan->jenisTagihan->nama_tagihan} - {$tagihan->bulan} {$tagihan->tahun}",
                    'pembayaran_id' => $pembayaranId,
                    'created_by' => auth()->id(),
                ]);

                $transaksiKasCreated = true;
                break;
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() !== '23000') throw $e;
                usleep(100000);
            }
        }

        if (!$transaksiKasCreated) {
            throw new \Exception('Gagal membuat transaksi kas setelah beberapa percobaan');
        }
    }

    private function rollbackTagihan(Pembayaran $pembayaran): void
    {
        $tagihan = $pembayaran->tagihanSantri;
        $tagihan->increment('sisa', $pembayaran->nominal_bayar);
        $tagihan->decrement('dibayar', $pembayaran->nominal_bayar);

        $statusTagihan = 'belum_bayar';
        if ($tagihan->dibayar >= $tagihan->nominal) {
            $statusTagihan = 'lunas';
        } elseif ($tagihan->dibayar > 0) {
            $statusTagihan = 'sebagian';
        }
        $tagihan->update(['status' => $statusTagihan]);
    }

    private function rollbackWalletDistribution(Pembayaran $pembayaran): void
    {
        $snapshot = $pembayaran->kwitansi_snapshot;
        $distribusi = $snapshot['kembalian_distribusi'] ?? null;

        if (!$distribusi) return;

        $dompetAmt = (float) ($distribusi['dompet'] ?? 0);
        $tabunganAmt = (float) ($distribusi['tabungan'] ?? 0);

        if ($dompetAmt > 0) {
            $wallet = Wallet::where('santri_id', $pembayaran->santri_id)->first();
            if ($wallet) {
                $txn = WalletTransaction::where('wallet_id', $wallet->id)
                    ->where('type', 'credit')
                    ->where('amount', $dompetAmt)
                    ->where('description', 'like', 'Kembalian%')
                    ->latest()
                    ->first();
                if ($txn) {
                    $wallet->decrement('balance', $dompetAmt);
                    $txn->delete();
                }
            }
        }

        if ($tabunganAmt > 0) {
            $tabungan = SantriTabungan::where('santri_id', $pembayaran->santri_id)->first();
            if ($tabungan) {
                $trx = SantriTabunganTransaction::where('tabungan_id', $tabungan->id)
                    ->where('type', 'setor')
                    ->where('amount', $tabunganAmt)
                    ->where('description', 'like', 'Kembalian%')
                    ->latest()
                    ->first();
                if ($trx) {
                    $tabungan->decrement('saldo', $tabunganAmt);
                    $trx->delete();
                }
            }
        }
    }
}
