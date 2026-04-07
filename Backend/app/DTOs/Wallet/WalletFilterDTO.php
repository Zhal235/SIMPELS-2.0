<?php

namespace App\DTOs\Wallet;

/**
 * Wallet Filter DTO
 * 
 * Data Transfer Object for wallet filtering parameters.
 * Provides type safety and validation for filter operations.
 */
class WalletFilterDTO
{
    public ?string $nama_santri;
    public ?string $nis;
    public ?int $kelas_id;
    public ?float $min_balance;
    public ?float $max_balance;
    public string $sort_by;
    public string $sort_order;
    public int $per_page;

    public function __construct(array $data = [])
    {
        $this->nama_santri = $data['nama_santri'] ?? null;
        $this->nis = $data['nis'] ?? null;
        $this->kelas_id = isset($data['kelas_id']) ? (int) $data['kelas_id'] : null;
        $this->min_balance = isset($data['min_balance']) ? (float) $data['min_balance'] : null;
        $this->max_balance = isset($data['max_balance']) ? (float) $data['max_balance'] : null;
        $this->sort_by = $data['sort_by'] ?? 'created_at';
        $this->sort_order = $data['sort_order'] ?? 'desc';
        $this->per_page = isset($data['per_page']) ? (int) $data['per_page'] : 15;
    }

    /**
     * Convert DTO to array for repository use
     * 
     * @return array
     */
    public function toArray(): array
    {
        return [
            'nama_santri' => $this->nama_santri,
            'nis' => $this->nis,
            'kelas_id' => $this->kelas_id,
            'min_balance' => $this->min_balance,
            'max_balance' => $this->max_balance,
            'sort_by' => $this->sort_by,
            'sort_order' => $this->sort_order,
            'per_page' => $this->per_page,
        ];
    }

    /**
     * Create DTO from request
     * 
     * @param \Illuminate\Http\Request $request
     * @return self
     */
    public static function fromRequest($request): self
    {
        return new self($request->all());
    }
}
