<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletResource extends JsonResource
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
            'santri_id' => $this->santri_id,
            'balance' => $this->balance,
            'formatted_balance' => 'Rp ' . number_format($this->balance, 0, ',', '.'),
            'santri' => new SantriResource($this->whenLoaded('santri')),
            'last_updated' => $this->updated_at->toIso8601String(),
        ];
    }
}
