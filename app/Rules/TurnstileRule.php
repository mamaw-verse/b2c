<?php

declare(strict_types=1);

namespace App\Rules;

use App\Services\TurnstileVerifier;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class TurnstileRule implements ValidationRule
{
    /**
     * Rules for the `cf-turnstile-response` field: required and verified while
     * the human check is enabled, ignored when the kill switch is off.
     *
     * @return array<int, string|self>
     */
    public static function rules(): array
    {
        return (bool) config('humancheck.enabled', true)
            ? ['required', 'string', new self]
            : ['nullable'];
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            $fail(__('The CAPTCHA validation failed. Please try again.'));

            return;
        }

        /** @var TurnstileVerifier $verifier */
        $verifier = app(TurnstileVerifier::class);

        $result = $verifier->verify(
            token: $value,
            remoteIp: request()->ip(),
        );

        if (! $result->success) {
            $fail(__('The CAPTCHA validation failed. Please try again.'));
        }
    }
}
