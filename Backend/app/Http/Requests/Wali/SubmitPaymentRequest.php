<?php

namespace App\Http\Requests\Wali;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request for SubmitPayment (DEPRECATED)
 * 
 * This request is no longer used as payment submission
 * is now handled via UploadBuktiRequest.
 * Kept for backward compatibility.
 */
class SubmitPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tagihan_ids' => ['required', 'array', 'min:1'],
            'tagihan_ids.*' => ['integer', 'exists:tagihan_santri,id'],
            'total_amount' => ['required', 'numeric', 'min:1'],
            'payment_method' => ['required', 'in:cash,transfer'],
        ];
    }

    public function messages(): array
    {
        return [
            'tagihan_ids.required' => 'Tagihan wajib dipilih.',
            'tagihan_ids.min' => 'Minimal 1 tagihan harus dipilih.',
            'tagihan_ids.*.exists' => 'Tagihan tidak valid.',
            'total_amount.required' => 'Total pembayaran wajib diisi.',
            'total_amount.min' => 'Total pembayaran minimal Rp 1.',
            'payment_method.in' => 'Metode pembayaran tidak valid.',
        ];
    }
}
