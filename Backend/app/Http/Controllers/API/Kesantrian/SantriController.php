<?php

namespace App\Http\Controllers\API\Kesantrian;

use App\Http\Controllers\Controller;
use App\Models\Kesantrian\Santri;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Storage;
use App\Http\Resources\SantriResource;

class SantriController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Basic listing, later can be replaced with pagination and filters
        $items = Santri::query()->orderBy('nama_santri')->get();
        return SantriResource::collection($items)->additional([
            'success' => true,
            'message' => 'Data santri retrieved successfully',
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $this->validateData($request);

        // Handle image upload & compression
        if ($request->hasFile('foto')) {
            $image = $request->file('foto');
            $filename = uniqid().'.'.$image->getClientOriginalExtension();
            $dir = 'public/santri_foto';
            Storage::makeDirectory($dir);
            $path = storage_path('app/'.$dir.'/'.$filename);

            $img = Image::make($image->getRealPath());
            if ($img->width() > 1024) {
                $img->resize(1024, null, function ($constraint) {
                    $constraint->aspectRatio();
                });
            }
            $img->save($path, 80);
            $data['foto'] = 'santri_foto/'.$filename;
        }

        $santri = Santri::create($data);
        return response()->json([
            'success' => true,
            'message' => 'Santri created successfully',
            'data' => new SantriResource($santri),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Santri $santri)
    {
        return (new SantriResource($santri))->additional([
            'success' => true,
            'message' => 'Santri updated successfully',
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Santri $santri)
    {
        $data = $this->validateData($request, $santri->id);

        if ($request->hasFile('foto')) {
            $image = $request->file('foto');
            $filename = uniqid().'.'.$image->getClientOriginalExtension();
            $dir = 'public/santri_foto';
            Storage::makeDirectory($dir);
            $path = storage_path('app/'.$dir.'/'.$filename);

            $img = Image::make($image->getRealPath());
            if ($img->width() > 1024) {
                $img->resize(1024, null, function ($constraint) {
                    $constraint->aspectRatio();
                });
            }
            $img->save($path, 80);
            $data['foto'] = 'santri_foto/'.$filename;
        }

        $santri->update($data);
        return new SantriResource($santri);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Santri $santri)
    {
        $santri->delete();
        return response()->json([
            'success' => true,
            'message' => 'Santri deleted successfully',
        ]);
    }

    /**
     * Validate request payload for create/update operations.
     */
    protected function validateData(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'nis' => [
                'required', 'string', 'max:20',
                Rule::unique('santris', 'nis')->ignore($ignoreId),
            ],
            'nisn' => ['nullable', 'string', 'max:20'],
            'nik_santri' => ['nullable', 'string', 'max:20'],
            'nama_santri' => ['required', 'string', 'max:100'],
            'tempat_lahir' => ['required', 'string', 'max:50'],
            'tanggal_lahir' => ['required', 'date'],
            'jenis_kelamin' => ['required', Rule::in(['L', 'P'])],
            'kelas_id' => ['nullable', 'integer'],
            'asrama_id' => ['nullable', 'integer'],
            'asal_sekolah' => ['nullable', 'string', 'max:100'],
            'hobi' => ['nullable', 'string', 'max:100'],
            'cita_cita' => ['nullable', 'string', 'max:100'],
            'jumlah_saudara' => ['nullable', 'integer'],
            'alamat' => ['required', 'string'],
            'provinsi' => ['nullable', 'string', 'max:50'],
            'kabupaten' => ['nullable', 'string', 'max:50'],
            'kecamatan' => ['nullable', 'string', 'max:50'],
            'desa' => ['nullable', 'string', 'max:50'],
            'kode_pos' => ['nullable', 'string', 'max:10'],
            'no_kk' => ['nullable', 'string', 'max:50'],
            // nested orang_tua fields from frontend
            'orang_tua.nama_ayah' => ['required', 'string', 'max:100'],
            'orang_tua.nik_ayah' => ['nullable', 'string', 'max:20'],
            'orang_tua.pendidikan_ayah' => ['nullable', 'string', 'max:50'],
            'orang_tua.pekerjaan_ayah' => ['nullable', 'string', 'max:100'],
            'orang_tua.hp_ayah' => ['nullable', 'string', 'max:20'],
            'orang_tua.nama_ibu' => ['required', 'string', 'max:100'],
            'orang_tua.nik_ibu' => ['nullable', 'string', 'max:20'],
            'orang_tua.pendidikan_ibu' => ['nullable', 'string', 'max:50'],
            'orang_tua.pekerjaan_ibu' => ['nullable', 'string', 'max:100'],
            'orang_tua.hp_ibu' => ['nullable', 'string', 'max:20'],
            // allow file or string path; handled in controller
            'foto' => ['nullable'],
        ]);

        // Flatten nested orang_tua back into top-level keys used by the model
        $orangTua = $validated['orang_tua'] ?? [];
        unset($validated['orang_tua']);
        $validated['nama_ayah'] = $orangTua['nama_ayah'] ?? $request->input('nama_ayah');
        $validated['nik_ayah'] = $orangTua['nik_ayah'] ?? $request->input('nik_ayah');
        $validated['pendidikan_ayah'] = $orangTua['pendidikan_ayah'] ?? $request->input('pendidikan_ayah');
        $validated['pekerjaan_ayah'] = $orangTua['pekerjaan_ayah'] ?? $request->input('pekerjaan_ayah');
        $validated['hp_ayah'] = $orangTua['hp_ayah'] ?? $request->input('hp_ayah');
        $validated['nama_ibu'] = $orangTua['nama_ibu'] ?? $request->input('nama_ibu');
        $validated['nik_ibu'] = $orangTua['nik_ibu'] ?? $request->input('nik_ibu');
        $validated['pendidikan_ibu'] = $orangTua['pendidikan_ibu'] ?? $request->input('pendidikan_ibu');
        $validated['pekerjaan_ibu'] = $orangTua['pekerjaan_ibu'] ?? $request->input('pekerjaan_ibu');
        $validated['hp_ibu'] = $orangTua['hp_ibu'] ?? $request->input('hp_ibu');

        return $validated;
    }
}