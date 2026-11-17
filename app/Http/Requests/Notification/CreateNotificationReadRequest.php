<?php

declare(strict_types=1);

namespace App\Http\Requests\Notification;

use App\Enums\Workspace;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateNotificationReadRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();

        if (! $user instanceof User) {
            return Response::deny();
        }

        // The seller inbox only exists for users who operate a shop.
        if ($this->input('workspace') === Workspace::Seller->value && $user->operatedShop() === null) {
            return Response::denyAsNotFound();
        }

        return Response::allow();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'id' => ['nullable', 'string'],
            'workspace' => ['nullable', Rule::in([Workspace::Buyer->value, Workspace::Seller->value])],
        ];
    }
}
