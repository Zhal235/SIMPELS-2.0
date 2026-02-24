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

        $pegawai = $query->with('jabatan')->latest()->paginate(10);

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
            'jenis_pegawai' => 'required|in:Pendidik,Tenaga Kependidikan',
            'status_kepegawaian' => 'required|in:Tetap,Kontrak,Honorer,Magang',
            'foto_profil' => ['nullable', 'file', 'image', 'max:2048'],
            'jabatan_ids.*' => 'nullable|exists:jabatan,id',
            'is_primary.*' => 'nullable|boolean',
            // Tambahkan validasi lain sesuai kebutuhan
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $data = $request->all();

        // handle foto upload if exists
        if ($request->hasFile('foto_profil')) {
            $path = $request->file('foto_profil')->store('foto-pegawai', 'r2');
            $data['foto_profil'] = $path;
        }

        $pegawai = Pegawai::create($data);

        // Handle multiple jabatan relationships
        if ($request->has('jabatan_ids') && is_array($request->jabatan_ids)) {
            $jabatanData = [];
            foreach ($request->jabatan_ids as $index => $jabatanId) {
                $isPrimary = isset($request->is_primary[$index]) && $request->is_primary[$index];
                $jabatanData[$jabatanId] = ['is_primary' => $isPrimary];
            }
            $pegawai->jabatan()->sync($jabatanData);
        }

        // Load relationships for response
        $pegawai->load('jabatan');

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
        $pegawai = Pegawai::with('jabatan')->find($id);
        
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

        // Debug: log raw request data
        \Log::info('Update Pegawai Request Data:', [
            'all_fields' => $request->all(),
            'foto_profil_type' => gettype($request->foto_profil),
            'foto_profil_value' => $request->foto_profil,
            'has_foto_file' => $request->hasFile('foto_profil'),
            'files' => $request->allFiles()
        ]);

        $validator = Validator::make($request->all(), [
            'nama_pegawai' => 'required|string|max:255',
            'nip' => 'nullable|string|unique:pegawai,nip,' . $id,
            'nuptk' => 'nullable|string|unique:pegawai,nuptk,' . $id,
            'jenis_pegawai' => 'required|in:Pendidik,Tenaga Kependidikan',
            'status_kepegawaian' => 'required|in:Tetap,Kontrak,Honorer,Magang',
            'foto_profil' => ['nullable', 'file', 'image', 'max:2048'],
            'jabatan_ids.*' => 'nullable|exists:jabatan,id',
            'is_primary.*' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        // handle foto upload if exists
        if ($request->hasFile('foto_profil')) {
            // Delete old photo
            if ($pegawai->foto_profil && \Illuminate\Support\Facades\Storage::disk('r2')->exists($pegawai->foto_profil)) {
                \Illuminate\Support\Facades\Storage::disk('r2')->delete($pegawai->foto_profil);
            }
            $path = $request->file('foto_profil')->store('foto-pegawai', 'r2');
            $data['foto_profil'] = $path;
        }

        $pegawai->update($data);

        // Handle multiple jabatan relationships
        if ($request->has('jabatan_ids')) {
            if (is_array($request->jabatan_ids)) {
                $jabatanData = [];
                foreach ($request->jabatan_ids as $index => $jabatanId) {
                    $isPrimary = isset($request->is_primary[$index]) && $request->is_primary[$index];
                    $jabatanData[$jabatanId] = ['is_primary' => $isPrimary];
                }
                $pegawai->jabatan()->sync($jabatanData);
            } else {
                // Clear all jabatan if empty array or null
                $pegawai->jabatan()->sync([]);
            }
        }

        // Load relationships for response
        $pegawai->load('jabatan');

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

        if ($pegawai->foto_profil && \Illuminate\Support\Facades\Storage::disk('r2')->exists($pegawai->foto_profil)) {
            \Illuminate\Support\Facades\Storage::disk('r2')->delete($pegawai->foto_profil);
        }

        $pegawai->delete();

        return response()->json(['message' => 'Data pegawai berhasil dihapus']);
    }
}
