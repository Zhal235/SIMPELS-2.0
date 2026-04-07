<?php

namespace App\DTOs\Wallet;

/**
 * Withdrawal Request DTO
 * 
 * Data Transfer Object for wallet withdrawal operations.
 * Used for both cash withdrawals and EPOS withdrawals.
 */
class WithdrawalRequestDTO
{
    public float $amount;
    public ?string $method; // cash|transfer (for cash withdrawal)
    public ?string $note;
    public ?int $pool_id; // For EPOS withdrawals
    public ?int $requested_by;
    public ?string $type; // 'cash' | 'epos'

    public function __construct(array $data)
    {
        $this->amount = (float) $data['amount'];
        $this->method = $data['method'] ?? null;
        $this->note = $data['note'] ?? null;
        $this->pool_id = isset($data['pool_id']) ? (int) $data['pool_id'] : null;
        $this->requested_by = isset($data['requested_by']) ? (int) $data['requested_by'] : null;
        $this->type = $data['type'] ?? 'epos';
    }

    /**
     * Validate withdrawal request
     * 
     * @return array ['valid' => bool, 'errors' => array]
     */
    public function validate(): array
    {
        $errors = [];

        if ($this->amount <= 0) {
            $errors['amount'] = 'Amount must be greater than 0';
        }

        // For cash withdrawals, method is required
        if ($this->type === 'cash' && !in_array($this->method, ['cash', 'transfer'])) {
            $errors['method'] = 'Method must be either cash or transfer for cash withdrawals';
        }

        // For EPOS withdrawals, pool_id should be provided
        if ($this->type === 'epos' && !$this->pool_id) {
            // Pool ID is optional, will be created if not provided
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Check if this is a cash withdrawal
     * 
     * @return bool
     */
    public function isCashWithdrawal(): bool
    {
        return $this->type === 'cash';
    }

    /**
     * Check if this is an EPOS withdrawal
     * 
     * @return bool
     */
    public function isEposWithdrawal(): bool
    {
        return $this->type === 'epos';
    }

    /**
     * Convert to withdrawal record data
     * 
     * @param string $reference
     * @param string $status
     * @return array
     */
    public function toWithdrawalData(string $reference, string $status = 'pending'): array
    {
        $userId = $this->requested_by ?? auth()->id() ?? 1;
        
        return [
            'pool_id' => $this->pool_id,
            'amount' => $this->amount,
            'status' => $status,
            'requested_by' => $userId,
            'processed_by' => $status === 'done' ? $userId : null,
            'epos_ref' => $reference,
            'notes' => $this->note,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Create DTO from request for cash withdrawal
     * 
     * @param \Illuminate\Http\Request $request
     * @return self
     */
    public static function fromRequestForCash($request): self
    {
        $data = $request->all();
        $data['type'] = 'cash';
        $data['requested_by'] = auth()->id();
        
        return new self($data);
    }

    /**
     * Create DTO from request for EPOS withdrawal
     * 
     * @param \Illuminate\Http\Request $request
     * @return self
     */
    public static function fromRequestForEpos($request): self
    {
        $data = $request->all();
        $data['type'] = 'epos';
        $data['requested_by'] = auth()->id();
        
        return new self($data);
    }
}
