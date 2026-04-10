<?php

namespace App\Services\Tagihan;

use App\Models\JenisTagihan;
use App\Models\TagihanSantri;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TagihanBulkService
{
    private const BULAN_MAP = [
        'Januari' => 1, 'Februari' => 2, 'Maret' => 3, 'April' => 4,
        'Mei' => 5, 'Juni' => 6, 'Juli' => 7, 'Agustus' => 8,
        'September' => 9, 'Oktober' => 10, 'November' => 11, 'Desember' => 12,
    ];

    public function createTunggakan(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'tunggakan' => 'required|array|min:1',
            'tunggakan.*.santri_id' => 'required|exists:santri,id',
            'tunggakan.*.jenis_tagihan_id' => 'required|exists:jenis_tagihan,id',
            'tunggakan.*.bulan' => 'required|string',
            'tunggakan.*.nominal' => 'required|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return ['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors(), 'status_code' => 422];
        }

        try {
            DB::beginTransaction();

            $created = 0;
            $duplicates = 0;
            $tahunAjaran = TahunAjaran::where('status', 'aktif')->first();

            foreach ($request->tunggakan as $item) {
                $tahun = isset($item['tahun']) ? (int) $item['tahun'] : $this->resolveTahun($item['bulan'], $tahunAjaran);

                $exists = TagihanSantri::where('santri_id', $item['santri_id'])
                    ->where('jenis_tagihan_id', $item['jenis_tagihan_id'])
                    ->where('bulan', $item['bulan'])
                    ->where('tahun', $tahun)
                    ->exists();

                if ($exists) { $duplicates++; continue; }

                $jenisTagihan = JenisTagihan::find($item['jenis_tagihan_id']);

                TagihanSantri::create([
                    'santri_id' => $item['santri_id'],
                    'jenis_tagihan_id' => $item['jenis_tagihan_id'],
                    'bulan' => $item['bulan'],
                    'tahun' => $tahun,
                    'nominal' => $item['nominal'],
                    'dibayar' => 0,
                    'sisa' => $item['nominal'],
                    'status' => 'belum_bayar',
                    'jatuh_tempo' => $jenisTagihan?->jatuh_tempo ?? 'Tanggal 10 setiap bulan',
                ]);

                $created++;
            }

            DB::commit();

            $msg = "Berhasil membuat {$created} tunggakan" . ($duplicates > 0 ? ", {$duplicates} duplikat diabaikan" : '');
            return ['success' => true, 'message' => $msg, 'created' => $created, 'duplicates' => $duplicates, 'status_code' => 201];
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Create tunggakan error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Gagal membuat tunggakan: ' . $e->getMessage(), 'status_code' => 500];
        }
    }

    public function bulkDelete(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'jenis_tagihan_id' => 'required|exists:jenis_tagihan,id',
            'tahun' => 'sometimes|integer',
            'bulan' => 'sometimes|string',
            'santri_ids' => 'sometimes|array',
            'santri_ids.*' => 'exists:santri,id',
        ]);

        if ($validator->fails()) {
            return ['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors(), 'status_code' => 422];
        }

        try {
            DB::beginTransaction();

            $query = TagihanSantri::where('jenis_tagihan_id', $request->jenis_tagihan_id)
                ->where('status', 'belum_bayar');

            if ($request->has('tahun')) $query->where('tahun', $request->tahun);
            if ($request->has('bulan')) $query->where('bulan', $request->bulan);
            if ($request->has('santri_ids')) $query->whereIn('santri_id', $request->santri_ids);

            $count = $query->count();
            $query->delete();

            DB::commit();

            return ['success' => true, 'message' => "{$count} tagihan berhasil dihapus", 'deleted_count' => $count];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => 'Gagal menghapus tagihan: ' . $e->getMessage(), 'status_code' => 500];
        }
    }

    public function bulkUpdateNominal(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'jenis_tagihan_id' => 'required|exists:jenis_tagihan,id',
            'nominal_baru' => 'required|numeric|min:0',
            'tahun' => 'sometimes|integer',
            'bulan' => 'sometimes|string',
            'santri_ids' => 'sometimes|array',
            'santri_ids.*' => 'exists:santri,id',
        ]);

        if ($validator->fails()) {
            return ['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors(), 'status_code' => 422];
        }

        try {
            DB::beginTransaction();

            $query = TagihanSantri::where('jenis_tagihan_id', $request->jenis_tagihan_id)
                ->where('status', 'belum_bayar');

            if ($request->has('tahun')) $query->where('tahun', $request->tahun);
            if ($request->has('bulan')) $query->where('bulan', $request->bulan);
            if ($request->has('santri_ids')) $query->whereIn('santri_id', $request->santri_ids);

            $count = $query->count();
            $query->update(['nominal' => $request->nominal_baru, 'sisa' => $request->nominal_baru]);

            DB::commit();

            return ['success' => true, 'message' => "{$count} tagihan berhasil diperbarui", 'updated_count' => $count];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => 'Gagal memperbarui tagihan: ' . $e->getMessage(), 'status_code' => 500];
        }
    }

    public function cleanupOrphan(): array
    {
        try {
            DB::beginTransaction();

            $orphanCount = DB::table('tagihan_santri')
                ->leftJoin('jenis_tagihan', 'tagihan_santri.jenis_tagihan_id', '=', 'jenis_tagihan.id')
                ->whereNull('jenis_tagihan.id')
                ->whereNull('tagihan_santri.deleted_at')
                ->count();

            if ($orphanCount === 0) {
                return ['success' => true, 'message' => 'Tidak ada data orphan yang perlu dibersihkan', 'deleted_count' => 0];
            }

            DB::table('tagihan_santri')
                ->leftJoin('jenis_tagihan', 'tagihan_santri.jenis_tagihan_id', '=', 'jenis_tagihan.id')
                ->whereNull('jenis_tagihan.id')
                ->whereNull('tagihan_santri.deleted_at')
                ->delete();

            DB::commit();

            return ['success' => true, 'message' => "{$orphanCount} tagihan orphan berhasil dihapus", 'deleted_count' => $orphanCount];
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Cleanup orphan error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Gagal membersihkan data orphan: ' . $e->getMessage(), 'status_code' => 500];
        }
    }

    private function resolveTahun(string $bulan, ?TahunAjaran $tahunAjaran): int
    {
        $bulanNum = self::BULAN_MAP[$bulan] ?? 1;
        $tahunMulai = $tahunAjaran?->tahun_mulai ?? (int) date('Y');
        $tahunAkhir = $tahunAjaran?->tahun_akhir ?? ((int) date('Y') + 1);
        return $bulanNum >= 7 ? $tahunMulai : $tahunAkhir;
    }
}
