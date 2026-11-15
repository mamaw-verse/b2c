<?php

declare(strict_types=1);

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final readonly class ConfirmAdminPromotion implements ValidationRule
{
    public function __construct(private ?string $email) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($this->email === null || mb_trim($this->email) === '') {
            return;
        }

        $user = User::query()->where('email', mb_strtolower(mb_trim($this->email)))->first();

        if ($user !== null && ! $user->isAdmin() && ! $user->isSuspended() && ! filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
            $fail("{$user->name} already has an account. Make them an admin?");
        }
    }
}
