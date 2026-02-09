<?php

namespace App\Http\Requests\Api\V1\Wallet;

use Illuminate\Foundation\Http\FormRequest;

class TopupRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Add authorization logic here if needed (e.g. check permissions)
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:1000',
            'method' => 'required|in:cash,transfer',
            'notes' => 'nullable|string|max:255',
        ];
    }
}
