<?php

declare(strict_types=1);

namespace App\Http\Requests\Account;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Closure;
use Illuminate\Auth\Access\Response;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class CreateOrderReturnRequest extends FormRequest
{
    public function authorize(): Response
    {
        $user = $this->user();
        assert($user instanceof User);

        $order = $this->route('order');
        assert($order instanceof Order);

        return $order->user_id === $user->id ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $order = $this->route('order');
        assert($order instanceof Order);

        return [
            'reason' => ['required', 'string', 'max:500'],
            'items' => ['nullable', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'distinct', 'string', Rule::exists('order_items', 'id')->where('order_id', $order->id)],
            'items.*.qty' => ['required', 'integer', 'min:1'],
        ];
    }

    /** @return list<Closure(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $order = $this->route('order');
            assert($order instanceof Order);
            $orderItems = $order->items()->with('refundItems')->get()->keyBy('id');

            foreach ($this->input('items', []) as $index => $line) {
                $item = $orderItems->get($line['order_item_id']);

                if ($item instanceof OrderItem && $line['qty'] > $item->qty - $item->refundedUnits()) {
                    $validator->errors()->add("items.{$index}.qty", 'Quantity exceeds the unrefunded amount.');
                }
            }
        }];
    }
}
