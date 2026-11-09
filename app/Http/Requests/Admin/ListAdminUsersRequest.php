<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListAdminUsersRequest extends FormRequest
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
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::in(['buyer', 'admin'])],
            'suspended' => ['nullable', 'boolean'],
        ];
    }

    public function suspended(): ?bool
    {
        if (! $this->has('suspended') || $this->input('suspended') === '') {
            return null;
        }

        return $this->boolean('suspended');
    }
}
