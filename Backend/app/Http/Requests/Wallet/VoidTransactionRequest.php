<?php

namespace App\Http\Requests\Wallet;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Void Transaction Request Validation
 * 
 * Validates transaction void operations (admin only).
 */
class VoidTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can void transactions
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
            'void_reason' => ['required', 'string', 'max:500'],
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
            'void_reason.required' => 'Alasan void wajib diisi agar wali santri dapat memahami',
            'void_reason.max' => 'Alasan void maksimal 500 karakter',
        ];
    }

    /**
     * Get validated reason
     * 
     * @return string
     */
    public function getVoidReason(): string
    {
        return $this->validated()['void_reason'];
    }

    /**
     * Check if authorization failed
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    protected function failedAuthorization()
    {
        abort(403, 'Only admin can void transactions');
    }
}
