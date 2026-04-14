<?php

namespace App\Http\Requests\Tabungan;

use Illuminate\Foundation\Http\FormRequest;

class SetorTabunganRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:1'],
            'description' => ['nullable', 'string', 'max:255'],
            'method' => ['nullable', 'in:cash,transfer'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Nominal setor wajib diisi.',
            'amount.numeric' => 'Nominal harus berupa angka.',
            'amount.min' => 'Nominal minimal Rp 1.',
            'description.max' => 'Keterangan maksimal 255 karakter.',
            'method.in' => 'Metode harus cash atau transfer.',
        ];
    }
}
