<?php

namespace App\Http\Requests\Wali;

use Illuminate\Foundation\Http\FormRequest;

class UploadBuktiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bukti' => ['required', 'file', 'image', 'max:2048'],
            'tagihan_ids' => ['sometimes', 'array'],
            'tagihan_ids.*' => ['integer', 'exists:tagihan_santri,id'],
            'total_nominal' => ['required', 'numeric', 'min:1'],
            'selected_bank_id' => ['sometimes', 'nullable', 'integer', 'exists:bank_accounts,id'],
            'nominal_topup' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'nominal_tabungan' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'catatan' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'bukti.required' => 'Bukti transfer wajib diunggah.',
            'bukti.image' => 'File harus berupa gambar.',
            'bukti.max' => 'Ukuran file maksimal 2MB.',
            'total_nominal.required' => 'Total nominal wajib diisi.',
            'total_nominal.min' => 'Total nominal minimal Rp 1.',
            'tagihan_ids.*.exists' => 'Tagihan tidak valid.',
            'selected_bank_id.exists' => 'Bank tujuan tidak valid.',
            'catatan.max' => 'Catatan maksimal 500 karakter.',
        ];
    }
}
