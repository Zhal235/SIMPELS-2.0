<?php

namespace App\Http\Requests\Santri;

use Illuminate\Foundation\Http\FormRequest;

class ImportSantriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'File Excel wajib diunggah.',
            'file.file' => 'Upload harus berupa file.',
            'file.mimes' => 'File harus berformat Excel (.xlsx atau .xls).',
            'file.max' => 'Ukuran file maksimal 5MB.',
        ];
    }

    public function getFile(): \Illuminate\Http\UploadedFile
    {
        return $this->file('file');
    }
}
