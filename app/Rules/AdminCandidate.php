<?php

declare(strict_types=1);

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final readonly class AdminCandidate implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        $user = User::query()->where('email', mb_strtolower(mb_trim($value)))->first();

        if ($user === null) {
            return;
        }

        if ($user->isAdmin()) {
            $fail('This user is already an administrator.');

            return;
        }

        if ($user->isSuspended()) {
            $fail('This user is suspended and cannot be made an administrator.');
        }
    }
}
