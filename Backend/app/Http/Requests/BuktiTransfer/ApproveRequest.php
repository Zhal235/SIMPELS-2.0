<?php

namespace App\Http\Requests\BuktiTransfer;

use Illuminate\Foundation\Http\FormRequest;

class ApproveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'catatan' => ['nullable', 'string', 'max:500'],
            'nominal_topup' => ['nullable', 'numeric', 'min:0'],
            'nominal_tabungan' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'catatan.max' => 'Catatan maksimal 500 karakter.',
            'nominal_topup.numeric' => 'Nominal top-up harus berupa angka.',
            'nominal_topup.min' => 'Nominal top-up tidak boleh negatif.',
            'nominal_tabungan.numeric' => 'Nominal tabungan harus berupa angka.',
            'nominal_tabungan.min' => 'Nominal tabungan tidak boleh negatif.',
        ];
    }
}
