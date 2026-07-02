<?php

namespace App\Services\Tagihan;

use App\Models\KeuanganAuditLog;
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
            'bulan_list' => 'sometimes|array|min:1',
            'bulan_list.*' => 'string',
            'santri_ids' => 'sometimes|array',
            'santri_ids.*' => 'exists:santri,id',
            'target_mode' => 'sometimes|string|in:kelas,perorangan',
            'target_kelas' => 'sometimes|array',
            'target_kelas.*' => 'string',
        ]);

        if ($validator->fails()) {
            return ['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors(), 'status_code' => 422];
        }

        try {
            DB::beginTransaction();

            $query = TagihanSantri::where('jenis_tagihan_id', $request->jenis_tagihan_id)
                ->where('status', 'belum_bayar')
                ->where('dibayar', 0)
                ->whereDoesntHave('pembayaran');

            if ($request->has('tahun')) $query->where('tahun', $request->tahun);

            $bulanList = collect($request->input('bulan_list', []))
                ->filter(fn ($bulan) => is_string($bulan) && $bulan !== '')
                ->unique()
                ->values();

            if ($request->filled('bulan') && !$bulanList->contains($request->bulan)) {
                $bulanList->push($request->bulan);
            }

            if ($bulanList->isNotEmpty()) {
                $query->whereIn('bulan', $bulanList->all());
            }

            if ($request->has('santri_ids')) $query->whereIn('santri_id', $request->santri_ids);

            $count = $query->count();
            $query->delete();

            DB::commit();

            $this->logBulkDeleteAction($request, $count, $bulanList->all());

            return ['success' => true, 'message' => "{$count} tagihan berhasil dihapus", 'deleted_count' => $count];
        } catch (\Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => 'Gagal menghapus tagihan: ' . $e->getMessage(), 'status_code' => 500];
        }
    }

    private function logBulkDeleteAction(Request $request, int $deletedCount, array $bulanList): void
    {
        $payload = [
            'jenis_tagihan_id' => (int) $request->jenis_tagihan_id,
            'tahun' => $request->input('tahun'),
            'bulan_list' => $bulanList,
            'santri_ids' => $request->input('santri_ids', []),
            'target_mode' => $request->input('target_mode'),
            'target_kelas' => $request->input('target_kelas', []),
        ];

        $result = [
            'deleted_count' => $deletedCount,
            'processed_at' => now()->toDateTimeString(),
        ];

        $logData = [
            'user_id' => optional($request->user())->id,
            'action' => 'bulk_delete_tagihan',
            'entity' => 'tagihan_santri',
            'filters' => $payload,
            'result' => $result,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 1024),
        ];

        try {
            KeuanganAuditLog::create($logData);
        } catch (\Throwable $e) {
            \Log::warning('Keuangan audit log insert failed: ' . $e->getMessage(), $logData);
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
