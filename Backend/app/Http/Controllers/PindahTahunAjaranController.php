<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\Santri;
use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PindahTahunAjaranController extends Controller
{
    /**
     * STEP 1: PREVIEW KELULUSAN
     * Menampilkan santri tingkat akhir (kelas 12) yang akan diluluskan.
     */
    public function previewLulus()
    {
        // Sesuaikan tingkat akhir, user bilang tingkat 12
        $tingkatAkhir = 12;

        $santriCount = Santri::whereHas('kelas', function ($q) use ($tingkatAkhir) {
            $q->where('tingkat', $tingkatAkhir);
        })->where('status', 'aktif')->count();

        $kelasAkhir = Kelas::where('tingkat', $tingkatAkhir)->get();

        return response()->json([
            'success' => true,
            'tingkat_akhir' => $tingkatAkhir,
            'jumlah_santri' => $santriCount,
            'daftar_kelas' => $kelasAkhir
        ]);
    }

    /**
     * STEP 1: EXECUTE KELULUSAN
     * Mengubah status santri kelas 12 menjadi alumni.
     */
    public function graduate(Request $request)
    {
        $tingkatAkhir = 12;
        $validated = $request->validate([
            'tanggal_kelulusan' => ['required', 'date'],
        ]);
        $tanggalKelulusan = $validated['tanggal_kelulusan'];

        try {
            DB::beginTransaction();

            $updated = Santri::whereHas('kelas', function ($q) use ($tingkatAkhir) {
                $q->where('tingkat', $tingkatAkhir);
            })->where('status', 'aktif')->get()->each(function ($santri) use ($tanggalKelulusan) {
                $santri->update([
                    'status' => 'alumni',
                    'tanggal_keluar' => $tanggalKelulusan,
                    'kelas_nama' => $santri->kelas?->nama_kelas ?? $santri->kelas_nama,
                    'kelas_id' => null,
                ]);
            })->count();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Berhasil meluluskan $updated santri.",
                'jumlah_lulus' => $updated
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses kelulusan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * STEP 2: PREVIEW KENAIKAN KELAS
     * Menampilkan mapping otomatis kelas lama ke kelas baru.
     */
    public function previewNaikKelas()
    {
        $sourceClasses = Kelas::where('tingkat', '<', 12)
            ->whereHas('santri', function ($q) {
                $q->where('status', 'aktif');
            })
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get();
        $mapping = [];

        foreach ($sourceClasses as $kelas) {
            $targetTingkat = $kelas->tingkat + 1;
            $targetName = $this->resolveSuggestedTargetClassName($kelas->nama_kelas, $kelas->tingkat, $targetTingkat);
            
            // Cek apakah kelas target sudah ada
            $existingTarget = Kelas::where('nama_kelas', $targetName)->where('tingkat', $targetTingkat)->first();

            $santriCount = Santri::where('kelas_id', $kelas->id)->where('status', 'aktif')->count();

            $mapping[] = [
                'source_id' => $kelas->id,
                'source_nama' => $kelas->nama_kelas,
                'source_tingkat' => $kelas->tingkat,
                'target_nama' => $targetName, // Saran nama otomatis
                'target_tingkat' => $targetTingkat,
                'target_exists' => (bool) $existingTarget,
                'target_id' => $existingTarget ? $existingTarget->id : null,
                'target_options' => Kelas::where('tingkat', $targetTingkat)
                    ->orderBy('nama_kelas')
                    ->get(['id', 'nama_kelas'])
                    ->map(fn ($item) => ['id' => $item->id, 'nama_kelas' => $item->nama_kelas])
                    ->values(),
                'jumlah_santri' => $santriCount
            ];
        }

        return response()->json([
            'success' => true,
            'mapping' => $mapping
        ]);
    }

    /**
     * STEP 2: EXECUTE KENAIKAN KELAS
     * Memproses mapping: buat kelas baru jika perlu, pindahkan santri.
     */
    public function promote(Request $request)
    {
        // Expect input: { mapping: [ { source_id, target_nama, target_tingkat } ] }
        $mappings = $request->input('mapping');

        if (!is_array($mappings)) {
            return response()->json(['success' => false, 'message' => 'Invalid data format'], 400);
        }

        try {
            DB::beginTransaction();
            $movedCount = 0;
            $createdClasses = 0;

            // PASS 1: Snapshot santri IDs per source class BEFORE any update.
            // This prevents cascade where a student promoted to class B gets
            // promoted again when class B is processed in the same loop.
            $snapshotBySantriIds = [];
            $resolvedTargets = [];

            foreach ($mappings as $map) {
                if (empty($map['source_id'])) {
                    continue;
                }

                $sourceKelas = Kelas::find($map['source_id']);
                if (!$sourceKelas) {
                    continue;
                }

                $expectedTargetTingkat = (int) $sourceKelas->tingkat + 1;

                $targetKelas = null;

                if (!empty($map['target_id'])) {
                    $targetKelas = Kelas::where('id', $map['target_id'])
                        ->where('tingkat', $expectedTargetTingkat)
                        ->first();
                }

                if (!$targetKelas) {
                    if (empty($map['target_nama'])) {
                        continue;
                    }

                    $targetKelas = Kelas::firstOrCreate(
                        [
                            'nama_kelas' => $map['target_nama'],
                            'tingkat' => $expectedTargetTingkat
                        ],
                        [
                            'wali_kelas_id' => null
                        ]
                    );
                }

                if ((int) $targetKelas->tingkat !== $expectedTargetTingkat) {
                    throw new \RuntimeException("Kelas tujuan {$targetKelas->nama_kelas} tidak sesuai tingkat target untuk kelas {$sourceKelas->nama_kelas}");
                }

                if ($targetKelas->wasRecentlyCreated) {
                    $createdClasses++;
                }

                // Snapshot santri di kelas sumber saat ini, sebelum ada yang dipindah
                $santriIds = Santri::where('kelas_id', $map['source_id'])
                    ->where('status', 'aktif')
                    ->pluck('id')
                    ->all();

                $snapshotBySantriIds[$map['source_id']] = $santriIds;
                $resolvedTargets[$map['source_id']] = $targetKelas;
            }

            // PASS 2: Apply promotions using the snapshots, not live queries.
            foreach ($snapshotBySantriIds as $sourceId => $santriIds) {
                if (empty($santriIds)) {
                    continue;
                }

                $targetKelas = $resolvedTargets[$sourceId];

                $affected = Santri::whereIn('id', $santriIds)
                    ->where('status', 'aktif')
                    ->update([
                        'kelas_id' => $targetKelas->id,
                        'kelas_nama' => $targetKelas->nama_kelas
                    ]);

                $movedCount += $affected;
            }

            DB::commit();

            return response()->json([
                'success' => true, 
                'message' => "Promosi berhasil. $movedCount santri dipindahkan, $createdClasses kelas baru dibuat.",
                'moved_count' => $movedCount,
                'created_classes' => $createdClasses
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false, 
                'message' => 'Gagal memproses kenaikan kelas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Generate nama kelas target (7A -> 8A, VII A -> VIII A)
     */
    private function generateTargetClassName($name, $tingkat)
    {
        $nextTingkat = $tingkat + 1;
        $normalized = trim((string) $name);

        if ($normalized === '') {
            return (string) $nextTingkat;
        }

        if (preg_match('/^(\d+)(.*)$/', $normalized, $matches)) {
            $prefixNum = (int) $matches[1];
            if ($prefixNum === (int) $tingkat) {
                return $nextTingkat . $matches[2];
            }
        }

        $romawiMap = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V',
            6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X',
            11 => 'XI', 12 => 'XII'
        ];

        $currentRomawi = $romawiMap[$tingkat] ?? '';
        $nextRomawi = $romawiMap[$nextTingkat] ?? '';

        if ($currentRomawi && $nextRomawi) {
            $escaped = preg_quote($currentRomawi, '/');
            if (preg_match('/^' . $escaped . '(\b|\s|\-|$)/i', $normalized)) {
                return preg_replace('/^' . $escaped . '/i', $nextRomawi, $normalized, 1);
            }

            if (preg_match('/^(Kelas\s+)' . $escaped . '(\b|\s|\-|$)/i', $normalized)) {
                return preg_replace('/^(Kelas\s+)' . $escaped . '/i', '${1}' . $nextRomawi, $normalized, 1);
            }
        }

        return $nextTingkat . ' ' . $normalized;
    }

    private function resolveSuggestedTargetClassName(string $sourceName, int $sourceTingkat, int $targetTingkat): string
    {
        $targetCandidates = Kelas::where('tingkat', $targetTingkat)
            ->orderBy('nama_kelas')
            ->pluck('nama_kelas')
            ->values();

        if ($targetCandidates->count() === 1) {
            return (string) $targetCandidates->first();
        }

        $generated = $this->generateTargetClassName($sourceName, $sourceTingkat);

        $suffix = trim(preg_replace('/^(\d+|[IVXLCDM]+)\s*/i', '', $sourceName) ?? '');
        if ($suffix !== '') {
            $matched = $targetCandidates->first(function ($candidate) use ($suffix) {
                return str_ends_with(trim((string) $candidate), $suffix);
            });

            if ($matched) {
                return (string) $matched;
            }
        }

        return $generated;
    }
}
