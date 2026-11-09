<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use App\Enums\OrderStatus;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ShowReviewRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $orderItem = $this->route('orderItem');
        assert($orderItem instanceof OrderItem);

        $orderItem->loadMissing('order');

        return $orderItem->order->user_id === $user->id && $orderItem->order->status === OrderStatus::Completed
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /** @return array{} */
    public function rules(): array
    {
        return [];
    }
}
