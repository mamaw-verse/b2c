<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use App\Enums\OrderStatus;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class CreateReviewRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $orderItem = $this->route('orderItem');
        assert($orderItem instanceof OrderItem);

        $orderItem->loadMissing('order');

        if ($orderItem->order->user_id !== $user->id) {
            return Response::denyAsNotFound();
        }

        if ($orderItem->order->status !== OrderStatus::Completed) {
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
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['nullable', 'string', 'max:500'],
            'anonymous' => ['boolean'],
            'photos' => ['nullable', 'array', 'max:5'],
            'photos.*' => ['image', 'max:5120'],
        ];
    }
}
