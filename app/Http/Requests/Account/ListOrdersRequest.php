<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use App\Enums\OrderStatus;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ListOrdersRequest extends FormRequest
{
    public function authorize(): Response
    {
        return $this->user() !== null ? Response::allow() : Response::denyAsNotFound();
    }

    public function status(): ?OrderStatus
    {
        $value = $this->string('status')->toString();

        return $value !== '' ? OrderStatus::tryFrom($value) : null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string'],
        ];
    }
}
