<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;

final class ResolveOrderReturnRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $order = $this->route('order');
        assert($order instanceof Order);

        if (! $user->isSeller() || ! $user->shop || $order->shop_id !== $user->shop->id) {
            return Response::denyAsNotFound();
        }

        return $order->status === OrderStatus::ReturnRefund
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'decision' => ['required', 'in:approve,reject'],
            'note' => ['required_if:decision,reject', 'nullable', 'string', 'max:500'],
        ];
    }
}
