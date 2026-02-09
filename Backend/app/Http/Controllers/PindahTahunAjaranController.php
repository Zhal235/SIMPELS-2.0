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

        try {
            DB::beginTransaction();

            $updated = Santri::whereHas('kelas', function ($q) use ($tingkatAkhir) {
                $q->where('tingkat', $tingkatAkhir);
            })->where('status', 'aktif')->update([
                'status' => 'alumni',
                'kelas_id' => null, // Lepas dari kelas
                'kelas_nama' => null
            ]);

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
        // Ambil semua kelas kecuali tingkat akhir
        $sourceClasses = Kelas::where('tingkat', '<', 12)->orderBy('tingkat')->orderBy('nama_kelas')->get();
        $mapping = [];

        foreach ($sourceClasses as $kelas) {
            $targetName = $this->generateTargetClassName($kelas->nama_kelas, $kelas->tingkat);
            $targetTingkat = $kelas->tingkat + 1;
            
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

            foreach ($mappings as $map) {
                if (empty($map['target_nama'])) continue;

                // Cari atau buat kelas target
                // Gunakan firstOrCreate agar tidak duplikat
                $targetKelas = Kelas::firstOrCreate(
                    [
                        'nama_kelas' => $map['target_nama'],
                        'tingkat' => $map['target_tingkat']
                    ],
                    [
                        // Default values for new class
                        'wali_kelas_id' => null 
                    ]
                );

                if ($targetKelas->wasRecentlyCreated) {
                    $createdClasses++;
                }

                // Pindahkan santri
                $affected = Santri::where('kelas_id', $map['source_id'])
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
        // Pola 1: Angka (7A -> 8A)
        $nextTingkat = $tingkat + 1;
        
        // Cek apakah nama dimulai dengan angka tingkat lama (misal "7")
        if (Str::startsWith($name, (string)$tingkat)) {
            return Str::replaceFirst((string)$tingkat, (string)$nextTingkat, $name);
        }

        // Pola 2: Romawi (VII -> VIII)
        $romawiMap = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V',
            6 => 'VI', 7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X',
            11 => 'XI', 12 => 'XII'
        ];

        $currentRomawi = $romawiMap[$tingkat] ?? '';
        $nextRomawi = $romawiMap[$nextTingkat] ?? '';

        if ($currentRomawi && $nextRomawi && Str::contains($name, $currentRomawi)) {
             // Hati-hati replace: VII (7) is substring of VIII (8). 
             // Tapi kita mau replace 7 -> 8.
             // Kalau nama "VIIA" (7), next "VIIIA" (8).
             // Kalau replace "VII" dengan "VIII", aman.
             // Kalau 8 (VIII) ke 9 (IX), aman.
             // Isu: VI (6) ke VII (7). "VI" is substring of "VII".
             
             // Solusi: Gunakan preg_replace dengan word boundary atau specific prefix match
             // Asumsi format standar: "VII A" atau "VII-A" atau "VIIA"
             
             return preg_replace('/^' . $currentRomawi . '/', $nextRomawi, $name, 1);
        }

        // Fallback: Just append suffix or use standard naming if pattern not recognized
        return $nextTingkat . ' ' . $name; // Likely wrong but safe
    }
}
