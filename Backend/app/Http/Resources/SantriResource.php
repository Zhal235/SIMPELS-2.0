<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'nama_santri' => $this->nama_santri,
            'jenis_kelamin' => $this->jenis_kelamin,
            'status' => $this->status,
            'kelas_id' => $this->kelas_id,
            'kelas' => $this->kelas?->nama_kelas,
            'kelas_nama' => $this->kelas?->nama_kelas, // Alias for frontend compatibility
            'asrama_id' => $this->asrama_id,
            'asrama' => $this->asrama?->nama_asrama,
            'alamat' => $this->alamat,
            'nama_ayah' => $this->nama_ayah,
            'hp_ayah' => $this->hp_ayah,
            'nama_ibu' => $this->nama_ibu,
            'hp_ibu' => $this->hp_ibu,
            'foto' => $this->foto ? Storage::url($this->foto) : null,
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
                'nama_ayah' => $this->nama_ayah,
                'hp_ayah' => $this->hp_ayah,
                'nama_ibu' => $this->nama_ibu,
                'hp_ibu' => $this->hp_ibu,
            ],
        ];
    }
}