<?php

namespace App\Http\Controllers;

use App\Models\JenisTagihan;
use App\Traits\ValidatesDeletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JenisTagihanController extends Controller
{
    use ValidatesDeletion;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = JenisTagihan::with('bukuKas');
        
        // Filter berdasarkan tahun ajaran
        if ($request->has('tahun_ajaran_id')) {
            $query->where('tahun_ajaran_id', $request->tahun_ajaran_id);
        } elseif ($request->has('all')) {
            // Do nothing, return all
        } else {
             // Default: Filter berdasarkan tahun ajaran aktif
             $activeTa = \App\Models\TahunAjaran::where('status', 'aktif')->first();
             if ($activeTa) {
                 $query->where('tahun_ajaran_id', $activeTa->id);
             } else {
                 // Fallback if no active TA: prefer strict or allow legacy?
                 // Allowing legacy (null) for now
                 $query->whereNull('tahun_ajaran_id'); 
             }
        }

        $jenisTagihan = $query->latest()->get();
        
        return response()->json([
            'success' => true,
            'data' => $jenisTagihan->map(function($item) {
                $data = $item->formatted_data;
                $data['bukuKas'] = $item->bukuKas ? $item->bukuKas->nama_kas : null;
                return $data;
            })
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'namaTagihan' => 'required|string|max:255',
            'kategori' => 'required|in:Rutin,Non Rutin',
            'bulan' => 'required|array|min:1',
            'bulan.*' => 'string',
            'tipeNominal' => 'required|in:sama,per_kelas,per_individu',
            'jatuhTempo' => 'required|string',
            'bukuKasId' => 'required|exists:buku_kas,id',
            
            // Conditional validation based on tipe_nominal
            'nominalSama' => 'required_if:tipeNominal,sama|nullable|numeric|min:0',
            'nominalPerKelas' => 'required_if:tipeNominal,per_kelas|nullable|array',
            'nominalPerKelas.*.kelas' => 'required|string',
            'nominalPerKelas.*.nominal' => 'required|numeric|min:0',
            'nominalPerIndividu' => 'required_if:tipeNominal,per_individu|nullable|array',
            'nominalPerIndividu.*.santriId' => 'required|string',
            'nominalPerIndividu.*.santriNama' => 'required|string',
            'nominalPerIndividu.*.nominal' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Get Active TA
        $activeTa = \App\Models\TahunAjaran::where('status', 'aktif')->first();

        $data = [
            'nama_tagihan' => $request->namaTagihan,
            'kategori' => $request->kategori,
            'bulan' => $request->bulan,
            'tipe_nominal' => $request->tipeNominal,
            'jatuh_tempo' => $request->jatuhTempo,
            'buku_kas_id' => $request->bukuKasId,
            'tahun_ajaran_id' => $activeTa ? $activeTa->id : null,
        ];

        if ($request->tipeNominal === 'sama') {
            $data['nominal_sama'] = $request->nominalSama;
        } elseif ($request->tipeNominal === 'per_kelas') {
            $data['nominal_per_kelas'] = $request->nominalPerKelas;
        } elseif ($request->tipeNominal === 'per_individu') {
            $data['nominal_per_individu'] = $request->nominalPerIndividu;
        }

        $jenisTagihan = JenisTagihan::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Jenis tagihan berhasil ditambahkan',
            'data' => $jenisTagihan->formatted_data
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $jenisTagihan = JenisTagihan::with('bukuKas')->find($id);

        if (!$jenisTagihan) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis tagihan tidak ditemukan'
            ], 404);
        }

        $data = $jenisTagihan->formatted_data;
        $data['bukuKas'] = $jenisTagihan->bukuKas ? $jenisTagihan->bukuKas->nama_kas : null;

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $jenisTagihan = JenisTagihan::find($id);

        if (!$jenisTagihan) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis tagihan tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'namaTagihan' => 'required|string|max:255',
            'kategori' => 'required|in:Rutin,Non Rutin',
            'bulan' => 'required|array|min:1',
            'bulan.*' => 'string',
            'tipeNominal' => 'required|in:sama,per_kelas,per_individu',
            'jatuhTempo' => 'required|string',
            'bukuKasId' => 'required|exists:buku_kas,id',
            
            'nominalSama' => 'required_if:tipeNominal,sama|nullable|numeric|min:0',
            'nominalPerKelas' => 'required_if:tipeNominal,per_kelas|nullable|array',
            'nominalPerKelas.*.kelas' => 'required|string',
            'nominalPerKelas.*.nominal' => 'required|numeric|min:0',
            'nominalPerIndividu' => 'required_if:tipeNominal,per_individu|nullable|array',
            'nominalPerIndividu.*.santriId' => 'required|string',
            'nominalPerIndividu.*.santriNama' => 'required|string',
            'nominalPerIndividu.*.nominal' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = [
            'nama_tagihan' => $request->namaTagihan,
            'kategori' => $request->kategori,
            'bulan' => $request->bulan,
            'tipe_nominal' => $request->tipeNominal,
            'jatuh_tempo' => $request->jatuhTempo,
            'buku_kas_id' => $request->bukuKasId,
            // Reset all nominal fields
            'nominal_sama' => null,
            'nominal_per_kelas' => null,
            'nominal_per_individu' => null,
        ];

        if ($request->tipeNominal === 'sama') {
            $data['nominal_sama'] = $request->nominalSama;
        } elseif ($request->tipeNominal === 'per_kelas') {
            $data['nominal_per_kelas'] = $request->nominalPerKelas;
        } elseif ($request->tipeNominal === 'per_individu') {
            $data['nominal_per_individu'] = $request->nominalPerIndividu;
        }

        $jenisTagihan->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Jenis tagihan berhasil diperbarui',
            'data' => $jenisTagihan->formatted_data
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $jenisTagihan = JenisTagihan::find($id);

        if (!$jenisTagihan) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis tagihan tidak ditemukan'
            ], 404);
        }

        // Validasi dependency sebelum delete
        $validation = $this->validateDeletion($jenisTagihan, [
            'jenisTagihan' => [
                'label' => 'Tagihan Santri',
                'action' => 'Hapus semua tagihan santri yang menggunakan jenis tagihan "' . $jenisTagihan->nama_tagihan . '" terlebih dahulu'
            ],
        ]);

        // Return response sesuai hasil validasi
        return $this->deletionResponse($validation, function() use ($jenisTagihan) {
            $jenisTagihan->delete();
        });
    }
}
