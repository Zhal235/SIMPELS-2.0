<?php

namespace App\DTOs\Wallet;

/**
 * Transaction Filter DTO
 * 
 * Data Transfer Object for transaction filtering parameters.
 */
class TransactionFilterDTO
{
    public ?int $santri_id;
    public ?string $type; // credit|debit
    public ?string $method; // cash|transfer
    public ?string $start_date;
    public ?string $end_date;
    public bool $exclude_voided;
    public string $sort_by;
    public string $sort_order;
    public int $per_page;

    public function __construct(array $data = [])
    {
        $this->santri_id = isset($data['santri_id']) ? (int) $data['santri_id'] : null;
        $this->type = $data['type'] ?? null;
        $this->method = $data['method'] ?? null;
        $this->start_date = $data['start_date'] ?? null;
        $this->end_date = $data['end_date'] ?? null;
        $this->exclude_voided = $data['exclude_voided'] ?? true;
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
        return array_filter([
            'santri_id' => $this->santri_id,
            'type' => $this->type,
            'method' => $this->method,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'exclude_voided' => $this->exclude_voided,
            'sort_by' => $this->sort_by,
            'sort_order' => $this->sort_order,
            'per_page' => $this->per_page,
        ], function($value) {
            return $value !== null;
        });
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

    /**
     * Validate transaction type
     * 
     * @return bool
     */
    public function hasValidType(): bool
    {
        return in_array($this->type, ['credit', 'debit', null]);
    }

    /**
     * Validate payment method
     * 
     * @return bool
     */
    public function hasValidMethod(): bool
    {
        return in_array($this->method, ['cash', 'transfer', null]);
    }
}
