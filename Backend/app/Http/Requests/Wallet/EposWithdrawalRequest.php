<?php

namespace App\Http\Requests\Wallet;

use Illuminate\Foundation\Http\FormRequest;

/**
 * EPOS Withdrawal Request Validation
 * 
 * Validates EPOS withdrawal operations.
 */
class EposWithdrawalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // EPOS endpoints are typically public or use API key authentication
        // Authorization is handled in the service layer
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:1', 'max:100000000'],
            'pool_id' => ['nullable', 'integer', 'exists:epos_pools,id'],
            'note' => ['nullable', 'string', 'max:255'],
            'withdrawal_number' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'Jumlah penarikan wajib diisi',
            'amount.numeric' => 'Jumlah penarikan harus berupa angka',
            'amount.min' => 'Jumlah penarikan minimal Rp 1',
            'amount.max' => 'Jumlah penarikan maksimal Rp 100.000.000',
            'pool_id.integer' => 'Pool ID harus berupa angka',
            'pool_id.exists' => 'Pool tidak ditemukan',
            'note.max' => 'Catatan maksimal 255 karakter',
            'withdrawal_number.max' => 'Nomor penarikan maksimal 50 karakter',
        ];
    }

    /**
     * Get validated amount
     * 
     * @return float
     */
    public function getAmount(): float
    {
        return (float) $this->validated()['amount'];
    }

    /**
     * Get validated pool ID
     * 
     * @return int|null
     */
    public function getPoolId(): ?int
    {
        $poolId = $this->validated()['pool_id'] ?? null;
        return $poolId ? (int) $poolId : null;
    }
}
