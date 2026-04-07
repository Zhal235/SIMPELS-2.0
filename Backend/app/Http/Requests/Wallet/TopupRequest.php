<?php

namespace App\Http\Requests\Wallet;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Topup Request Validation
 * 
 * Validates wallet topup/credit operations.
 */
class TopupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only authenticated users can topup
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
            'method' => ['required', 'string', 'in:cash,transfer'],
            'description' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:100'],
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
            'amount.required' => 'Jumlah topup wajib diisi',
            'amount.numeric' => 'Jumlah topup harus berupa angka',
            'amount.min' => 'Jumlah topup minimal Rp 1',
            'amount.max' => 'Jumlah topup maksimal Rp 100.000.000',
            'method.required' => 'Metode pembayaran wajib dipilih',
            'method.in' => 'Metode pembayaran harus cash atau transfer',
            'description.max' => 'Deskripsi maksimal 255 karakter',
            'reference.max' => 'Referensi maksimal 100 karakter',
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
     * Get validated method
     * 
     * @return string
     */
    public function getMethod(): string
    {
        return $this->validated()['method'];
    }
}
