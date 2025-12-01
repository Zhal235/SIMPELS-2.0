<?php

namespace App\Http\Controllers\Kesantrian;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Asrama;
use App\Models\Santri;
use Illuminate\Support\Facades\Validator;

class AsramaController extends Controller
{
    public function index()
    {
        $list = Asrama::query()
            ->withCount(['santri'])
            ->orderBy('nama_asrama')
            ->get();
        return response()->json([
            'status' => 'success',
            'data' => $list,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nama_asrama' => 'required|string|max:255',
            'wali_asrama' => 'nullable|string|max:255',
        ]);
        $asrama = Asrama::create($data);
        return response()->json([
            'status' => 'success',
            'message' => 'Asrama berhasil dibuat',
            'data' => $asrama,
        ], 201);
    }

    public function show(string $id)
    {
        $asrama = Asrama::query()->with(['santri'])->find($id);
        if (!$asrama) {
            return response()->json(['status' => 'error', 'message' => 'Asrama tidak ditemukan'], 404);
        }
        return response()->json(['status' => 'success', 'data' => $asrama]);
    }

    public function update(Request $request, string $id)
    {
        $asrama = Asrama::find($id);
        if (!$asrama) {
            return response()->json(['status' => 'error', 'message' => 'Asrama tidak ditemukan'], 404);
        }
        $data = $request->validate([
            'nama_asrama' => 'required|string|max:255',
            'wali_asrama' => 'nullable|string|max:255',
        ]);
        $asrama->update($data);
        return response()->json(['status' => 'success', 'message' => 'Asrama berhasil diperbarui', 'data' => $asrama]);
    }

    public function destroy(string $id)
    {
        $asrama = Asrama::find($id);
        if (!$asrama) {
            return response()->json(['status' => 'error', 'message' => 'Asrama tidak ditemukan'], 404);
        }
        $asrama->delete();
        return response()->json(['status' => 'success', 'message' => 'Asrama berhasil dihapus']);
    }

    public function tambahAnggota(Request $request, string $id)
    {
        $asrama = Asrama::find($id);
        if (!$asrama) {
            return response()->json(['status' => 'error', 'message' => 'Asrama tidak ditemukan'], 404);
        }
        
        $validated = Validator::make($request->all(), [
            'santri_id' => 'sometimes|string|exists:santri,id',
            'santri_ids' => 'sometimes|array',
            'santri_ids.*' => 'string|exists:santri,id',
        ])->validate();

        // Support both single and bulk
        $santriIds = [];
        if (isset($validated['santri_id'])) {
            $santriIds = [$validated['santri_id']];
        } elseif (isset($validated['santri_ids'])) {
            $santriIds = $validated['santri_ids'];
        } else {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada santri yang dipilih',
            ], 422);
        }

        $errors = [];
        $success = 0;

        foreach ($santriIds as $santri_id) {
            try {
                $santri = Santri::find($santri_id);
                if (!$santri) {
                    $errors[] = "Santri ID {$santri_id} tidak ditemukan.";
                    continue;
                }
                if (!empty($santri->asrama_id) && (int)$santri->asrama_id !== (int)$asrama->id) {
                    $errors[] = "Santri {$santri->nama_santri} sudah terdaftar di asrama lain.";
                    continue;
                }
                $santri->asrama_id = $asrama->id;
                $santri->asrama_nama = $asrama->nama_asrama;
                $santri->save();
                $success++;
            } catch (\Exception $e) {
                $errors[] = "Gagal menambahkan santri ID {$santri_id}: " . $e->getMessage();
            }
        }

        return response()->json([
            'status' => $success > 0 ? 'success' : 'error',
            'message' => $success > 0 
                ? "{$success} santri berhasil ditambahkan" . (count($errors) > 0 ? " (" . count($errors) . " gagal)" : "")
                : 'Tidak ada santri yang berhasil ditambahkan',
            'success_count' => $success,
            'errors' => $errors,
        ], $success > 0 ? 200 : 422);
    }

    public function keluarkanAnggota(string $id, string $santri_id)
    {
        $asrama = Asrama::find($id);
        if (!$asrama) {
            return response()->json(['status' => 'error', 'message' => 'Asrama tidak ditemukan'], 404);
        }
        $santri = Santri::find($santri_id);
        if (!$santri) {
            return response()->json(['status' => 'error', 'message' => 'Santri tidak ditemukan'], 404);
        }
        if ((int)$santri->asrama_id !== (int)$asrama->id) {
            return response()->json(['status' => 'error', 'message' => 'Santri bukan anggota asrama ini'], 422);
        }
        $santri->asrama_id = null;
        $santri->asrama_nama = null;
        $santri->save();
        return response()->json(['status' => 'success', 'message' => 'Anggota berhasil dikeluarkan']);
    }
}