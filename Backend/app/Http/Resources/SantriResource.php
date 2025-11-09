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
            'nama_santri' => $this->nama_santri,
            'jenis_kelamin' => $this->jenis_kelamin,
            'kelas' => $this->kelas?->nama_kelas,
            'asrama' => $this->asrama?->nama_asrama,
            'alamat' => $this->alamat,
            'nama_ayah' => $this->nama_ayah,
            'nama_ibu' => $this->nama_ibu,
            'foto_url' => $this->foto ? asset('storage/'.$this->foto) : null,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}