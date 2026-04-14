<?php

namespace App\Http\Requests\Pembayaran;

use Illuminate\Foundation\Http\FormRequest;

class StorePembayaranRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tagihan_santri_id' => ['required', 'exists:tagihan_santri,id'],
            'nominal_bayar' => ['required', 'numeric', 'min:1'],
            'metode_pembayaran' => ['required', 'in:cash,transfer'],
            'tanggal_bayar' => ['required', 'date'],
            'keterangan' => ['nullable', 'string', 'max:500'],
            'kwitansi_data' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'tagihan_santri_id.required' => 'Tagihan wajib dipilih.',
            'tagihan_santri_id.exists' => 'Tagihan tidak ditemukan.',
            'nominal_bayar.required' => 'Nominal pembayaran wajib diisi.',
            'nominal_bayar.numeric' => 'Nominal harus berupa angka.',
            'nominal_bayar.min' => 'Nominal minimal Rp 1.',
            'metode_pembayaran.required' => 'Metode pembayaran wajib dipilih.',
            'metode_pembayaran.in' => 'Metode pembayaran tidak valid.',
            'tanggal_bayar.required' => 'Tanggal pembayaran wajib diisi.',
            'tanggal_bayar.date' => 'Format tanggal tidak valid.',
            'keterangan.max' => 'Keterangan maksimal 500 karakter.',
        ];
    }
}
