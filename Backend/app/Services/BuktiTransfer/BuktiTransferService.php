<?php

namespace App\Services\BuktiTransfer;

use App\Models\BuktiTransfer;
use App\Models\Pembayaran;
use App\Models\TagihanSantri;
use App\Models\TransaksiKas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BuktiTransferService
{
    public function getList(Request $request): array
    {
        $query = BuktiTransfer::with(['santri', 'processedBy', 'selectedBank']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', 'pending');
        }

        $buktiList = $query->orderBy('uploaded_at', 'desc')
            ->get()
            ->map(fn($bukti) => $this->transformBukti($bukti));

        return ['success' => true, 'data' => $buktiList];
    }

    public function approveBukti(Request $request, string $id): array
    {
        try {
            DB::beginTransaction();

            $bukti = BuktiTransfer::findOrFail($id);

            if ($bukti->status !== 'pending') {
                return ['success' => false, 'error' => 'Bukti transfer sudah diproses sebelumnya', 'status_code' => 400];
            }

            $isTopupOnly = $bukti->jenis_transaksi === 'topup';
            $catatanAdmin = $bukti->catatan_admin ?? '';

            [$nominalTopup, $nominalTabungan] = $this->resolveNominals($request, $bukti, $isTopupOnly, $catatanAdmin);
            $nominalPembayaran = $isTopupOnly ? 0 : max(0, $bukti->total_nominal - $nominalTopup - $nominalTabungan);

            $santri = \App\Models\Santri::find($bukti->santri_id);
            $namaSantri = $santri?->nama_santri ?? $santri?->nama_lengkap ?? 'Santri';

            if (!$isTopupOnly && $bukti->tagihan_ids && count($bukti->tagihan_ids) > 0) {
                $this->processTagihan($bukti, $namaSantri);
            }

            if ($nominalTopup > 0) {
                $this->processTopup($bukti->santri_id, $nominalTopup);
            }

            if ($nominalTabungan > 0) {
                $this->processTabungan($bukti->santri_id, $nominalTabungan);
            }

            $catatanFinal = $this->buildCatatanAdmin($request, $bukti, $nominalPembayaran, $nominalTopup, $nominalTabungan, $catatanAdmin, $isTopupOnly);

            $bukti->update([
                'status' => 'approved',
                'catatan_admin' => $catatanFinal,
                'processed_at' => now(),
                'processed_by' => Auth::id(),
            ]);

            DB::commit();

            $jenisLabel = $this->buildJenisLabel($nominalPembayaran, $nominalTopup, $nominalTabungan);
            \App\Services\NotificationService::paymentApproved($bukti->santri_id, $jenisLabel, $bukti->total_nominal);

            return ['success' => true, 'message' => 'Bukti transfer berhasil disetujui dan pembayaran diproses'];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error approving bukti transfer: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return ['success' => false, 'error' => $e->getMessage(), 'trace' => config('app.debug') ? $e->getTraceAsString() : null, 'status_code' => 500];
        }
    }

    public function rejectBukti(Request $request, string $id): array
    {
        try {
            $bukti = BuktiTransfer::findOrFail($id);

            if ($bukti->status !== 'pending') {
                return ['success' => false, 'error' => 'Bukti transfer sudah diproses sebelumnya', 'status_code' => 400];
            }

            $bukti->update([
                'status' => 'rejected',
                'catatan_admin' => $request->catatan,
                'processed_at' => now(),
                'processed_by' => Auth::id(),
            ]);

            \App\Services\NotificationService::paymentRejected($bukti->santri_id, $request->catatan);

            return ['success' => true, 'message' => 'Bukti transfer ditolak'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage(), 'status_code' => 500];
        }
    }

    private function transformBukti(BuktiTransfer $bukti): array
    {
        $tagihans = $this->getTagihan($bukti);
        [$nominalTopup, $nominalTabungan] = $this->parseNominalsFromCatatan($bukti);

        return [
            'id' => $bukti->id,
            'jenis_transaksi' => $bukti->jenis_transaksi ?? 'pembayaran',
            'santri' => $bukti->santri ? [
                'id' => $bukti->santri->id,
                'nis' => $bukti->santri->nis,
                'nama' => $bukti->santri->nama_santri ?? $bukti->santri->nama,
                'kelas' => $bukti->santri->kelas?->nama_kelas ?? $bukti->santri->kelas?->nama,
            ] : null,
            'selected_bank' => $bukti->selectedBank ? [
                'id' => $bukti->selectedBank->id,
                'bank_name' => $bukti->selectedBank->bank_name,
                'account_number' => $bukti->selectedBank->account_number,
                'account_name' => $bukti->selectedBank->account_name,
            ] : null,
            'total_nominal' => $bukti->total_nominal,
            'nominal_topup' => $nominalTopup,
            'nominal_tabungan' => $nominalTabungan,
            'status' => $bukti->status,
            'catatan_wali' => $bukti->catatan_wali,
            'catatan_admin' => $bukti->catatan_admin,
            'bukti_url' => $bukti->bukti_url,
            'uploaded_at' => $bukti->uploaded_at->format('Y-m-d H:i:s'),
            'processed_at' => $bukti->processed_at?->format('Y-m-d H:i:s'),
            'processed_by' => $bukti->processedBy?->name,
            'tagihan' => $tagihans->map(fn($t) => [
                'id' => $t->id,
                'jenis' => $t->jenisTagihan->nama_tagihan ?? 'Biaya',
                'bulan' => $t->bulan,
                'tahun' => $t->tahun,
                'nominal' => $t->nominal,
                'dibayar' => $t->dibayar,
                'sisa' => $t->sisa,
                'status' => $t->status,
                'nominal_bayar' => $bukti->status === 'pending' ? $t->sisa : ($t->nominal_bayar ?? 0),
            ]),
        ];
    }

    private function getTagihan(BuktiTransfer $bukti)
    {
        if (!$bukti->tagihan_ids || count($bukti->tagihan_ids) === 0) {
            return collect([]);
        }

        $tagihans = TagihanSantri::whereIn('id', $bukti->tagihan_ids)->with('jenisTagihan')->get();

        if (in_array($bukti->status, ['approved', 'rejected'])) {
            $pembayaranData = Pembayaran::where('bukti_pembayaran', $bukti->bukti_path)
                ->whereIn('tagihan_santri_id', $bukti->tagihan_ids)
                ->get()
                ->keyBy('tagihan_santri_id');

            $tagihans = $tagihans->map(function ($t) use ($pembayaranData) {
                $pembayaran = $pembayaranData->get($t->id);
                $t->nominal_bayar = $pembayaran?->nominal_bayar ?? 0;
                return $t;
            });
        }

        return $tagihans;
    }

    private function parseNominalsFromCatatan(BuktiTransfer $bukti): array
    {
        $nominalTopup = 0;
        $nominalTabungan = 0;
        $catatan = $bukti->catatan_admin ?? '';

        if ($bukti->jenis_transaksi === 'topup') {
            $nominalTopup = (float) $bukti->total_nominal;
        } elseif (in_array($bukti->jenis_transaksi, ['pembayaran_topup', 'pembayaran_topup_tabungan'])) {
            if (preg_match('/Top-up dompet[:\s]+Rp[\s]*([\d.,]+)/i', $catatan, $m)) {
                $nominalTopup = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            }
        }

        if (in_array($bukti->jenis_transaksi, ['pembayaran_tabungan', 'pembayaran_topup_tabungan'])) {
            if (preg_match('/Setor tabungan[:\s]+Rp[\s]*([\d.,]+)/i', $catatan, $m)) {
                $nominalTabungan = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            }
        }

        return [$nominalTopup, $nominalTabungan];
    }

    private function resolveNominals(Request $request, BuktiTransfer $bukti, bool $isTopupOnly, string $catatanAdmin): array
    {
        // Resolve nominal_topup
        if ($request->has('nominal_topup') && $request->nominal_topup !== null) {
            $nominalTopup = (float) $request->nominal_topup;
        } elseif ($isTopupOnly) {
            $nominalTopup = (float) $bukti->total_nominal;
        } elseif (in_array($bukti->jenis_transaksi, ['pembayaran_topup', 'pembayaran_topup_tabungan'])) {
            if (preg_match('/Top-up dompet[:\s]+Rp[\s]*([\d.,]+)/i', $catatanAdmin, $m)) {
                $nominalTopup = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            } else {
                $nominalTopup = 0;
            }
        } else {
            $nominalTopup = 0;
        }

        // Resolve nominal_tabungan
        if ($request->has('nominal_tabungan') && $request->nominal_tabungan !== null) {
            $nominalTabungan = (float) $request->nominal_tabungan;
        } elseif (in_array($bukti->jenis_transaksi, ['pembayaran_tabungan', 'pembayaran_topup_tabungan'])) {
            if (preg_match('/Setor tabungan[:\s]+Rp[\s]*([\d.,]+)/i', $catatanAdmin, $m)) {
                $nominalTabungan = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            } else {
                $nominalTabungan = 0;
            }
        } else {
            $nominalTabungan = 0;
        }

        return [$nominalTopup, $nominalTabungan];
    }

    private function processTagihan(BuktiTransfer $bukti, string $namaSantri): void
    {
        $tagihans = TagihanSantri::with('jenisTagihan')->whereIn('id', $bukti->tagihan_ids)->get();

        foreach ($tagihans as $tagihan) {
            $sisaTagihan = $tagihan->nominal - $tagihan->dibayar;
            $nominalBayar = $sisaTagihan;
            $sisaSebelum = $sisaTagihan;

            $tagihan->dibayar += $nominalBayar;
            $tagihan->sisa = $tagihan->nominal - $tagihan->dibayar;
            $tagihan->status = $tagihan->sisa <= 0 ? 'lunas' : ($tagihan->dibayar > 0 ? 'sebagian' : 'belum_bayar');
            $tagihan->save();

            $bukuKasId = $this->resolveBukuKasId($tagihan);
            $noTransaksi = Pembayaran::generateNoTransaksi();
            $sisaSesudah = $tagihan->sisa;
            $statusPembayaran = $sisaSesudah <= 0 ? 'lunas' : 'sebagian';

            $pembayaran = Pembayaran::create([
                'tagihan_santri_id' => $tagihan->id,
                'santri_id' => $bukti->santri_id,
                'buku_kas_id' => $bukuKasId,
                'no_transaksi' => $noTransaksi,
                'tanggal_bayar' => now(),
                'nominal_bayar' => $nominalBayar,
                'metode_pembayaran' => 'transfer',
                'status_pembayaran' => $statusPembayaran,
                'sisa_sebelum' => $sisaSebelum,
                'sisa_sesudah' => $sisaSesudah,
                'keterangan' => 'Pembayaran via SIMPELS Mobile - Disetujui oleh ' . (Auth::user()?->name ?? 'Admin'),
                'bukti_pembayaran' => $bukti->bukti_path,
            ]);

            $this->createTransaksiKas($bukuKasId, $nominalBayar, $tagihan, $namaSantri, $pembayaran->id);
        }
    }

    private function resolveBukuKasId(TagihanSantri $tagihan): int
    {
        if ($tagihan->jenisTagihan?->buku_kas_id) {
            return $tagihan->jenisTagihan->buku_kas_id;
        }

        $bukuKasId = DB::table('buku_kas')->value('id');
        if (!$bukuKasId) {
            $bukuKasId = DB::table('buku_kas')->insertGetId([
                'nama_kas' => 'Kas Default',
                'saldo_cash_awal' => 0,
                'saldo_bank_awal' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $bukuKasId;
    }

    private function createTransaksiKas(int $bukuKasId, float $nominalBayar, TagihanSantri $tagihan, string $namaSantri, int $pembayaranId): void
    {
        for ($i = 0; $i < 5; $i++) {
            try {
                $noTransaksiKas = TransaksiKas::generateNoTransaksi('pemasukan');
                if ($i > 0) $noTransaksiKas .= '-' . $i;

                TransaksiKas::create([
                    'buku_kas_id' => $bukuKasId,
                    'no_transaksi' => $noTransaksiKas,
                    'tanggal' => now(),
                    'jenis' => 'pemasukan',
                    'metode' => 'transfer',
                    'kategori' => 'Pembayaran Tagihan',
                    'nominal' => $nominalBayar,
                    'keterangan' => 'Pembayaran ' . $tagihan->jenisTagihan->nama_tagihan . ' - ' . $tagihan->bulan . ' ' . $tagihan->tahun . ' a.n. ' . $namaSantri . ' (via SIMPELS Mobile)',
                    'pembayaran_id' => $pembayaranId,
                    'created_by' => auth()->id(),
                ]);
                break;
            } catch (\Illuminate\Database\QueryException $e) {
                if ($e->getCode() !== '23000') throw $e;
                usleep(100000);
            }
        }
    }

    private function processTopup(int $santriId, float $nominalTopup): void
    {
        $wallet = \App\Models\Wallet::firstOrCreate(['santri_id' => $santriId], ['balance' => 0]);
        $wallet->balance += $nominalTopup;
        $wallet->save();

        DB::table('wallet_transactions')->insert([
            'wallet_id' => (int) $wallet->id,
            'amount' => (float) $nominalTopup,
            'type' => 'credit',
            'method' => 'transfer',
            'description' => 'Top-up via SIMPELS Mobile - Disetujui oleh ' . (Auth::user()?->name ?? 'Admin'),
            'balance_after' => (float) $wallet->balance,
            'created_by' => Auth::id(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Log::info('Wallet topup created', ['wallet_id' => $wallet->id, 'amount' => $nominalTopup, 'balance_after' => $wallet->balance]);
    }

    private function processTabungan(int $santriId, float $nominalTabungan): void
    {
        $tabungan = \App\Models\SantriTabungan::firstOrCreate(['santri_id' => $santriId], ['saldo' => 0, 'status' => 'active', 'opened_at' => now()]);
        $tabungan->saldo += $nominalTabungan;
        $tabungan->save();

        \App\Models\SantriTabunganTransaction::create([
            'tabungan_id' => $tabungan->id,
            'santri_id' => $santriId,
            'type' => 'setor',
            'amount' => (float) $nominalTabungan,
            'saldo_after' => (float) $tabungan->saldo,
            'description' => 'Setor tabungan via SIMPELS Mobile - Disetujui oleh ' . (Auth::user()?->name ?? 'Admin'),
            'method' => 'transfer',
            'recorded_by' => Auth::id(),
        ]);

        Log::info('Tabungan setor created', ['tabungan_id' => $tabungan->id, 'amount' => $nominalTabungan, 'saldo_after' => $tabungan->saldo]);
    }

    private function buildCatatanAdmin(Request $request, BuktiTransfer $bukti, float $nominalPembayaran, float $nominalTopup, float $nominalTabungan, string $catatanOriginal, bool $isTopupOnly): ?string
    {
        $adaCatatanManual = !empty($request->catatan);
        [$originalTopup, $originalTabungan] = $this->parseOriginalNominals($bukti, $isTopupOnly, $catatanOriginal);

        $adaKoreksiTopup = $request->has('nominal_topup') && $nominalTopup != $originalTopup;
        $adaKoreksiTabungan = $request->has('nominal_tabungan') && $nominalTabungan != $originalTabungan;

        if (!$adaCatatanManual && !$adaKoreksiTopup && !$adaKoreksiTabungan) {
            return null;
        }

        $catatan = null;
        if ($adaKoreksiTopup || $adaKoreksiTabungan) {
            $ringkasan = ['Dikoreksi admin:'];
            if ($nominalPembayaran > 0) $ringkasan[] = 'Tagihan Rp ' . number_format($nominalPembayaran, 0, ',', '.');
            if ($nominalTopup > 0) $ringkasan[] = 'Top-up dompet Rp ' . number_format($nominalTopup, 0, ',', '.');
            if ($nominalTabungan > 0) $ringkasan[] = 'Setor tabungan Rp ' . number_format($nominalTabungan, 0, ',', '.');
            $catatan = implode(' ', $ringkasan);
        }

        if ($adaCatatanManual) {
            $catatan = ($catatan ? $catatan . ' ' : '') . trim($request->catatan);
        }

        return $catatan;
    }

    private function parseOriginalNominals(BuktiTransfer $bukti, bool $isTopupOnly, string $catatanOriginal): array
    {
        $originalTopup = 0;
        $originalTabungan = 0;

        if ($isTopupOnly) {
            $originalTopup = (float) $bukti->total_nominal;
        } elseif (in_array($bukti->jenis_transaksi, ['pembayaran_topup', 'pembayaran_topup_tabungan'])) {
            if (preg_match('/Top-up dompet[:\s]+Rp[\s]*([\d.,]+)/i', $catatanOriginal, $m)) {
                $originalTopup = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            }
        }

        if (in_array($bukti->jenis_transaksi, ['pembayaran_tabungan', 'pembayaran_topup_tabungan'])) {
            if (preg_match('/Setor tabungan[:\s]+Rp[\s]*([\d.,]+)/i', $catatanOriginal, $m)) {
                $originalTabungan = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            }
        }

        return [$originalTopup, $originalTabungan];
    }

    private function buildJenisLabel(float $nominalPembayaran, float $nominalTopup, float $nominalTabungan): string
    {
        return implode(' + ', array_filter([
            $nominalPembayaran > 0 ? 'Pembayaran' : null,
            $nominalTopup > 0 ? 'Top-up' : null,
            $nominalTabungan > 0 ? 'Tabungan' : null,
        ])) ?: 'Pembayaran';
    }
}
