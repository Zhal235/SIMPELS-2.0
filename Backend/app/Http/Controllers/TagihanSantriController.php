<?php

namespace App\Http\Controllers;

use App\Models\TagihanSantri;
use App\Models\JenisTagihan;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TagihanSantriController extends Controller
{
    /**
     * Display a listing of the resource (rekap per santri)
     */
    public function index()
    {
        // Groupby per santri dengan total tagihan, dibayar, dan sisa
        $tagihan = DB::table('tagihan_santri')
            ->join('santri', 'tagihan_santri.santri_id', '=', 'santri.id')
            ->join('kelas', 'santri.kelas_id', '=', 'kelas.id')
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
            ->groupBy('santri.id', 'santri.nis', 'santri.nama_santri', 'kelas.nama_kelas')
            ->get();

        // Ambil detail tagihan untuk setiap santri
        $result = $tagihan->map(function ($item) {
            $detailTagihan = TagihanSantri::where('santri_id', $item->santri_id)
                ->with(['jenisTagihan', 'pembayaran' => function($query) {
                    $query->whereNull('deleted_at')
                          ->orderBy('tanggal_bayar', 'desc')
                          ->limit(1);
                }])
                ->get()
                ->map(function($tagihan) {
                    $latestPembayaran = $tagihan->pembayaran->first();
                    
                    return [
                        'id' => $tagihan->id,
                        'jenis_tagihan' => $tagihan->jenisTagihan->nama_tagihan,
                        'bulan' => $tagihan->bulan,
                        'tahun' => $tagihan->tahun,
                        'nominal' => $tagihan->nominal,
                        'status' => $tagihan->status,
                        'dibayar' => $tagihan->dibayar,
                        'sisa' => $tagihan->sisa,
                        'jatuh_tempo' => $tagihan->jatuh_tempo,
                        'tgl_bayar' => $latestPembayaran ? $latestPembayaran->tanggal_bayar : null,
                        'admin_penerima' => $latestPembayaran ? 'Admin' : null, // TODO: Add created_by field
                    ];
                });

            return [
                'santri_id' => $item->santri_id,
                'santri_nis' => $item->santri_nis,
                'santri_nama' => $item->santri_nama,
                'kelas' => $item->kelas,
                'total_tagihan' => (float) $item->total_tagihan,
                'total_dibayar' => (float) $item->total_dibayar,
                'sisa_tagihan' => (float) $item->sisa_tagihan,
                'detail_tagihan' => $detailTagihan
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    /**
     * Generate tagihan dari jenis tagihan
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'jenis_tagihan_id' => 'required|exists:jenis_tagihan,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $jenisTagihan = JenisTagihan::findOrFail($request->jenis_tagihan_id);
            $bulanList = $jenisTagihan->bulan; // Array bulan
            $totalGenerated = 0;
            
            // Ambil tahun ajaran aktif
            $tahunAjaranAktif = \App\Models\TahunAjaran::where('status', 'aktif')->first();
            if (!$tahunAjaranAktif) {
                throw new \Exception('Tidak ada tahun ajaran aktif');
            }
            
            // Mapping bulan ke angka
            $bulanMap = [
                'Januari' => 1, 'Februari' => 2, 'Maret' => 3, 'April' => 4,
                'Mei' => 5, 'Juni' => 6, 'Juli' => 7, 'Agustus' => 8,
                'September' => 9, 'Oktober' => 10, 'November' => 11, 'Desember' => 12
            ];

            // Ambil santri berdasarkan tipe nominal
            $santriList = $this->getSantriByTipeNominal($jenisTagihan);

            foreach ($santriList as $santriData) {
                foreach ($bulanList as $bulan) {
                    // Tentukan tahun berdasarkan bulan dalam tahun ajaran
                    $bulanAngka = $bulanMap[$bulan];
                    $tahun = ($bulanAngka >= $tahunAjaranAktif->bulan_mulai) 
                        ? $tahunAjaranAktif->tahun_mulai 
                        : $tahunAjaranAktif->tahun_akhir;
                    
                    // Cek apakah tagihan sudah ada
                    $existing = TagihanSantri::where('santri_id', $santriData['santri_id'])
                        ->where('jenis_tagihan_id', $jenisTagihan->id)
                        ->where('bulan', $bulan)
                        ->where('tahun', $tahun)
                        ->first();

                    if ($existing) {
                        continue; // Skip jika sudah ada
                    }

                    $nominal = $santriData['nominal'];
                    
                    TagihanSantri::create([
                        'santri_id' => $santriData['santri_id'],
                        'jenis_tagihan_id' => $jenisTagihan->id,
                        'bulan' => $bulan,
                        'tahun' => $tahun,
                        'nominal' => $nominal,
                        'status' => 'belum_bayar',
                        'dibayar' => 0,
                        'sisa' => $nominal,
                        'jatuh_tempo' => $jenisTagihan->jatuh_tempo,
                    ]);

                    $totalGenerated++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Berhasil generate {$totalGenerated} tagihan untuk " . count($santriList) . " santri",
                'data' => [
                    'total_tagihan' => $totalGenerated,
                    'total_santri' => count($santriList)
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Generate tagihan error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate tagihan: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * Get santri based on tipe nominal
     */
    private function getSantriByTipeNominal($jenisTagihan)
    {
        $santriList = [];

        if ($jenisTagihan->tipe_nominal === 'sama') {
            // Semua santri aktif
            $santris = Santri::all();
            foreach ($santris as $santri) {
                $santriList[] = [
                    'santri_id' => $santri->id,
                    'nominal' => $jenisTagihan->nominal_sama ?? 0
                ];
            }
        } elseif ($jenisTagihan->tipe_nominal === 'per_kelas') {
            // Per kelas
            $nominalPerKelas = $jenisTagihan->nominal_per_kelas;
            if (is_array($nominalPerKelas)) {
                foreach ($nominalPerKelas as $kelasData) {
                    $namaKelas = $kelasData['kelas'] ?? null;
                    $nominal = $kelasData['nominal'] ?? 0;
                    
                    if (!$namaKelas) continue;

                    // Cari santri berdasarkan kelas
                    $santris = Santri::whereHas('kelas', function ($q) use ($namaKelas) {
                        $q->where('nama_kelas', $namaKelas);
                    })->get();

                    foreach ($santris as $santri) {
                        $santriList[] = [
                            'santri_id' => $santri->id,
                            'nominal' => $nominal
                        ];
                    }
                }
            }
        } elseif ($jenisTagihan->tipe_nominal === 'per_individu') {
            // Per individu
            $nominalPerIndividu = $jenisTagihan->nominal_per_individu;
            if (is_array($nominalPerIndividu)) {
                foreach ($nominalPerIndividu as $individuData) {
                    $santriId = $individuData['santriId'] ?? null;
                    $nominal = $individuData['nominal'] ?? 0;
                    
                    if (!$santriId) continue;

                    $santriList[] = [
                        'santri_id' => $santriId,
                        'nominal' => $nominal
                    ];
                }
            }
        }

        return $santriList;
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $tagihan = TagihanSantri::with(['santri', 'jenisTagihan'])->find($id);

        if (!$tagihan) {
            return response()->json([
                'success' => false,
                'message' => 'Tagihan tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $tagihan
        ]);
    }

    /**
     * Get tagihan by santri (all non-deleted)
     */
    public function getBySantri(string $santriId)
    {
        $tagihan = TagihanSantri::with(['jenisTagihan', 'pembayaran'])
            ->where('santri_id', $santriId)
            ->whereNull('deleted_at')
            ->orderBy('tahun', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tagihan
        ]);
    }

    /**
     * Update the specified resource (untuk update pembayaran)
     */
    public function update(Request $request, string $id)
    {
        $tagihan = TagihanSantri::find($id);

        if (!$tagihan) {
            return response()->json([
                'success' => false,
                'message' => 'Tagihan tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'dibayar' => 'required|numeric|min:0|max:' . $tagihan->nominal,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $dibayar = $request->dibayar;
        $sisa = $tagihan->nominal - $dibayar;
        
        $status = 'belum_bayar';
        if ($dibayar >= $tagihan->nominal) {
            $status = 'lunas';
        } elseif ($dibayar > 0) {
            $status = 'sebagian';
        }

        $tagihan->update([
            'dibayar' => $dibayar,
            'sisa' => $sisa,
            'status' => $status
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tagihan berhasil diperbarui',
            'data' => $tagihan
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $tagihan = TagihanSantri::find($id);

        if (!$tagihan) {
            return response()->json([
                'success' => false,
                'message' => 'Tagihan tidak ditemukan'
            ], 404);
        }

        $tagihan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tagihan berhasil dihapus'
        ]);
    }

    /**
     * Bulk create tunggakan manual
     */
    public function createTunggakan(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tunggakan' => 'required|array|min:1',
            'tunggakan.*.santri_id' => 'required|exists:santri,id',
            'tunggakan.*.jenis_tagihan_id' => 'required|exists:jenis_tagihan,id',
            'tunggakan.*.bulan' => 'required|string',
            'tunggakan.*.nominal' => 'required|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $created = 0;
            $duplicates = 0;

            foreach ($request->tunggakan as $item) {
                // Cek duplikat
                $exists = TagihanSantri::where('santri_id', $item['santri_id'])
                    ->where('jenis_tagihan_id', $item['jenis_tagihan_id'])
                    ->where('bulan', $item['bulan'])
                    ->first();

                if ($exists) {
                    $duplicates++;
                    continue;
                }

                // Tentukan tahun berdasarkan bulan
                $tahun = 2025; // Default tahun
                $bulanNum = $this->getBulanNumber($item['bulan']);
                
                // Jika bulan >= 7 (Juli), tahun = 2025, else 2026
                if ($bulanNum < 7) {
                    $tahun = 2026;
                }

                // Get jenis tagihan untuk jatuh tempo
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
                    'jatuh_tempo' => $jenisTagihan?->jatuh_tempo ?? 'Tanggal 10 setiap bulan'
                ]);

                $created++;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Berhasil membuat {$created} tunggakan" . ($duplicates > 0 ? ", {$duplicates} duplikat diabaikan" : ''),
                'created' => $created,
                'duplicates' => $duplicates
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Create tunggakan error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat tunggakan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper function: convert bulan name to number
     */
    private function getBulanNumber($bulan)
    {
        $bulanMap = [
            'Januari' => 1,
            'Februari' => 2,
            'Maret' => 3,
            'April' => 4,
            'Mei' => 5,
            'Juni' => 6,
            'Juli' => 7,
            'Agustus' => 8,
            'September' => 9,
            'Oktober' => 10,
            'November' => 11,
            'Desember' => 12
        ];

        return $bulanMap[$bulan] ?? 1;
    }
}
