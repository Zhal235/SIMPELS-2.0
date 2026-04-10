<?php

namespace App\Http\Requests\Tagihan;

use App\Models\TagihanSantri;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTagihanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        if ($this->has('nominal')) {
            return [
                'nominal' => ['required', 'numeric', 'min:0'],
            ];
        }

        $tagihan = TagihanSantri::find($this->route('tagihan_santri'));

        return [
            'dibayar' => ['required', 'numeric', 'min:0', 'max:' . ($tagihan?->nominal ?? 0)],
        ];
    }

    public function messages(): array
    {
        return [
            'nominal.required' => 'Nominal wajib diisi.',
            'nominal.numeric' => 'Nominal harus berupa angka.',
            'nominal.min' => 'Nominal tidak boleh negatif.',
            'dibayar.required' => 'Jumlah bayar wajib diisi.',
            'dibayar.numeric' => 'Jumlah bayar harus berupa angka.',
            'dibayar.min' => 'Jumlah bayar tidak boleh negatif.',
            'dibayar.max' => 'Jumlah bayar tidak boleh melebihi nominal tagihan.',
        ];
    }
}
