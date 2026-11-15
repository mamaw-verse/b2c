<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use App\Rules\AdminCandidate;
use App\Rules\ConfirmAdminPromotion;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateAdminAccountRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin() ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $email = $this->string('email')->lower()->trim()->toString();
        $isNewEmail = $email === '' || ! User::query()->where('email', $email)->exists();

        return [
            'name' => [
                Rule::requiredIf($isNewEmail),
                'nullable',
                'string',
                'max:255',
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                new AdminCandidate,
            ],
            'confirm_promote' => [
                'boolean',
                new ConfirmAdminPromotion($email !== '' ? $email : null),
            ],
        ];
    }
}
