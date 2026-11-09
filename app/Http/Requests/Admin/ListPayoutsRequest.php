<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PayoutStatus;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ListPayoutsRequest extends FormRequest
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
        return ['status' => ['nullable', 'string']];
    }

    public function status(): ?PayoutStatus
    {
        return PayoutStatus::tryFrom($this->string('status')->toString());
    }
}
