<?php

namespace App\Http\Requests\Wali;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'no_hp' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'no_hp.required' => 'Nomor HP wajib diisi.',
            'no_hp.max' => 'Nomor HP maksimal 20 karakter.',
            'password.required' => 'Password wajib diisi.',
        ];
    }
}
