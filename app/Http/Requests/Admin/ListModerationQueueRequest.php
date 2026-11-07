<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\ModerationItemType;
use App\Enums\ModerationState;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class ListModerationQueueRequest extends FormRequest
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
            'state' => ['nullable', Rule::enum(ModerationState::class)],
            'type' => ['nullable', Rule::enum(ModerationItemType::class)],
            'sla_days' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /** @return array<string, mixed> */
    public function filters(): array
    {
        return $this->only(['state', 'type', 'sla_days']);
    }
}
