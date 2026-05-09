<?php

namespace App\Services\Tagihan;

use App\Models\JenisTagihan;
use App\Models\Santri;
use App\Models\TagihanSantri;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TagihanGenerateService
{
    private const BULAN_MAP = [
        'Januari' => 1, 'Februari' => 2, 'Maret' => 3, 'April' => 4,
        'Mei' => 5, 'Juni' => 6, 'Juli' => 7, 'Agustus' => 8,
        'September' => 9, 'Oktober' => 10, 'November' => 11, 'Desember' => 12,
    ];

    public function generate(Request $request): array
    {
        $validator = Validator::make($request->all(), [
            'jenis_tagihan_id' => 'required|exists:jenis_tagihan,id',
        ]);

        if ($validator->fails()) {
            return ['success' => false, 'message' => 'Validation error', 'errors' => $validator->errors(), 'status_code' => 422];
        }

        try {
            DB::beginTransaction();

            $jenisTagihan = JenisTagihan::findOrFail($request->jenis_tagihan_id);
            $tahunAjaran = TahunAjaran::where('status', 'aktif')->first();

            if (!$tahunAjaran) {
                throw new \Exception('Tidak ada tahun ajaran aktif');
            }

            $santriList = $this->getSantriByTipeNominal($jenisTagihan);
            $totalGenerated = 0;

            foreach ($santriList as $santriData) {
                foreach ($jenisTagihan->bulan as $bulan) {
                    $bulanAngka = self::BULAN_MAP[$bulan] ?? 1;
                    $tahun = ($bulanAngka >= $tahunAjaran->bulan_mulai)
                        ? $tahunAjaran->tahun_mulai
                        : $tahunAjaran->tahun_akhir;

                    $exists = TagihanSantri::where('santri_id', $santriData['santri_id'])
                        ->where('jenis_tagihan_id', $jenisTagihan->id)
                        ->where('bulan', $bulan)
                        ->where('tahun', $tahun)
                        ->exists();

                    if ($exists) continue;

                    TagihanSantri::create([
                        'santri_id' => $santriData['santri_id'],
                        'jenis_tagihan_id' => $jenisTagihan->id,
                        'bulan' => $bulan,
                        'tahun' => $tahun,
                        'nominal' => $santriData['nominal'],
                        'status' => 'belum_bayar',
                        'dibayar' => 0,
                        'sisa' => $santriData['nominal'],
                        'jatuh_tempo' => $jenisTagihan->jatuh_tempo,
                    ]);

                    $totalGenerated++;
                }
            }

            DB::commit();

            return [
                'success' => true,
                'message' => "Berhasil generate {$totalGenerated} tagihan untuk " . count($santriList) . " santri",
                'data' => ['total_tagihan' => $totalGenerated, 'total_santri' => count($santriList)],
                'status_code' => 201,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Generate tagihan error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Gagal generate tagihan: ' . $e->getMessage(), 'status_code' => 500];
        }
    }

    private function getSantriByTipeNominal(JenisTagihan $jenisTagihan): array
    {
        if ($jenisTagihan->tipe_nominal === 'sama') {
            // FIX: Hanya santri dengan status 'aktif' yang dapat tagihan
            $santriList = Santri::where('status', 'aktif')->get()->map(fn($s) => [
                'santri_id' => $s->id,
                'nominal' => $jenisTagihan->nominal_sama ?? 0,
            ])->toArray();
            \Log::info('Generate - Tipe SAMA', ['count' => count($santriList), 'nominal' => $jenisTagihan->nominal_sama]);
            return $santriList;
        }

        if ($jenisTagihan->tipe_nominal === 'per_kelas') {
            \Log::info('Generate - Tipe PER_KELAS', [
                'nominal_per_kelas_raw' => $jenisTagihan->nominal_per_kelas,
                'nominal_per_kelas_count' => count($jenisTagihan->nominal_per_kelas ?? [])
            ]);
            
            $list = [];
            foreach ($jenisTagihan->nominal_per_kelas ?? [] as $kelasData) {
                $namaKelas = $kelasData['kelas'] ?? null;
                \Log::info('Generate - Processing Kelas', ['kelas' => $namaKelas, 'nominal' => $kelasData['nominal'] ?? 0]);
                
                if (!$namaKelas) continue;
                
                // FIX: Cari santri berdasarkan kelas_nama langsung (lebih reliable)
                // karena tidak semua santri punya kelas_id yang valid
                // HANYA santri dengan status 'aktif'
                $santriInKelas = Santri::where('kelas_nama', $namaKelas)
                    ->where('status', 'aktif')
                    ->get();
                
                // Fallback: jika tidak ada, coba lewat relasi kelas
                if ($santriInKelas->isEmpty()) {
                    $santriInKelas = Santri::whereHas('kelas', fn($q) => $q->where('nama_kelas', $namaKelas))
                        ->where('status', 'aktif')
                        ->get();
                }
                
                \Log::info('Generate - Santri Found', ['kelas' => $namaKelas, 'count' => $santriInKelas->count()]);
                
                // FIX: Gunakan foreach biasa, bukan each() yang tidak return nilai
                foreach ($santriInKelas as $s) {
                    $list[] = [
                        'santri_id' => $s->id, 
                        'nominal' => $kelasData['nominal'] ?? 0
                    ];
                }
            }
            
            \Log::info('Generate - Total Santri Per Kelas', ['total' => count($list)]);
            return $list;
        }

        if ($jenisTagihan->tipe_nominal === 'per_individu') {
            $list = [];
            foreach ($jenisTagihan->nominal_per_individu ?? [] as $item) {
                if (empty($item['santriId'])) continue;
                
                // FIX: Validasi bahwa santri aktif
                $santri = Santri::where('id', $item['santriId'])
                    ->where('status', 'aktif')
                    ->first();
                    
                if ($santri) {
                    $list[] = ['santri_id' => $item['santriId'], 'nominal' => $item['nominal'] ?? 0];
                }
            }
            \Log::info('Generate - Tipe PER_INDIVIDU', ['count' => count($list)]);
            return $list;
        }

        return [];
    }
}
