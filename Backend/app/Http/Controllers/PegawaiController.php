<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PegawaiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Pegawai::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama_pegawai', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%")
                  ->orWhere('jenis_pegawai', 'like', "%{$search}%");
            });
        }

        $pegawai = $query->latest()->paginate(10);

        return response()->json($pegawai);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_pegawai' => 'required|string|max:255',
            'nip' => 'nullable|string|unique:pegawai,nip',
            'nuptk' => 'nullable|string|unique:pegawai,nuptk',
            'jenis_pegawai' => 'required|in:Guru,Staff,Security,Kebersihan,Lainnya',
            'status_kepegawaian' => 'required|in:Tetap,Kontrak,Honorer,Magang',
            // Tambahkan validasi lain sesuai kebutuhan
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pegawai = Pegawai::create($request->all());

        return response()->json([
            'message' => 'Data pegawai berhasil ditambahkan',
            'data' => $pegawai
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $pegawai = Pegawai::find($id);
        
        if (!$pegawai) {
            return response()->json(['message' => 'Pegawai tidak ditemukan'], 404);
        }

        return response()->json($pegawai);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $pegawai = Pegawai::find($id);

        if (!$pegawai) {
            return response()->json(['message' => 'Pegawai tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama_pegawai' => 'required|string|max:255',
            'nip' => 'nullable|string|unique:pegawai,nip,' . $id,
            'nuptk' => 'nullable|string|unique:pegawai,nuptk,' . $id,
            'jenis_pegawai' => 'required|in:Guru,Staff,Security,Kebersihan,Lainnya',
            'status_kepegawaian' => 'required|in:Tetap,Kontrak,Honorer,Magang',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $pegawai->update($request->all());

        return response()->json([
            'message' => 'Data pegawai berhasil diperbarui',
            'data' => $pegawai
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $pegawai = Pegawai::find($id);

        if (!$pegawai) {
            return response()->json(['message' => 'Pegawai tidak ditemukan'], 404);
        }

        $pegawai->delete();

        return response()->json(['message' => 'Data pegawai berhasil dihapus']);
    }
}
