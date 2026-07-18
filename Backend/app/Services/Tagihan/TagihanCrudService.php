<?php

namespace App\Services\Tagihan;

use App\Models\TagihanSantri;
use App\Traits\ValidatesDeletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TagihanCrudService
{
    use ValidatesDeletion;

    public function getRekapPerSantri(bool $includeDetail = true): array
    {
        $rekap = DB::table('tagihan_santri')
            ->join('santri', 'tagihan_santri.santri_id', '=', 'santri.id')
            ->join('jenis_tagihan', 'tagihan_santri.jenis_tagihan_id', '=', 'jenis_tagihan.id')
            ->leftJoin('kelas', 'santri.kelas_id', '=', 'kelas.id')
            ->select(
                'santri.id as santri_id',
                'santri.nis as santri_nis',
                'santri.nama_santri as santri_nama',
                'kelas.nama_kelas as kelas',
                DB::raw('SUM(tagihan_santri.nominal) as total_tagihan'),
                DB::raw('SUM(tagihan_santri.dibayar) as total_dibayar'),
                DB::raw('SUM(tagihan_santri.sisa) as sisa_tagihan')
            )
            ->whereNull('tagihan_santri.deleted_at')
            ->whereNull('jenis_tagihan.deleted_at')
            ->groupBy('santri.id', 'santri.nis', 'santri.nama_santri', 'kelas.nama_kelas')
            ->get();

        if ($rekap->isEmpty()) {
            return ['success' => true, 'data' => []];
        }

        $detailBySantri = collect();
        if ($includeDetail) {
            $santriIds = $rekap->pluck('santri_id')->all();

            $latestPembayaranPerTagihan = DB::table('pembayaran')
                ->select('tagihan_santri_id', DB::raw('MAX(tanggal_bayar) as tgl_bayar'))
                ->whereNull('deleted_at')
                ->groupBy('tagihan_santri_id');

            $detailRows = DB::table('tagihan_santri')
                ->join('jenis_tagihan', 'tagihan_santri.jenis_tagihan_id', '=', 'jenis_tagihan.id')
                ->leftJoinSub($latestPembayaranPerTagihan, 'lp', function ($join) {
                    $join->on('lp.tagihan_santri_id', '=', 'tagihan_santri.id');
                })
                ->whereIn('tagihan_santri.santri_id', $santriIds)
                ->whereNull('tagihan_santri.deleted_at')
                ->whereNull('jenis_tagihan.deleted_at')
                ->orderBy('tagihan_santri.santri_id')
                ->orderBy('tagihan_santri.tahun')
                ->orderBy('tagihan_santri.bulan')
                ->select(
                    'tagihan_santri.id',
                    'tagihan_santri.santri_id',
                    'tagihan_santri.jenis_tagihan_id',
                    'tagihan_santri.bulan',
                    'tagihan_santri.tahun',
                    'tagihan_santri.nominal',
                    'tagihan_santri.status',
                    'tagihan_santri.dibayar',
                    'tagihan_santri.sisa',
                    'tagihan_santri.jatuh_tempo',
                    'jenis_tagihan.nama_tagihan as jenis_tagihan',
                    'jenis_tagihan.tahun_ajaran_id',
                    'lp.tgl_bayar'
                )
                ->get();

            $detailBySantri = $detailRows
                ->groupBy('santri_id')
                ->map(function ($rows) {
                    return $rows->map(function ($row) {
                        return [
                            'id' => $row->id,
                            'jenis_tagihan' => $row->jenis_tagihan,
                            'jenis_tagihan_id' => $row->jenis_tagihan_id,
                            'tahun_ajaran_id' => $row->tahun_ajaran_id,
                            'bulan' => $row->bulan,
                            'tahun' => $row->tahun,
                            'nominal' => (float) $row->nominal,
                            'status' => $row->status,
                            'dibayar' => (float) $row->dibayar,
                            'sisa' => (float) $row->sisa,
                            'jatuh_tempo' => $row->jatuh_tempo,
                            'tgl_bayar' => $row->tgl_bayar,
                            'admin_penerima' => $row->tgl_bayar ? 'Admin' : null,
                        ];
                    })->values();
                });
        }

        $result = $rekap->map(function ($item) use ($detailBySantri, $includeDetail) {
            return [
                'santri_id' => $item->santri_id,
                'santri_nis' => $item->santri_nis,
                'santri_nama' => $item->santri_nama,
                'kelas' => $item->kelas,
                'total_tagihan' => (float) $item->total_tagihan,
                'total_dibayar' => (float) $item->total_dibayar,
                'sisa_tagihan' => (float) $item->sisa_tagihan,
                'detail_tagihan' => $includeDetail
                    ? ($detailBySantri->get($item->santri_id)?->values()->all() ?? [])
                    : [],
            ];
        });

        return ['success' => true, 'data' => $result];
    }

    public function findById(string $id): array
    {
        $tagihan = TagihanSantri::with(['santri', 'jenisTagihan'])->find($id);

        if (!$tagihan) {
            return ['success' => false, 'message' => 'Tagihan tidak ditemukan', 'status_code' => 404];
        }

        return ['success' => true, 'data' => $tagihan];
    }

    public function getBySantri(string $santriId): array
    {
        $tagihan = TagihanSantri::with(['jenisTagihan', 'pembayaran'])
            ->where('santri_id', $santriId)
            ->whereNull('deleted_at')
            ->whereHas('jenisTagihan')
            ->orderBy('tahun', 'asc')
            ->orderBy('bulan', 'asc')
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'santri_id' => $t->santri_id,
                'jenis_tagihan_id' => $t->jenis_tagihan_id,
                'bulan' => $t->bulan,
                'tahun' => $t->tahun,
                'nominal' => $t->nominal,
                'status' => $t->status,
                'dibayar' => $t->dibayar,
                'sisa' => $t->sisa,
                'jatuh_tempo' => $t->jatuh_tempo,
                'jenis_tagihan_nama' => $t->jenisTagihan?->nama_tagihan,
                'jenis_tagihan' => $t->jenisTagihan,
                'pembayaran' => $t->pembayaran,
            ]);

        return ['success' => true, 'data' => $tagihan];
    }

    public function updateTagihan(Request $request, string $id): array
    {
        $tagihan = TagihanSantri::find($id);

        if (!$tagihan) {
            return ['success' => false, 'message' => 'Tagihan tidak ditemukan', 'status_code' => 404];
        }

        if ($request->has('nominal')) {
            return $this->updateNominal($request, $tagihan);
        }

        return $this->updatePembayaran($request, $tagihan);
    }

    public function deleteTagihan(string $id): array
    {
        $tagihan = TagihanSantri::with(['santri', 'jenisTagihan'])->find($id);

        if (!$tagihan) {
            return ['success' => false, 'message' => 'Tagihan tidak ditemukan', 'status_code' => 404];
        }

        $santriName = $tagihan->santri?->nama_santri ?? 'Unknown';
        $jenisName = $tagihan->jenisTagihan?->nama_tagihan ?? 'Unknown';

        $validation = $this->validateDeletion($tagihan, [
            'pembayaran' => [
                'label' => 'Pembayaran/Cicilan',
                'action' => "Hapus semua pembayaran yang terkait dengan tagihan ini ({$santriName} - {$jenisName} {$tagihan->bulan} {$tagihan->tahun}) terlebih dahulu (Menu: Pembayaran)",
            ],
        ]);

        if (!$validation['can_delete']) {
            return [
                'success' => false,
                'message' => $validation['message'],
                'reason' => $validation['reason'],
                'dependencies' => $validation['dependencies'],
                'instructions' => $validation['instructions'],
                'status_code' => 422,
            ];
        }

        $tagihan->delete();

        return ['success' => true, 'message' => $validation['message']];
    }

    private function updateNominal(Request $request, TagihanSantri $tagihan): array
    {
        if ($tagihan->dibayar > 0) {
            return ['success' => false, 'message' => 'Tidak dapat mengubah nominal tagihan yang sudah dicicil/dibayar.', 'status_code' => 400];
        }

        $validator = Validator::make($request->all(), ['nominal' => 'required|numeric|min:0']);
        if ($validator->fails()) {
            return ['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors(), 'status_code' => 422];
        }

        $tagihan->update(['nominal' => $request->nominal, 'sisa' => $request->nominal]);

        return ['success' => true, 'message' => 'Nominal tagihan berhasil diperbarui', 'data' => $tagihan];
    }

    private function updatePembayaran(Request $request, TagihanSantri $tagihan): array
    {
        $validator = Validator::make($request->all(), [
            'dibayar' => 'required|numeric|min:0|max:' . $tagihan->nominal,
        ]);

        if ($validator->fails()) {
            return ['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors(), 'status_code' => 422];
        }

        $dibayar = $request->dibayar;
        $sisa = $tagihan->nominal - $dibayar;
        $status = 'belum_bayar';
        if ($dibayar >= $tagihan->nominal) $status = 'lunas';
        elseif ($dibayar > 0) $status = 'sebagian';

        $tagihan->update(['dibayar' => $dibayar, 'sisa' => $sisa, 'status' => $status]);

        return ['success' => true, 'message' => 'Tagihan berhasil diperbarui', 'data' => $tagihan];
    }
}
