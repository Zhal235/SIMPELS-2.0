<?php

namespace App\Services\Wali;

use App\Models\Santri;
use App\Models\DataCorrection;
use Illuminate\Support\Facades\Storage;

/**
 * Wali Santri Service
 * 
 * Handles santri data retrieval and data correction requests for wali
 */
class WaliSantriService
{
    /**
     * Get list of santri (filtered by wali in future)
     * 
     * @return array
     */
    public function getSantriList(): array
    {
        $santri = Santri::with(['kelas', 'asrama'])
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'nis' => $s->nis,
                    'nama' => $s->nama_santri,
                    'jenis_kelamin' => $s->jenis_kelamin,
                    'kelas' => $s->kelas->nama_kelas ?? null,
                    'asrama' => $s->asrama->nama_asrama ?? null,
                    'foto_url' => $s->foto ? Storage::disk('r2')->url($s->foto) : null,
                    'saldo_dompet' => $this->getSaldoDompet($s->id),
                ];
            });

        return [
            'success' => true,
            'data' => $santri->toArray(),
        ];
    }

    /**
     * Get detailed santri information
     * 
     * @param int $santriId
     * @return array
     */
    public function getSantriDetail(int $santriId): array
    {
        $santri = Santri::with(['kelas', 'asrama'])
            ->where('id', $santriId)
            ->where('status', 'aktif')
            ->first();

        if (!$santri) {
            return [
                'success' => false,
                'message' => 'Data santri tidak ditemukan',
                'status_code' => 404,
            ];
        }

        return [
            'success' => true,
            'data' => [
                'nis' => $santri->nis ?? '-',
                'nama_santri' => $santri->nama_santri ?? '-',
                'jenis_kelamin' => $santri->jenis_kelamin ?? '-',
                'tempat_lahir' => $santri->tempat_lahir ?? '-',
                'tanggal_lahir' => $santri->tanggal_lahir ?? '-',
                'nik' => $santri->nik ?? '-',
                'no_kk' => $santri->no_kk ?? '-',
                'alamat' => $santri->alamat ?? '-',
                'kelas_nama' => $santri->kelas ? $santri->kelas->nama_kelas : '-',
                'asrama_nama' => $santri->asrama ? $santri->asrama->nama_asrama : '-',
                'status' => $santri->status ? ucfirst($santri->status) : '-',
                'nama_ayah' => $santri->nama_ayah ?? '-',
                'nik_ayah' => $santri->nik_ayah ?? '-',
                'hp_ayah' => $santri->hp_ayah ?? '-',
                'pekerjaan_ayah' => $santri->pekerjaan_ayah ?? '-',
                'nama_ibu' => $santri->nama_ibu ?? '-',
                'nik_ibu' => $santri->nik_ibu ?? '-',
                'hp_ibu' => $santri->hp_ibu ?? '-',
                'pekerjaan_ibu' => $santri->pekerjaan_ibu ?? '-',
            ],
            'status_code' => 200,
        ];
    }

    /**
     * Submit data correction request
     * 
     * @param int $santriId
     * @param array $data ['field_name', 'old_value', 'new_value', 'note']
     * @return array
     */
    public function submitDataCorrection(int $santriId, array $data): array
    {
        $santri = Santri::where('id', $santriId)
            ->where('status', 'aktif')
            ->first();

        if (!$santri) {
            return [
                'success' => false,
                'message' => 'Data santri tidak ditemukan',
                'status_code' => 404,
            ];
        }

        // Create correction request
        $correction = DataCorrection::create([
            'santri_id' => $santriId,
            'field_name' => $data['field_name'],
            'old_value' => $data['old_value'],
            'new_value' => $data['new_value'],
            'note' => $data['note'] ?? null,
            'status' => 'pending',
            'requested_by' => 'wali',
        ]);

        return [
            'success' => true,
            'message' => 'Permintaan koreksi berhasil dikirim. Menunggu persetujuan admin.',
            'data' => $correction,
            'status_code' => 201,
        ];
    }

    /**
     * Get santri wallet balance (helper method)
     * 
     * @param int $santriId
     * @return float
     */
    private function getSaldoDompet(int $santriId): float
    {
        $wallet = \App\Models\Wallet::where('santri_id', $santriId)->first();
        return $wallet ? ($wallet->balance ?? 0) : 0;
    }
}
