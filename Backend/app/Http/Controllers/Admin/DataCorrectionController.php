<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DataCorrection;
use App\Models\Kesantrian\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DataCorrectionController extends Controller
{
    /**
     * Get list of data corrections
     */
    public function index(Request $request)
    {
        \Log::info('DataCorrection index called', [
            'status_filter' => $request->status,
            'user_id' => Auth::id()
        ]);

        $query = DataCorrection::with('santri')
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $corrections = $query->get()->map(function ($correction) {
            return [
                'id' => $correction->id,
                'santri_id' => $correction->santri_id,
                'santri_nama' => $correction->santri ? $correction->santri->nama_santri : 'Unknown',
                'field_name' => $correction->field_name,
                'old_value' => $correction->old_value,
                'new_value' => $correction->new_value,
                'note' => $correction->note,
                'status' => $correction->status,
                'requested_by' => $correction->requested_by,
                'admin_note' => $correction->admin_note,
                'approved_by' => $correction->approved_by,
                'approved_at' => $correction->approved_at,
                'created_at' => $correction->created_at->toISOString(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $corrections
        ]);
    }

    /**
     * Approve correction and update santri data
     */
    public function approve(Request $request, $id)
    {
        $request->validate([
            'admin_note' => 'nullable|string',
        ]);

        $correction = DataCorrection::with('santri')->find($id);

        if (!$correction) {
            return response()->json([
                'success' => false,
                'message' => 'Data koreksi tidak ditemukan'
            ], 404);
        }

        if ($correction->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Koreksi sudah diproses sebelumnya'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update santri data
            $santri = Santri::find($correction->santri_id);
            if ($santri) {
                // Map field names to actual column names
                $fieldMap = [
                    'Nama Lengkap' => 'nama_santri',
                    'Jenis Kelamin' => 'jenis_kelamin',
                    'Tempat Lahir' => 'tempat_lahir',
                    'Tanggal Lahir' => 'tanggal_lahir',
                    'NIK' => 'nik',
                    'No KK' => 'no_kk',
                    'Alamat' => 'alamat',
                    'Nama Ayah' => 'nama_ayah',
                    'NIK Ayah' => 'nik_ayah',
                    'HP Ayah' => 'hp_ayah',
                    'Pekerjaan Ayah' => 'pekerjaan_ayah',
                    'Nama Ibu' => 'nama_ibu',
                    'NIK Ibu' => 'nik_ibu',
                    'HP Ibu' => 'hp_ibu',
                    'Pekerjaan Ibu' => 'pekerjaan_ibu',
                ];

                $columnName = $fieldMap[$correction->field_name] ?? null;
                
                if ($columnName && $santri->isFillable($columnName)) {
                    $santri->update([
                        $columnName => $correction->new_value
                    ]);
                }
            }

            // Update correction status
            $correction->update([
                'status' => 'approved',
                'admin_note' => $request->admin_note,
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Koreksi berhasil disetujui dan data santri telah diperbarui'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui koreksi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject correction
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'admin_note' => 'required|string',
        ]);

        $correction = DataCorrection::find($id);

        if (!$correction) {
            return response()->json([
                'success' => false,
                'message' => 'Data koreksi tidak ditemukan'
            ], 404);
        }

        if ($correction->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Koreksi sudah diproses sebelumnya'
            ], 422);
        }

        $correction->update([
            'status' => 'rejected',
            'admin_note' => $request->admin_note,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Koreksi berhasil ditolak'
        ]);
    }
}
