<?php

declare(strict_types=1);

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

final class PasswordUpdateRequest extends FormRequest
{
    use PasswordValidationRules;

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Google-only accounts have no password yet, so they set one without confirming.
            'current_password' => $this->user()?->hasPassword() === false ? ['nullable'] : $this->currentPasswordRules(),
            'password' => $this->passwordRules(),
        ];
    }
}
