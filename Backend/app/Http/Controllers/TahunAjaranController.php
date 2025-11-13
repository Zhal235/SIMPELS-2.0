<?php

namespace App\Http\Controllers;

use App\Models\TahunAjaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TahunAjaranController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tahunAjaran = TahunAjaran::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $tahunAjaran
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_tahun_ajaran' => 'required|string|max:255',
            'tanggal_mulai' => 'required|integer|min:1|max:31',
            'bulan_mulai' => 'required|integer|min:1|max:12',
            'tahun_mulai' => 'required|integer|min:2000|max:2100',
            'tanggal_akhir' => 'required|integer|min:1|max:31',
            'bulan_akhir' => 'required|integer|min:1|max:12',
            'tahun_akhir' => 'required|integer|min:2000|max:2100',
            'status' => 'required|in:aktif,tidak_aktif',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validasi: hanya bisa ada 1 tahun ajaran aktif
        if ($request->status === 'aktif') {
            $existingActive = TahunAjaran::where('status', 'aktif')->first();
            if ($existingActive) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sudah ada tahun ajaran aktif. Silakan nonaktifkan tahun ajaran "' . $existingActive->nama_tahun_ajaran . '" terlebih dahulu.'
                ], 400);
            }
        }

        $tahunAjaran = TahunAjaran::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Tahun ajaran berhasil ditambahkan',
            'data' => $tahunAjaran
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $tahunAjaran = TahunAjaran::find($id);

        if (!$tahunAjaran) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $tahunAjaran
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $tahunAjaran = TahunAjaran::find($id);

        if (!$tahunAjaran) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_tahun_ajaran' => 'required|string|max:255',
            'tanggal_mulai' => 'required|integer|min:1|max:31',
            'bulan_mulai' => 'required|integer|min:1|max:12',
            'tahun_mulai' => 'required|integer|min:2000|max:2100',
            'tanggal_akhir' => 'required|integer|min:1|max:31',
            'bulan_akhir' => 'required|integer|min:1|max:12',
            'tahun_akhir' => 'required|integer|min:2000|max:2100',
            'status' => 'required|in:aktif,tidak_aktif',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validasi: hanya bisa ada 1 tahun ajaran aktif
        if ($request->status === 'aktif') {
            $existingActive = TahunAjaran::where('status', 'aktif')
                ->where('id', '!=', $id)
                ->first();
            if ($existingActive) {
                // Otomatis nonaktifkan tahun ajaran yang lama
                $existingActive->update(['status' => 'tidak_aktif']);
            }
        }

        $tahunAjaran->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Tahun ajaran berhasil diperbarui',
            'data' => $tahunAjaran
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $tahunAjaran = TahunAjaran::find($id);

        if (!$tahunAjaran) {
            return response()->json([
                'success' => false,
                'message' => 'Tahun ajaran tidak ditemukan'
            ], 404);
        }

        $tahunAjaran->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tahun ajaran berhasil dihapus'
        ]);
    }
}
