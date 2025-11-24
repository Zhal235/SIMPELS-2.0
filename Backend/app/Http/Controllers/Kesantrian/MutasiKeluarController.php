<?php

namespace App\Http\Controllers\Kesantrian;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MutasiKeluar;
use App\Models\Santri;
use App\Models\TagihanSantri;
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
            $mutasi = MutasiKeluar::create([
                'santri_id' => $data['santri_id'],
                'tanggal_mutasi' => $data['tanggal_mutasi'],
                'tujuan' => $data['tujuan'] ?? null,
                'alasan' => $data['alasan'] ?? null,
                'created_by' => $request->user()?->id ?? null,
            ]);

            // Update santri status dan keluarkan dari kelas/asrama
            $santri = Santri::findOrFail($data['santri_id']);
            $santri->status = 'mutasi_keluar';
            $santri->kelas_id = null;
            $santri->asrama_id = null;
            $santri->save();

            // Delete (soft-delete) tagihan that occur after mutasi date
            $mutasiDate = Carbon::parse($data['tanggal_mutasi']);

            $bulanMap = [
                'Januari'=>1,'Februari'=>2,'Maret'=>3,'April'=>4,
                'Mei'=>5,'Juni'=>6,'Juli'=>7,'Agustus'=>8,'September'=>9,
                'Oktober'=>10,'November'=>11,'Desember'=>12
            ];

            $tagihans = TagihanSantri::where('santri_id', $santri->id)->get();

            foreach ($tagihans as $tagihan) {
                $monthNum = $bulanMap[$tagihan->bulan] ?? 1;
                $tagihanDate = Carbon::createFromDate($tagihan->tahun, $monthNum, 1);

                // If tagihan occurs AFTER mutasi month/year, delete
                if ($tagihanDate->gt($mutasiDate->copy()->startOfMonth())) {
                    // Determine if it's tunggakan: already due and has sisa > 0
                    $isTunggakan = ($tagihanDate->lte(now()) && $tagihan->sisa > 0);
                    if (!$isTunggakan) {
                        $tagihan->delete(); // soft-delete
                    }
                }
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Mutasi keluar berhasil disimpan', 'data' => $mutasi], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('MutasiKeluar store error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan mutasi keluar: ' . $e->getMessage()], 500);
        }
    }
}
