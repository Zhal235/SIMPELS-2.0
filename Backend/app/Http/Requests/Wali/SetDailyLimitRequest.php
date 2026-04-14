<?php

namespace App\Http\Requests\Wali;

use Illuminate\Foundation\Http\FormRequest;

class SetDailyLimitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'daily_limit' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'daily_limit.required' => 'Limit harian wajib diisi.',
            'daily_limit.numeric' => 'Limit harian harus berupa angka.',
            'daily_limit.min' => 'Limit harian tidak boleh negatif.',
        ];
    }
}
