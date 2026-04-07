<?php

namespace App\DTOs\Wallet;

/**
 * Topup Request DTO
 * 
 * Data Transfer Object for wallet topup operations.
 * Provides type safety and validation.
 */
class TopupRequestDTO
{
    public int $santri_id;
    public float $amount;
    public string $method; // cash|transfer
    public ?string $description;
    public ?string $reference;
    public ?int $created_by;

    public function __construct(array $data)
    {
        $this->santri_id = (int) $data['santri_id'];
        $this->amount = (float) $data['amount'];
        $this->method = $data['method'];
        $this->description = $data['description'] ?? null;
        $this->reference = $data['reference'] ?? null;
        $this->created_by = isset($data['created_by']) ? (int) $data['created_by'] : null;
    }

    /**
     * Validate topup request
     * 
     * @return array ['valid' => bool, 'errors' => array]
     */
    public function validate(): array
    {
        $errors = [];

        if ($this->amount <= 0) {
            $errors['amount'] = 'Amount must be greater than 0';
        }

        if (!in_array($this->method, ['cash', 'transfer'])) {
            $errors['method'] = 'Method must be either cash or transfer';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Convert to transaction data array
     * 
     * @param int $walletId
     * @param float $balanceAfter
     * @return array
     */
    public function toTransactionData(int $walletId, float $balanceAfter): array
    {
        return [
            'wallet_id' => $walletId,
            'type' => 'credit',
            'amount' => $this->amount,
            'balance_after' => $balanceAfter,
            'method' => $this->method,
            'description' => $this->description ?? "Topup via {$this->method}",
            'reference' => $this->reference,
            'created_by' => $this->created_by,
        ];
    }

    /**
     * Create DTO from request
     * 
     * @param \Illuminate\Http\Request $request
     * @param int $santriId
     * @return self
     */
    public static function fromRequest($request, int $santriId): self
    {
        $data = $request->all();
        $data['santri_id'] = $santriId;
        $data['created_by'] = auth()->id();
        
        return new self($data);
    }
}
