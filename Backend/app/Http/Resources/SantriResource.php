<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SantriResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nis' => $this->nis,
            'nisn' => $this->nisn,
            'nik_santri' => $this->nik_santri,
            'nama_santri' => $this->nama_santri,
            'tempat_lahir' => $this->tempat_lahir,
            'tanggal_lahir' => $this->tanggal_lahir,
            'jenis_kelamin' => $this->jenis_kelamin,
            'status' => $this->status,
            'kelas_id' => $this->kelas_id,
            'kelas' => $this->kelas?->nama_kelas,
            'kelas_nama' => $this->kelas?->nama_kelas, // Alias for frontend compatibility
            'asrama_id' => $this->asrama_id,
            'asrama' => $this->asrama?->nama_asrama,
            'asrama_nama' => $this->asrama?->nama_asrama, // Alias for frontend compatibility
            'asal_sekolah' => $this->asal_sekolah,
            'hobi' => $this->hobi,
            'cita_cita' => $this->cita_cita,
            'jumlah_saudara' => $this->jumlah_saudara,
            'alamat' => $this->alamat,
            'provinsi' => $this->provinsi,
            'kabupaten' => $this->kabupaten,
            'kecamatan' => $this->kecamatan,
            'desa' => $this->desa,
            'kode_pos' => $this->kode_pos,
            'no_kk' => $this->no_kk,
            'nama_ayah' => $this->nama_ayah,
            'nik_ayah' => $this->nik_ayah,
            'pendidikan_ayah' => $this->pendidikan_ayah,
            'pekerjaan_ayah' => $this->pekerjaan_ayah,
            'hp_ayah' => $this->hp_ayah,
            'nama_ibu' => $this->nama_ibu,
            'nik_ibu' => $this->nik_ibu,
            'pendidikan_ibu' => $this->pendidikan_ibu,
            'pekerjaan_ibu' => $this->pekerjaan_ibu,
            'hp_ibu' => $this->hp_ibu,
            'jenis_penerimaan' => $this->jenis_penerimaan,
            'foto' => $this->foto ? '/storage/' . $this->foto : null,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            // RFID tag information
            'rfid_tag' => $this->rfid_tag ? [
                'id' => $this->rfid_tag->id,
                'uid' => $this->rfid_tag->uid,
                'active' => $this->rfid_tag->active,
            ] : null,
            'rfid_uid' => $this->rfid_tag?->uid,
            // Wallet information
            'wallet' => $this->wallet ? [
                'id' => $this->wallet->id,
                'balance' => $this->wallet->balance,
            ] : null,
            // keep a nested object for backward/alternate shapes used by some frontends
            'orang_tua' => [
                'no_kk' => $this->no_kk,
                'nama_ayah' => $this->nama_ayah,
                'nik_ayah' => $this->nik_ayah,
                'pendidikan_ayah' => $this->pendidikan_ayah,
                'pekerjaan_ayah' => $this->pekerjaan_ayah,
                'hp_ayah' => $this->hp_ayah,
                'nama_ibu' => $this->nama_ibu,
                'nik_ibu' => $this->nik_ibu,
                'pendidikan_ibu' => $this->pendidikan_ibu,
                'pekerjaan_ibu' => $this->pekerjaan_ibu,
                'hp_ibu' => $this->hp_ibu,
            ],
        ];
    }
}