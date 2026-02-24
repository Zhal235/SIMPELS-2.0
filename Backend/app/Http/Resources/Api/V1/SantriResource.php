<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SantriResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nis' => $this->nis,
            'nama' => $this->nama_santri,
            'jenis_kelamin' => $this->jenis_kelamin == 'L' ? 'Laki-laki' : 'Perempuan',
            'kelas' => $this->kelas ? $this->kelas->nama_kelas : $this->kelas_nama,
            'asrama' => $this->asrama ? $this->asrama->nama_asrama : $this->asrama_nama,
            'orang_tua' => [
                'ayah' => $this->nama_ayah,
                'ibu' => $this->nama_ibu,
                'hp_ayah' => $this->hp_ayah,
                'hp_ibu' => $this->hp_ibu,
            ],
            'foto_url' => $this->foto 
                ? (filter_var($this->foto, FILTER_VALIDATE_URL) ? $this->foto : \Illuminate\Support\Facades\Storage::disk('r2')->url($this->foto))
                : null,
            'status' => $this->status,
        ];
    }
}
