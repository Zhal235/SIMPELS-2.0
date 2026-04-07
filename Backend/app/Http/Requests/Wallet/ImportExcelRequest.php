<?php

namespace App\Http\Requests\Wallet;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Import Excel Request Validation
 * 
 * Validates Excel file imports for wallet balances.
 */
class ImportExcelRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Only admin can import wallet data
        $user = auth()->user();
        return $user && ($user->role ?? 'user') === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'mimes:xlsx,xls',
                'max:10240', // 10MB max
            ],
            'mode' => [
                'sometimes',
                'string',
                'in:preview,execute',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'File Excel wajib diupload',
            'file.file' => 'Upload harus berupa file',
            'file.mimes' => 'File harus berformat Excel (.xlsx atau .xls)',
            'file.max' => 'Ukuran file maksimal 10MB',
            'mode.in' => 'Mode harus preview atau execute',
        ];
    }

    /**
     * Get uploaded file
     * 
     * @return \Illuminate\Http\UploadedFile
     */
    public function getFile()
    {
        return $this->file('file');
    }

    /**
     * Get import mode
     * 
     * @return string
     */
    public function getMode(): string
    {
        return $this->validated()['mode'] ?? 'preview';
    }

    /**
     * Check if this is preview mode
     * 
     * @return bool
     */
    public function isPreviewMode(): bool
    {
        return $this->getMode() === 'preview';
    }

    /**
     * Check if this is execute mode
     * 
     * @return bool
     */
    public function isExecuteMode(): bool
    {
        return $this->getMode() === 'execute';
    }

    /**
     * Check if authorization failed
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    protected function failedAuthorization()
    {
        abort(403, 'Only admin can import wallet data');
    }
}
