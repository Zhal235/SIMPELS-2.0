<?php

namespace App\Http\Requests\Tagihan;

use Illuminate\Foundation\Http\FormRequest;

class CreateTagihanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jenis_tagihan_id' => ['required', 'exists:jenis_tagihan,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'jenis_tagihan_id.required' => 'Jenis tagihan wajib dipilih.',
            'jenis_tagihan_id.exists' => 'Jenis tagihan tidak ditemukan.',
        ];
    }
}
