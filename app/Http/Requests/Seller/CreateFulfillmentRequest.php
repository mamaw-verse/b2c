<?php

declare(strict_types=1);

namespace App\Http\Requests\Seller;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

final class CreateFulfillmentRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $order = $this->route('order');
        assert($order instanceof Order);

        return ($user->isSeller() && $user->shop && $order->shop_id === $user->shop->id && $order->status === OrderStatus::ToShip)
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'courier_name' => ['required', 'string', 'max:100'],
            'tracking_number' => ['required', 'string', 'max:100'],
            'tracking_url' => ['nullable', 'url', 'max:255'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'distinct', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<int, Closure(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $order = $this->route('order');
            assert($order instanceof Order);

            $items = $order->items->keyBy('id');

            foreach ($this->input('items', []) as $index => $line) {
                $item = $items->get($line['order_item_id'] ?? null);

                if ($item === null) {
                    $validator->errors()->add("items.{$index}.order_item_id", 'This item does not belong to the order.');
                } elseif ((int) ($line['quantity'] ?? 0) > $item->remainingQuantity()) {
                    $validator->errors()->add("items.{$index}.quantity", 'Quantity exceeds the unfulfilled amount.');
                }
            }
        }];
    }
}
