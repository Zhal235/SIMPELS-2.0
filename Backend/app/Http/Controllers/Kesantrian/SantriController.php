<?php

namespace App\Http\Controllers\Kesantrian;

use App\Http\Controllers\Controller;
use App\Models\Santri;
use App\Http\Resources\SantriResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Throwable;

class SantriController extends Controller
{
    /**
     * GET /api/v1/kesantrian/santri
     */
    public function index(Request $request)
    {
        try {
            $page = max((int) $request->query('page', 1), 1);
            $perPage = max((int) $request->query('perPage', 10), 1);
            $query = Santri::query();
            // Optional filter: santri tanpa asrama
            if ($request->boolean('withoutAsrama')) {
                $query->whereNull('asrama_id');
            }
            $paginator = $query
                ->with(['kelas', 'asrama', 'rfid_tag', 'wallet'])
                ->orderBy('nama_santri')
                ->paginate($perPage, ['*'], 'page', $page);

            // Use SantriResource to properly format foto URLs
            $items = SantriResource::collection($paginator->items());

            return response()->json([
                'status' => 'success',
                'data' => $items,
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memuat data santri',
            ], 500);
        }
    }

    /**
     * POST /api/v1/kesantrian/santri
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nis' => ['required', 'string', 'max:255', 'unique:santri,nis'],
                'nama_santri' => ['required', 'string', 'max:255'],
                'tempat_lahir' => ['required', 'string', 'max:255'],
                'tanggal_lahir' => ['required', 'date'],
                'jenis_kelamin' => ['required', Rule::in(['L', 'P'])],
                'alamat' => ['required', 'string'],
                'nama_ayah' => ['required', 'string', 'max:255'],
                'nama_ibu' => ['required', 'string', 'max:255'],
                // optional fields
                'nisn' => ['nullable', 'string', 'max:255'],
                'nik_santri' => ['nullable', 'string', 'max:255'],
                'kelas_id' => ['nullable'],
                'kelas_nama' => ['nullable', 'string', 'max:255'], // Tidak disimpan tapi perlu di-allow
                'asrama_id' => ['nullable'],
                'asrama_nama' => ['nullable', 'string', 'max:255'], // Tidak disimpan tapi perlu di-allow
                'asal_sekolah' => ['nullable', 'string', 'max:255'],
                'hobi' => ['nullable', 'string', 'max:255'],
                'cita_cita' => ['nullable', 'string', 'max:255'],
                'jumlah_saudara' => ['nullable', 'integer'],
                'provinsi' => ['nullable', 'string', 'max:255'],
                'kabupaten' => ['nullable', 'string', 'max:255'],
                'kecamatan' => ['nullable', 'string', 'max:255'],
                'desa' => ['nullable', 'string', 'max:255'],
                'kode_pos' => ['nullable', 'string', 'max:20'],
                'no_kk' => ['nullable', 'string', 'max:255'],
                'nik_ayah' => ['nullable', 'string', 'max:255'],
                'pendidikan_ayah' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ayah' => ['nullable', 'string', 'max:255'],
                'hp_ayah' => ['nullable', 'string', 'max:255'],
                'nik_ibu' => ['nullable', 'string', 'max:255'],
                'pendidikan_ibu' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ibu' => ['nullable', 'string', 'max:255'],
                'hp_ibu' => ['nullable', 'string', 'max:255'],
                'foto' => ['nullable', 'file', 'image', 'max:2048'],
                // status & penerimaan
                'status' => ['nullable', Rule::in(['aktif', 'keluar', 'mutasi', 'alumni', 'lulus'])],
                'jenis_penerimaan' => ['nullable', Rule::in(['baru', 'mutasi_masuk'])],
                // mutasi metadata
                'tanggal_keluar' => ['nullable', 'date'],
                'tujuan_mutasi' => ['nullable', 'string', 'max:255'],
                'alasan_mutasi' => ['nullable', 'string'],
            ]);
            
            // Remove kelas_nama dan asrama_nama dari validated data karena bukan kolom di database
            unset($validated['kelas_nama'], $validated['asrama_nama']);

            // handle foto upload if exists
            if ($request->hasFile('foto')) {
                $path = $request->file('foto')->store('foto-santri', 'public');
                $validated['foto'] = $path; // store relative path only
            }

            $santri = Santri::create($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Santri berhasil disimpan',
                'data' => $santri,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan server',
            ], 500);
        }
    }

    /**
     * GET /api/v1/kesantrian/santri/{id}
     */
    public function show(string $id)
    {
        $santri = Santri::query()->with(['kelas', 'asrama'])->find($id);
        if (!$santri) {
            return response()->json([
                'status' => 'error',
                'message' => 'Santri tidak ditemukan',
            ], 404);
        }
        return response()->json([
            'status' => 'success',
            'data' => new SantriResource($santri),
        ]);
    }

    /**
     * PUT /api/v1/kesantrian/santri/{id}
     */
    public function update(Request $request, string $id)
    {
        $santri = Santri::find($id);
        if (!$santri) {
            return response()->json([
                'status' => 'error',
                'message' => 'Santri tidak ditemukan',
            ], 404);
        }

        try {
            $validated = $request->validate([
                'nis' => ['required', 'string', 'max:255', Rule::unique('santri', 'nis')->ignore($santri->id, 'id')],
                'nama_santri' => ['required', 'string', 'max:255'],
                'tempat_lahir' => ['required', 'string', 'max:255'],
                'tanggal_lahir' => ['required', 'date'],
                'jenis_kelamin' => ['required', Rule::in(['L', 'P'])],
                'alamat' => ['required', 'string'],
                'nama_ayah' => ['required', 'string', 'max:255'],
                'nama_ibu' => ['required', 'string', 'max:255'],
                // optional
                'nisn' => ['nullable', 'string', 'max:255'],
                'nik_santri' => ['nullable', 'string', 'max:255'],
                'kelas_id' => ['nullable'],
                'kelas_nama' => ['nullable', 'string', 'max:255'], // Tidak disimpan tapi perlu di-allow
                'asrama_id' => ['nullable'],
                'asrama_nama' => ['nullable', 'string', 'max:255'], // Tidak disimpan tapi perlu di-allow
                'asal_sekolah' => ['nullable', 'string', 'max:255'],
                'hobi' => ['nullable', 'string', 'max:255'],
                'cita_cita' => ['nullable', 'string', 'max:255'],
                'jumlah_saudara' => ['nullable', 'integer'],
                'provinsi' => ['nullable', 'string', 'max:255'],
                'kabupaten' => ['nullable', 'string', 'max:255'],
                'kecamatan' => ['nullable', 'string', 'max:255'],
                'desa' => ['nullable', 'string', 'max:255'],
                'kode_pos' => ['nullable', 'string', 'max:20'],
                'no_kk' => ['nullable', 'string', 'max:255'],
                'nik_ayah' => ['nullable', 'string', 'max:255'],
                'pendidikan_ayah' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ayah' => ['nullable', 'string', 'max:255'],
                'hp_ayah' => ['nullable', 'string', 'max:255'],
                'nik_ibu' => ['nullable', 'string', 'max:255'],
                'pendidikan_ibu' => ['nullable', 'string', 'max:255'],
                'pekerjaan_ibu' => ['nullable', 'string', 'max:255'],
                'hp_ibu' => ['nullable', 'string', 'max:255'],
                'foto' => ['nullable', 'file', 'image', 'max:2048'],
                // status & penerimaan
                'status' => ['nullable', Rule::in(['aktif', 'keluar', 'mutasi', 'alumni', 'lulus'])],
                'jenis_penerimaan' => ['nullable', Rule::in(['baru', 'mutasi_masuk'])],
                // mutasi metadata
                'tanggal_keluar' => ['nullable', 'date'],
                'tujuan_mutasi' => ['nullable', 'string', 'max:255'],
                'alasan_mutasi' => ['nullable', 'string'],
            ]);
            
            // Remove kelas_nama dan asrama_nama dari validated data karena bukan kolom di database
            unset($validated['kelas_nama'], $validated['asrama_nama']);

            // handle foto upload if exists
            if ($request->hasFile('foto')) {
                // optionally delete old file - skipped here
                $path = $request->file('foto')->store('foto-santri', 'public');
                $validated['foto'] = $path; // store relative path only
            }

            $santri->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Santri berhasil diperbarui',
                'data' => $santri,
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $ve->errors(),
            ], 422);
        } catch (Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan server',
            ], 500);
        }
    }

    /**
     * DELETE /api/v1/kesantrian/santri/{id}
     */
    public function destroy(string $id)
    {
        $santri = Santri::find($id);
        if (!$santri) {
            return response()->json([
                'status' => 'error',
                'message' => 'Santri tidak ditemukan',
            ], 404);
        }

        $santri->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Santri berhasil dihapus',
        ]);
    }
}