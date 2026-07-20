<?php

namespace App\Http\Controllers\Kesantrian;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MutasiKeluar;
use App\Models\Santri;
use App\Models\TagihanSantri;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class MutasiKeluarController extends Controller
{
    public function index()
    {
        // List all mutasi keluar with santri info
        $items = MutasiKeluar::with('santri')->orderBy('tanggal_mutasi', 'desc')->get();
        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'santri_id' => 'required|exists:santri,id',
            'tanggal_mutasi' => 'required|date',
            'tujuan' => 'nullable|string|max:255',
            'alasan' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $result = $this->processMutasiForSantri(
                Santri::findOrFail($data['santri_id']),
                Carbon::parse($data['tanggal_mutasi']),
                $data['tujuan'] ?? null,
                $data['alasan'] ?? null,
                $request->user()?->id ?? null
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Mutasi keluar berhasil disimpan' . ($result['returned_balance'] > 0 ? '. Saldo dompet saat mutasi: Rp ' . number_format($result['returned_balance'], 0, ',', '.') . '.' : '.'),
                'data' => $result['mutasi'],
                'returned_balance' => $result['returned_balance'],
                'wallet_deactivated' => $result['wallet_deactivated'],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('MutasiKeluar store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan mutasi keluar: ' . $e->getMessage()], 500);
        }
    }

    public function bulkStore(Request $request)
    {
        $data = $request->validate([
            'kelas_id' => 'required|exists:kelas,id',
            'santri_ids' => 'required|array|min:1',
            'santri_ids.*' => 'required|exists:santri,id',
            'tanggal_mutasi' => 'required|date',
            'tujuan' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $mutasiDate = Carbon::parse($data['tanggal_mutasi']);
            $selectedSantriIds = collect($data['santri_ids'])->unique()->values()->all();
            $santriList = Santri::where('kelas_id', $data['kelas_id'])
                ->where('status', 'aktif')
                ->whereIn('id', $selectedSantriIds)
                ->orderBy('nama_santri')
                ->get();

            if ($santriList->isEmpty()) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Tidak ada santri aktif yang cocok pada kelas yang dipilih'], 422);
            }

            if ($santriList->count() !== count($selectedSantriIds)) {
                DB::rollBack();
                return response()->json(['success' => false, 'message' => 'Ada santri yang tidak sesuai dengan kelas aktif yang dipilih'], 422);
            }

            $processed = [];
            $totalReturned = 0;
            $walletDeactivated = 0;

            foreach ($santriList as $santri) {
                $result = $this->processMutasiForSantri(
                    $santri,
                    $mutasiDate,
                    $data['tujuan'] ?? null,
                    $data['keterangan'] ?? null,
                    $request->user()?->id ?? null
                );

                $processed[] = [
                    'santri_id' => $santri->id,
                    'nama_santri' => $santri->nama_santri,
                    'returned_balance' => $result['returned_balance'],
                ];
                $totalReturned += $result['returned_balance'];
                if ($result['wallet_deactivated']) {
                    $walletDeactivated++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bulk mutasi keluar berhasil diproses',
                'processed_count' => count($processed),
                'returned_balance_total' => $totalReturned,
                'wallet_deactivated_count' => $walletDeactivated,
                'data' => $processed,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('MutasiKeluar bulkStore error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal memproses bulk mutasi: ' . $e->getMessage()], 500);
        }
    }

    private function processMutasiForSantri(Santri $santri, Carbon $mutasiDate, ?string $tujuan, ?string $alasan, ?int $userId): array
    {
        $mutasi = MutasiKeluar::create([
            'santri_id' => $santri->id,
            'tanggal_mutasi' => $mutasiDate->toDateString(),
            'tujuan' => $tujuan,
            'alasan' => $alasan,
            'created_by' => $userId,
        ]);

        $santri->status = 'mutasi_keluar';
        $santri->kelas_id = null;
        $santri->asrama_id = null;
        $santri->save();

        $bulanMap = [
            'Januari'=>1,'Februari'=>2,'Maret'=>3,'April'=>4,
            'Mei'=>5,'Juni'=>6,'Juli'=>7,'Agustus'=>8,'September'=>9,
            'Oktober'=>10,'November'=>11,'Desember'=>12
        ];

        $tagihans = TagihanSantri::where('santri_id', $santri->id)->get();

        foreach ($tagihans as $tagihan) {
            $monthNum = $bulanMap[$tagihan->bulan] ?? 1;
            $tagihanDate = Carbon::createFromDate($tagihan->tahun, $monthNum, 1);

            if ($tagihanDate->gt($mutasiDate->copy()->startOfMonth())) {
                $isTunggakan = ($tagihanDate->lte(now()) && $tagihan->sisa > 0);
                $hasPembayaran = $tagihan->pembayaran()->exists();
                if (!$isTunggakan && !$hasPembayaran) {
                    $tagihan->delete();
                }
            }
        }

        $wallet = Wallet::where('santri_id', $santri->id)->first();
        $returnedBalance = $wallet ? (float) $wallet->balance : 0;
        $walletDeactivated = false;

        if ($wallet && (float) $wallet->balance === 0.0 && (bool) $wallet->is_active) {
            $wallet->is_active = false;
            $wallet->save();
            $walletDeactivated = true;
        }

        return [
            'mutasi' => $mutasi,
            'returned_balance' => $returnedBalance,
            'wallet_deactivated' => $walletDeactivated,
        ];
    }
}
