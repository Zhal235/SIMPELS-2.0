<?php

namespace App\Http\Requests\Wallet;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Transaction Request Validation
 * 
 * Validates transaction update operations (admin only).
 */
class UpdateTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can update transactions
        $user = auth()->user();
        return $user && ($user->role ?? 'user') === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['sometimes', 'numeric', 'min:1', 'max:100000000'],
            'method' => ['sometimes', 'string', 'in:cash,transfer'],
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
            'admin_note' => ['required', 'string', 'max:500'],
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
            'amount.numeric' => 'Jumlah harus berupa angka',
            'amount.min' => 'Jumlah minimal Rp 1',
            'amount.max' => 'Jumlah maksimal Rp 100.000.000',
            'method.in' => 'Metode pembayaran harus cash atau transfer',
            'description.max' => 'Deskripsi maksimal 255 karakter',
            'admin_note.required' => 'Catatan admin wajib diisi untuk audit trail',
            'admin_note.max' => 'Catatan admin maksimal 500 karakter',
        ];
    }

    /**
     * Check if authorization failed
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    protected function failedAuthorization()
    {
        abort(403, 'Only admin can update transactions');
    }
}
