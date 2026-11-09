<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateModerationDecisionRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user()?->isAdmin()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in(['approved', 'rejected', 'hidden', 'suspended'])],
            'reason' => ['required', 'string', 'max:1000'],
            'reason_code' => ['nullable', 'string', 'max:100'],
        ];
    }

    /** @return 'approved'|'rejected'|'hidden'|'suspended' */
    public function action(): string
    {
        return $this->validated('action');
    }

    public function decisionReason(): string
    {
        return $this->string('reason')->toString();
    }
}
