<?php

namespace App\Http\Requests\Tabungan;

use Illuminate\Foundation\Http\FormRequest;

class StoreTabunganRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'santri_id' => ['required', 'exists:santri,id'],
            'opened_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'santri_id.required' => 'Santri wajib dipilih.',
            'santri_id.exists' => 'Santri tidak ditemukan.',
            'opened_at.required' => 'Tanggal buka tabungan wajib diisi.',
            'opened_at.date' => 'Format tanggal tidak valid.',
            'notes.max' => 'Catatan maksimal 500 karakter.',
        ];
    }
}
