<?php

namespace App\Http\Requests\Tagihan;

use Illuminate\Foundation\Http\FormRequest;

class BulkTagihanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tunggakan' => ['required', 'array', 'min:1'],
            'tunggakan.*.santri_id' => ['required', 'exists:santri,id'],
            'tunggakan.*.jenis_tagihan_id' => ['required', 'exists:jenis_tagihan,id'],
            'tunggakan.*.bulan' => ['required', 'string'],
            'tunggakan.*.nominal' => ['required', 'numeric', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'tunggakan.required' => 'Data tunggakan wajib diisi.',
            'tunggakan.min' => 'Minimal 1 data tunggakan harus diisi.',
            'tunggakan.*.santri_id.required' => 'Santri wajib dipilih.',
            'tunggakan.*.santri_id.exists' => 'Santri tidak ditemukan.',
            'tunggakan.*.jenis_tagihan_id.required' => 'Jenis tagihan wajib dipilih.',
            'tunggakan.*.jenis_tagihan_id.exists' => 'Jenis tagihan tidak ditemukan.',
            'tunggakan.*.bulan.required' => 'Bulan wajib diisi.',
            'tunggakan.*.nominal.required' => 'Nominal wajib diisi.',
            'tunggakan.*.nominal.min' => 'Nominal harus lebih dari 0.',
        ];
    }
}
