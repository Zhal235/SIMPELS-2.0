<?php

namespace App\Http\Requests\Wallet;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Cash Withdrawal Request Validation
 * 
 * Validates cash withdrawal operations (transfer from bank to cash).
 */
class CashWithdrawalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only authenticated users can withdraw cash
        return auth()->check();
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
            'note' => ['nullable', 'string', 'max:255'],
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
            'note.max' => 'Catatan maksimal 255 karakter',
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
     * Get validated note
     * 
     * @return string|null
     */
    public function getNote(): ?string
    {
        return $this->validated()['note'] ?? null;
    }
}
